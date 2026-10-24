import { createRouter as Router } from '../utils/expressCompat.ts';
import { db } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { Rider } from '../types/index.ts';

const router = Router();

function getRiderProfile(userId: string): Rider | undefined {
  for (const r of db.riders.values()) {
    if (r.user_id === userId) return r;
  }
  return undefined;
}

// GET /api/dispatch/rider-stats
router.get('/rider-stats', authenticate, requireRole('rider'), (req: any, res: any): void => {
  const rider = getRiderProfile(req.user!.userId);
  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider profile not found' });
    return;
  }

  let activeOrder: any = null;
  for (const o of db.orders.values()) {
    if (o.rider_id === rider.id && (o.status === 'rider_assigned' || o.status === 'in_transit')) {
      const rest = db.restaurants.get(o.restaurant_id);
      const items = Array.from(db.orderItems.values()).filter((i) => i.order_id === o.id);
      activeOrder = {
        ...o,
        restaurant_name: rest?.name,
        restaurant_phone: rest?.phone,
        items,
        delivery_pin: '****',
      };
      break;
    }
  }

  res.json({
    success: true,
    data: {
      rider,
      activeOrder,
    },
  });
});

// PATCH /api/dispatch/toggle-online
router.patch('/toggle-online', authenticate, requireRole('rider'), (req: any, res: any): void => {
  const rider = getRiderProfile(req.user!.userId);
  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider profile not found' });
    return;
  }

  if (rider.approval_status !== 'approved') {
    res.status(403).json({
      success: false,
      error: `Rider account is '${rider.approval_status}'. You must be approved by campus admin before going online.`,
    });
    return;
  }

  const { is_online } = req.body;
  rider.is_online = is_online !== undefined ? Boolean(is_online) : !rider.is_online;
  rider.updated_at = new Date().toISOString();
  db.riders.set(rider.id, rider);

  logAudit('RIDER_ONLINE_TOGGLED', 'riders', rider.id, req.user!.userId, 'rider', { is_online: rider.is_online });

  res.json({
    success: true,
    message: `Rider status updated to ${rider.is_online ? 'ONLINE' : 'OFFLINE'}`,
    is_online: rider.is_online,
  });
});

// GET /api/dispatch/available
router.get('/available', authenticate, requireRole('rider'), (req: any, res: any): void => {
  const rider = getRiderProfile(req.user!.userId);
  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider profile not found' });
    return;
  }

  if (rider.approval_status !== 'approved') {
    res.status(403).json({ success: false, error: 'Rider must be approved by campus admin.' });
    return;
  }

  if (!rider.is_online) {
    res.status(400).json({ success: false, error: 'Rider is currently offline. Turn on availability to view orders.' });
    return;
  }

  const availableOrders: any[] = [];
  for (const o of db.orders.values()) {
    if (o.status === 'ready_for_pickup' && !o.rider_id && o.payment_status === 'successful') {
      const rest = db.restaurants.get(o.restaurant_id);
      const items = Array.from(db.orderItems.values()).filter((i) => i.order_id === o.id);
      const pack = o.packaging_type_id ? db.packagingTypes.get(o.packaging_type_id) : undefined;

      availableOrders.push({
        id: o.id,
        order_number: o.order_number,
        restaurant_name: rest?.name,
        restaurant_phone: rest?.phone,
        hostel: o.hostel,
        room: o.room,
        food_subtotal_ngn: o.food_subtotal_kobo / 100,
        delivery_fee_ngn: o.delivery_fee_kobo / 100,
        rider_earnings_ngn: 250,
        items_count: items.length,
        packaging_type: pack?.name || 'Standard Pack',
        created_at: o.created_at,
        prepared_at: o.prepared_at,
      });
    }
  }

  res.json({ success: true, count: availableOrders.length, data: availableOrders });
});

