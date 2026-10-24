import { createRouter as Router } from '../utils/expressCompat.ts';
import crypto from 'node:crypto';
import { hashPassword } from '../utils/hash.ts';
import { db } from '../db/index.ts';
import { verifyBotAuth } from '../middleware/auth.ts';
import { FlutterwaveService } from '../services/flutterwave.ts';
import { logAudit } from '../utils/logger.ts';
import type { User, Student, Order, OrderItem } from '../types/index.ts';

const router = Router();

router.use(verifyBotAuth);

// 1. Identify or Auto-register student via WhatsApp phone
router.post('/student-lookup', async (req: any, res: any): Promise<void> => {
  const { phone, fullName, studentId, department, level, hostel, room } = req.body;

  if (!phone) {
    res.status(400).json({ success: false, error: 'Phone number is required' });
    return;
  }

  let user: User | undefined;
  for (const u of db.users.values()) {
    if (u.phone === phone) {
      user = u;
      break;
    }
  }

  let student: Student | undefined;

  if (user) {
    for (const s of db.students.values()) {
      if (s.user_id === user.id) {
        student = s;
        break;
      }
    }
  } else {
    const userId = crypto.randomUUID();
    const newStudentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const hash = hashPassword('WhatsAppStudent123!');

    user = {
      id: userId,
      email: `${phone.replace(/[^0-9]/g, '')}@student.whatsapp.eubite.com`,
      password_hash: hash,
      full_name: fullName || 'WhatsApp Student',
      phone,
      role: 'student',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.users.set(userId, user);

    student = {
      id: newStudentId,
      user_id: userId,
      student_id: studentId || `EU/${new Date().getFullYear()}/WA/${Math.floor(1000 + Math.random() * 9000)}`,
      department: department || 'General Studies',
      academic_level: level || '100L',
      default_hostel: hostel || 'Hostel Block A',
      default_room: room || 'Room 101',
      phone_number: phone,
      pack_allowance_balance: 0,
      created_at: now,
      updated_at: now,
    };
    db.students.set(newStudentId, student);

    logAudit('STUDENT_WHATSAPP_ONBOARDED', 'users', userId, undefined, 'bot', { phone });
  }

  res.json({
    success: true,
    data: {
      userId: user.id,
      fullName: user.full_name,
      phone: user.phone,
      studentId: student?.student_id,
      hostel: student?.default_hostel,
      room: student?.default_room,
      department: student?.department,
    },
  });
});

// 2. Browse restaurants and their menu items
router.get('/restaurants-and-menus', (req: any, res: any): void => {
  const restaurantsWithMenu: any[] = [];

  for (const r of db.restaurants.values()) {
    if (r.is_active && r.is_accepting_orders) {
      const items = Array.from(db.menuItems.values()).filter((i) => i.restaurant_id === r.id && i.is_available);
      restaurantsWithMenu.push({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        opening_time: r.opening_time,
        closing_time: r.closing_time,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          price_kobo: i.price_kobo,
          price_ngn: i.price_kobo / 100,
          description: i.description,
        })),
      });
    }
  }

  res.json({ success: true, count: restaurantsWithMenu.length, data: restaurantsWithMenu });
});

