import { createRouter as Router } from '../utils/expressCompat.ts';
import crypto from 'node:crypto';
import { z } from '../utils/zodCompat.ts';
import { db } from '../db/index.ts';
import { authenticate } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { Order, OrderItem, OrderStatus } from '../types/index.ts';

const router = Router();

const createOrderSchema = z.object({
  restaurant_id: z.string(),
  items: z.array(
    z.object({
      menu_item_id: z.string(),
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    })
  ).min(1),
  packaging_type_id: z.string().optional(),
  packaging_qty: z.number().int().positive().default(1),
  hostel: z.string().min(2),
  room: z.string().min(1),
  delivery_notes: z.string().optional(),
  student_id: z.string().optional(),
});

function generateDeliveryPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateOrderNumber(): string {
  const d = new Date();
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `EUB-${yearMonth}-${randomSuffix}`;
}

// POST /api/orders
router.post('/', authenticate, async (req: any, res: any): Promise<void> => {
  try {
    const data = createOrderSchema.parse(req.body);

    let studentId = data.student_id;
    if (!studentId) {
      for (const s of db.students.values()) {
        if (s.user_id === req.user!.userId) {
          studentId = s.id;
          break;
        }
      }
    }

    if (!studentId) {
      studentId = crypto.randomUUID();
      db.students.set(studentId, {
        id: studentId,
        user_id: req.user!.userId,
        student_id: `EU/${new Date().getFullYear()}/STU/${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Undergraduate',
        academic_level: '100L',
        default_hostel: data.hostel,
        default_room: data.room,
        phone_number: req.user!.email,
        pack_allowance_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const restaurant = db.restaurants.get(data.restaurant_id);
    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Selected restaurant does not exist.' });
      return;
    }
    if (!restaurant.is_active || !restaurant.is_accepting_orders) {
      res.status(400).json({ success: false, error: `${restaurant.name} is currently closed or not accepting orders.` });
      return;
    }

    let food_subtotal_kobo = 0;
    const validatedItems: Array<{ item_id: string; name: string; unit_price: number; quantity: number; total: number; notes?: string }> = [];

    for (const reqItem of data.items) {
      const menuItem = db.menuItems.get(reqItem.menu_item_id);
      if (!menuItem) {
        res.status(404).json({ success: false, error: `Menu item with ID ${reqItem.menu_item_id} not found.` });
        return;
      }
      if (menuItem.restaurant_id !== restaurant.id) {
        res.status(400).json({ success: false, error: `Item '${menuItem.name}' does not belong to ${restaurant.name}.` });
        return;
      }
      if (!menuItem.is_available) {
        res.status(400).json({ success: false, error: `Item '${menuItem.name}' is currently sold out.` });
        return;
      }

      const itemTotal = menuItem.price_kobo * reqItem.quantity;
      food_subtotal_kobo += itemTotal;
      validatedItems.push({
        item_id: menuItem.id,
        name: menuItem.name,
        unit_price: menuItem.price_kobo,
        quantity: reqItem.quantity,
        total: itemTotal,
        notes: reqItem.notes,
      });
    }

    const minSetting = db.platformSettings.get('min_food_subtotal_kobo')?.value_json || 150000;
    if (food_subtotal_kobo < minSetting) {
      res.status(400).json({
        success: false,
        error: `Order does not meet minimum food subtotal. Minimum required is ₦${(minSetting / 100).toLocaleString()}, but current food subtotal is ₦${(food_subtotal_kobo / 100).toLocaleString()}.`,
      });
      return;
    }

    let packaging_fee_kobo = 0;
    let packagingTypeId = data.packaging_type_id;
    const packaging_qty = data.packaging_qty || 1;
    if (packagingTypeId) {
      const pack = db.packagingTypes.get(packagingTypeId);
      if (pack && pack.is_active) {
        packaging_fee_kobo = pack.fee_kobo * packaging_qty;
      }
    } else {
      for (const p of db.packagingTypes.values()) {
        if (p.code === 'reusable' && p.is_active) {
          packagingTypeId = p.id;
          packaging_fee_kobo = p.fee_kobo * packaging_qty;
          break;
        }
      }
    }

    const delivery_fee_kobo = db.platformSettings.get('hostel_delivery_fee_kobo')?.value_json || 32000;
    const service_fee_kobo = db.platformSettings.get('service_fee_kobo')?.value_json || 10000;
    const total_amount_kobo = food_subtotal_kobo + packaging_fee_kobo + delivery_fee_kobo + service_fee_kobo;

    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const deliveryPin = generateDeliveryPin();
    const txRef = `EUB-${orderNumber}-${Date.now()}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      order_number: orderNumber,
      student_id: studentId,
      restaurant_id: restaurant.id,
      status: 'pending_payment',
      food_subtotal_kobo,
      packaging_fee_kobo,
      packaging_type_id: packagingTypeId,
      packaging_qty,
      delivery_fee_kobo,
      service_fee_kobo,
      total_amount_kobo,
      hostel: data.hostel,
      room: data.room,
      delivery_notes: data.delivery_notes,
      delivery_pin: deliveryPin,
      pin_attempts: 0,
      flutterwave_tx_ref: txRef,
      payment_status: 'unpaid',
      created_at: now,
      updated_at: now,
    };
    db.orders.set(orderId, order);

    for (const vi of validatedItems) {
      const orderItemId = crypto.randomUUID();
      const orderItem: OrderItem = {
        id: orderItemId,
        order_id: orderId,
        menu_item_id: vi.item_id,
        item_name: vi.name,
        unit_price_kobo: vi.unit_price,
        quantity: vi.quantity,
        total_price_kobo: vi.total,
        notes: vi.notes,
        created_at: now,
      };
      db.orderItems.set(orderItemId, orderItem);
    }

    logAudit('ORDER_CREATED', 'orders', orderId, req.user!.userId, req.user!.role, {
      order_number: orderNumber,
      total_amount_kobo,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment to notify vendor.',
      data: {
        ...order,
        items: validatedItems,
        formatted_totals: {
          food_subtotal_ngn: food_subtotal_kobo / 100,
          packaging_fee_ngn: packaging_fee_kobo / 100,
          delivery_fee_ngn: delivery_fee_kobo / 100,
          service_fee_ngn: service_fee_kobo / 100,
          grand_total_ngn: total_amount_kobo / 100,
        },
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to create order' });
  }
});

// GET /api/orders
router.get('/', authenticate, (req: any, res: any): void => {
  const { role, userId } = req.user!;
  const ordersList: any[] = [];

  for (const order of db.orders.values()) {
    let include = false;

    if (role === 'admin') {
      include = true;
    } else if (role === 'student') {
      for (const s of db.students.values()) {
        if (s.user_id === userId && s.id === order.student_id) {
          include = true;
          break;
        }
      }
    } else if (role === 'vendor') {
      for (const rest of db.restaurants.values()) {
        if (rest.vendor_user_id === userId && rest.id === order.restaurant_id) {
          include = true;
          break;
        }
      }
    } else if (role === 'rider') {
      for (const r of db.riders.values()) {
        if (r.user_id === userId && r.id === order.rider_id) {
          include = true;
          break;
        }
      }
    }

    if (include) {
      const rest = db.restaurants.get(order.restaurant_id);
      const items = Array.from(db.orderItems.values()).filter((i) => i.order_id === order.id);
      const pack = order.packaging_type_id ? db.packagingTypes.get(order.packaging_type_id) : undefined;
      const rider = order.rider_id ? db.riders.get(order.rider_id) : undefined;

      const safeOrder = {
        ...order,
        restaurant_name: rest?.name || 'Unknown Restaurant',
        restaurant_phone: rest?.phone,
        packaging_type_name: pack?.name,
        rider_details: rider ? { id: rider.id, vehicle_type: rider.vehicle_type } : null,
        items,
        delivery_pin: role === 'student' || role === 'admin' ? order.delivery_pin : '****',
      };
      ordersList.push(safeOrder);
    }
  }

  ordersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ success: true, count: ordersList.length, data: ordersList });
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req: any, res: any): void => {
  const { id } = req.params;
  const order = db.orders.get(id);

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const rest = db.restaurants.get(order.restaurant_id);
  const items = Array.from(db.orderItems.values()).filter((i) => i.order_id === order.id);
  const pack = order.packaging_type_id ? db.packagingTypes.get(order.packaging_type_id) : undefined;

  const safeOrder = {
    ...order,
    restaurant_name: rest?.name || 'Unknown Restaurant',
    restaurant_phone: rest?.phone,
    packaging_type_name: pack?.name,
    items,
    delivery_pin: req.user!.role === 'student' || req.user!.role === 'admin' ? order.delivery_pin : '****',
  };

  res.json({ success: true, data: safeOrder });
});

// PATCH /api/orders/:id/vendor-status
router.patch('/:id/vendor-status', authenticate, (req: any, res: any): void => {
  const { id } = req.params;
  const { status } = req.body;

  const order = db.orders.get(id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const restaurant = db.restaurants.get(order.restaurant_id);
  if (!restaurant || (req.user!.role !== 'admin' && restaurant.vendor_user_id !== req.user!.userId)) {
    res.status(403).json({ success: false, error: 'Forbidden: You do not manage this restaurant.' });
    return;
  }

  if (order.payment_status !== 'successful') {
    res.status(400).json({ success: false, error: 'Cannot process an unpaid order. Payment must be verified first.' });
    return;
  }

  const allowedStatuses: OrderStatus[] = ['vendor_accepted', 'preparing', 'ready_for_pickup', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status transition. Allowed: ${allowedStatuses.join(', ')}` });
    return;
  }

  order.status = status;
  if (status === 'ready_for_pickup') {
    order.prepared_at = new Date().toISOString();
  }
  order.updated_at = new Date().toISOString();
  db.orders.set(order.id, order);

  logAudit('ORDER_VENDOR_STATUS_UPDATED', 'orders', order.id, req.user!.userId, req.user!.role, { new_status: status });

  res.json({ success: true, message: `Order updated to '${status}'.`, data: order });
});

export default router;