// POST /api/dispatch/:id/claim
router.post('/:id/claim', authenticate, requireRole('rider'), async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const rider = getRiderProfile(req.user!.userId);

  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider profile not found' });
    return;
  }

  if (rider.approval_status !== 'approved') {
    res.status(403).json({ success: false, error: 'Rider is not approved.' });
    return;
  }

  if (!rider.is_online) {
    res.status(400).json({ success: false, error: 'You must be online to claim orders.' });
    return;
  }

  for (const o of db.orders.values()) {
    if (o.rider_id === rider.id && (o.status === 'rider_assigned' || o.status === 'in_transit')) {
      res.status(400).json({
        success: false,
        error: `You already have an active delivery (${o.order_number}). Complete it before claiming another.`,
      });
      return;
    }
  }

  const claimResult = await db.atomicClaimOrder(id, rider.id);
  if (!claimResult.success) {
    res.status(409).json({ success: false, error: claimResult.message });
    return;
  }

  logAudit('ORDER_CLAIMED_BY_RIDER', 'orders', id, req.user!.userId, 'rider', { rider_id: rider.id });

  const claimedOrder = claimResult.order!;
  const rest = db.restaurants.get(claimedOrder.restaurant_id);

  res.json({
    success: true,
    message: 'Delivery successfully claimed! Please proceed to pickup at the restaurant.',
    data: {
      ...claimedOrder,
      restaurant_name: rest?.name,
      restaurant_phone: rest?.phone,
      delivery_pin: '****',
    },
  });
});

// POST /api/dispatch/:id/pickup
router.post('/:id/pickup', authenticate, requireRole('rider'), (req: any, res: any): void => {
  const { id } = req.params;
  const rider = getRiderProfile(req.user!.userId);

  const order = db.orders.get(id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (order.rider_id !== rider?.id) {
    res.status(403).json({ success: false, error: 'Forbidden: You are not assigned to this delivery.' });
    return;
  }

  if (order.status !== 'rider_assigned') {
    res.status(400).json({ success: false, error: `Cannot mark picked up from status '${order.status}'.` });
    return;
  }

  order.status = 'in_transit';
  order.picked_up_at = new Date().toISOString();
  order.updated_at = new Date().toISOString();
  db.orders.set(order.id, order);

  logAudit('ORDER_PICKED_UP', 'orders', order.id, req.user!.userId, 'rider');

  res.json({
    success: true,
    message: 'Order picked up! Now in transit to student hostel.',
    data: {
      ...order,
      delivery_pin: '****',
    },
  });
});

// POST /api/dispatch/:id/deliver
router.post('/:id/deliver', authenticate, requireRole('rider'), (req: any, res: any): void => {
  const { id } = req.params;
  const { pin } = req.body;
  const rider = getRiderProfile(req.user!.userId);

  if (!pin || pin.toString().length !== 4) {
    res.status(400).json({ success: false, error: 'A 4-digit student delivery PIN is required.' });
    return;
  }

  const order = db.orders.get(id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (order.rider_id !== rider?.id) {
    res.status(403).json({ success: false, error: 'Forbidden: You are not assigned to this delivery.' });
    return;
  }

  if (order.status !== 'in_transit' && order.status !== 'rider_assigned') {
    res.status(400).json({ success: false, error: `Order is already in state '${order.status}'.` });
    return;
  }

  if (order.pin_attempts >= 5) {
    res.status(429).json({
      success: false,
      error: 'Security lock: Exceeded maximum allowed PIN attempts. Please contact campus admin support.',
    });
    return;
  }

  if (order.delivery_pin !== pin.toString().trim()) {
    order.pin_attempts += 1;
    order.updated_at = new Date().toISOString();
    db.orders.set(order.id, order);

    logAudit('DELIVERY_PIN_FAILED', 'orders', order.id, req.user!.userId, 'rider', { attempts: order.pin_attempts });

    res.status(400).json({
      success: false,
      error: `Invalid delivery PIN. ${5 - order.pin_attempts} attempts remaining. Please ask the student to recheck their order screen or WhatsApp.`,
    });
    return;
  }

  order.status = 'delivered';
  order.delivered_at = new Date().toISOString();
  order.updated_at = new Date().toISOString();
  db.orders.set(order.id, order);

  const riderPayoutKobo = db.platformSettings.get('rider_delivery_payout_kobo')?.value_json || 25000;
  if (rider) {
    rider.total_deliveries += 1;
    rider.total_earnings_kobo += riderPayoutKobo;
    rider.updated_at = new Date().toISOString();
    db.riders.set(rider.id, rider);
  }

  logAudit('ORDER_DELIVERED_SUCCESS', 'orders', order.id, req.user!.userId, 'rider', {
    order_number: order.order_number,
    payout_kobo: riderPayoutKobo,
  });

  res.json({
    success: true,
    message: 'Delivery successfully completed and verified! Earnings credited to your wallet.',
    data: {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      delivered_at: order.delivered_at,
      earned_ngn: riderPayoutKobo / 100,
      total_rider_earnings_ngn: (rider?.total_earnings_kobo || 0) / 100,
    },
  });
});

export default router;