// 3. Initiate checkout
router.post('/checkout', async (req: any, res: any): Promise<void> => {
  try {
    const { phone, restaurant_id, items, packaging_type, hostel, room } = req.body;

    if (!phone || !restaurant_id || !items || !items.length) {
      res.status(400).json({ success: false, error: 'Phone, restaurant_id, and items are required.' });
      return;
    }

    let student: Student | undefined;
    let user: User | undefined;
    for (const u of db.users.values()) {
      if (u.phone === phone) {
        user = u;
        for (const s of db.students.values()) {
          if (s.user_id === u.id) {
            student = s;
            break;
          }
        }
        break;
      }
    }

    if (!user) {
      const userId = crypto.randomUUID();
      const newStudentId = crypto.randomUUID();
      const now = new Date().toISOString();
      const hash = hashPassword('WhatsAppStudent123!');

      user = {
        id: userId,
        email: `${phone.replace(/[^0-9]/g, '')}@student.whatsapp.eubite.com`,
        password_hash: hash,
        full_name: 'WhatsApp Student',
        phone,
        role: 'student',
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      db.users.set(userId, user);

      student = {
        id: newStudentId,
        user_id: userId,
        student_id: `EU/${new Date().getFullYear()}/WA/${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'General Studies',
        academic_level: '100L',
        default_hostel: hostel || 'Nelson Mandela Hall',
        default_room: room || 'Room 101',
        phone_number: phone,
        pack_allowance_balance: 0,
        created_at: now,
        updated_at: now,
      };
      db.students.set(newStudentId, student);
      logAudit('STUDENT_WHATSAPP_ONBOARDED', 'users', userId, undefined, 'bot', { phone });
    } else if (!student) {
      const newStudentId = crypto.randomUUID();
      const now = new Date().toISOString();
      student = {
        id: newStudentId,
        user_id: user.id,
        student_id: `EU/${new Date().getFullYear()}/WA/${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'General Studies',
        academic_level: '100L',
        default_hostel: hostel || 'Nelson Mandela Hall',
        default_room: room || 'Room 101',
        phone_number: phone,
        pack_allowance_balance: 0,
        created_at: now,
        updated_at: now,
      };
      db.students.set(newStudentId, student);
    }

    const restaurant = db.restaurants.get(restaurant_id);
    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    let food_subtotal_kobo = 0;
    const orderItemsList: any[] = [];

    for (const reqItem of items) {
      const menuItem = db.menuItems.get(reqItem.item_id);
      if (!menuItem || menuItem.restaurant_id !== restaurant.id || !menuItem.is_available) {
        res.status(400).json({ success: false, error: `Invalid or unavailable item: ${reqItem.item_id}` });
        return;
      }

      const totalItemKobo = menuItem.price_kobo * reqItem.quantity;
      food_subtotal_kobo += totalItemKobo;
      orderItemsList.push({
        id: menuItem.id,
        name: menuItem.name,
        unit_price_kobo: menuItem.price_kobo,
        quantity: reqItem.quantity,
        total_price_kobo: totalItemKobo,
      });
    }

    const minSetting = db.platformSettings.get('min_food_subtotal_kobo')?.value_json || 150000;
    if (food_subtotal_kobo < minSetting) {
      res.status(400).json({
        success: false,
        error: `Order does not reach the minimum food amount of ₦${minSetting / 100}. Current is ₦${food_subtotal_kobo / 100}.`,
      });
      return;
    }

    let packTypeId: string | undefined;
    let packaging_fee_kobo = 25000;
    for (const p of db.packagingTypes.values()) {
      if (p.code === (packaging_type === 'school' ? 'school' : 'reusable')) {
        packTypeId = p.id;
        packaging_fee_kobo = p.fee_kobo;
        break;
      }
    }

    const delivery_fee_kobo = db.platformSettings.get('hostel_delivery_fee_kobo')?.value_json || 32000;
    const service_fee_kobo = db.platformSettings.get('service_fee_kobo')?.value_json || 10000;
    const total_amount_kobo = food_subtotal_kobo + packaging_fee_kobo + delivery_fee_kobo + service_fee_kobo;

    const orderId = crypto.randomUUID();
    const orderNumber = `EUB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const txRef = `EUB-WA-${orderNumber}-${Date.now()}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      order_number: orderNumber,
      student_id: student.id,
      restaurant_id: restaurant.id,
      status: 'pending_payment',
      food_subtotal_kobo,
      packaging_fee_kobo,
      packaging_type_id: packTypeId,
      packaging_qty: 1,
      delivery_fee_kobo,
      service_fee_kobo,
      total_amount_kobo,
      hostel: hostel || student.default_hostel,
      room: room || student.default_room,
      delivery_pin: deliveryPin,
      pin_attempts: 0,
      flutterwave_tx_ref: txRef,
      payment_status: 'unpaid',
      created_at: now,
      updated_at: now,
    };
    db.orders.set(orderId, order);

    for (const oi of orderItemsList) {
      const oItemId = crypto.randomUUID();
      const itemRecord: OrderItem = {
        id: oItemId,
        order_id: orderId,
        menu_item_id: oi.id,
        item_name: oi.name,
        unit_price_kobo: oi.unit_price_kobo,
        quantity: oi.quantity,
        total_price_kobo: oi.total_price_kobo,
        created_at: now,
      };
      db.orderItems.set(oItemId, itemRecord);
    }

    const { paymentUrl } = await FlutterwaveService.createPaymentLink(order, user.full_name, user.email, user.phone);

    res.json({
      success: true,
      data: {
        order_number: orderNumber,
        restaurant_name: restaurant.name,
        food_subtotal_ngn: food_subtotal_kobo / 100,
        packaging_fee_ngn: packaging_fee_kobo / 100,
        delivery_fee_ngn: delivery_fee_kobo / 100,
        service_fee_ngn: service_fee_kobo / 100,
        total_amount_ngn: total_amount_kobo / 100,
        payment_url: paymentUrl,
        tx_ref: txRef,
        delivery_pin: deliveryPin,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'WhatsApp checkout error' });
  }
});

// 4. Track student active order by phone number
router.get('/orders/active/:phoneNumber', (req: any, res: any): void => {
  const { phoneNumber } = req.params;

  let student: Student | undefined;
  for (const s of db.students.values()) {
    if (s.phone_number === phoneNumber) {
      student = s;
      break;
    }
  }

  if (!student) {
    for (const u of db.users.values()) {
      if (u.phone === phoneNumber) {
        for (const s of db.students.values()) {
          if (s.user_id === u.id) {
            student = s;
            break;
          }
        }
        break;
      }
    }
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'No student found for this phone number' });
    return;
  }

  let activeOrder: any = null;
  for (const o of db.orders.values()) {
    if (o.student_id === student.id && o.status !== 'delivered' && o.status !== 'cancelled') {
      const rest = db.restaurants.get(o.restaurant_id);
      const items = Array.from(db.orderItems.values()).filter((i) => i.order_id === o.id);
      activeOrder = {
        ...o,
        restaurant_name: rest?.name,
        items,
        total_ngn: o.total_amount_kobo / 100,
      };
      break;
    }
  }

  if (!activeOrder) {
    res.status(404).json({ success: false, error: 'No active pending or in-transit order found.' });
    return;
  }

  res.json({ success: true, data: activeOrder });
});

export default router;
