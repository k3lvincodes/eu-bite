import { createRouter as Router } from '../utils/expressCompat.ts';
import { db } from '../db/index.ts';
import { authenticate } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { AlatPayService } from '../services/alatpay.ts';
import { logAudit } from '../utils/logger.ts';

const router = Router();

// POST /api/payments/initialize/:orderId
router.post('/initialize/:orderId', authenticate, async (req: any, res: any): Promise<void> => {
  const { orderId } = req.params;
  const order = db.orders.get(orderId);

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (order.payment_status === 'successful') {
    res.status(400).json({ success: false, error: 'Order has already been paid for.' });
    return;
  }

  const user = db.users.get(req.user!.userId);
  const student = db.students.get(order.student_id);

  const customerName = user?.full_name || student?.student_id || 'Campus Student';
  const customerEmail = user?.email || 'student@eubite.com';
  const customerPhone = user?.phone || student?.phone_number || '+2348000000000';

  const { paymentUrl, tx_ref, virtualAccount } = await AlatPayService.createPaymentLink(
    order,
    customerName,
    customerEmail,
    customerPhone
  );

  order.alatpay_tx_ref = tx_ref;
  order.updated_at = new Date().toISOString();
  db.orders.set(order.id, order);

  logAudit('PAYMENT_INITIALIZED', 'orders', order.id, req.user!.userId, req.user!.role, { tx_ref });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
      total_amount_kobo: order.total_amount_kobo,
      total_amount_ngn: order.total_amount_kobo / 100,
      tx_ref,
      paymentUrl,
      ...(virtualAccount ? { virtualAccount } : {}),
    },
  });
});

// POST /api/payments/webhook
router.post('/webhook', async (req: any, res: any): Promise<void> => {
  const signature =
    req.headers?.['x-alatpay-signature'] ||
    req.headers?.['ocp-apim-subscription-key'] ||
    req.headers?.['verif-hash'];

  const isValid = AlatPayService.verifyWebhookSignature(signature);
  if (!isValid && process.env.NODE_ENV === 'production') {
    console.warn('[WEBHOOK] Invalid ALATPay webhook signature from IP:', req.ip);
    res.status(401).json({ success: false, error: 'Unauthorized webhook signature' });
    return;
  }

  const payload = req.body;
  const tx_ref =
    payload?.data?.transactionReference ||
    payload?.data?.orderId ||
    payload?.data?.tx_ref ||
    payload?.transactionReference ||
    payload?.orderId ||
    payload?.tx_ref;
  const alatpay_ref =
    payload?.data?.platformTransactionReference ||
    payload?.data?.transactionId ||
    payload?.data?.alatpay_ref ||
    payload?.platformTransactionReference ||
    payload?.alatpay_ref;
  const status = (payload?.data?.status || payload?.status || '').toLowerCase();

  if (!tx_ref) {
    res.status(400).json({ success: false, error: 'Missing transaction reference (tx_ref / transactionReference)' });
    return;
  }

  const result = await AlatPayService.processPaymentVerification(
    tx_ref,
    alatpay_ref,
    status || 'successful'
  );

  res.status(200).json({ success: true, message: result.message });
});

// POST /api/payments/verify
router.post('/verify', async (req: any, res: any): Promise<void> => {
  const { tx_ref, transactionReference, alatpay_ref, status } = req.body;
  const resolvedRef = tx_ref || transactionReference;

  if (!resolvedRef) {
    res.status(400).json({ success: false, error: 'Transaction reference is required.' });
    return;
  }

  const result = await AlatPayService.processPaymentVerification(
    resolvedRef,
    alatpay_ref,
    status === 'successful' || !status ? 'successful' : status
  );

  if (!result.verified && result.status !== 'successful') {
    res.status(400).json({ success: false, error: result.message });
    return;
  }

  let order: any = null;
  for (const o of db.orders.values()) {
    if (o.alatpay_tx_ref === resolvedRef || o.order_number === resolvedRef) {
      const rest = db.restaurants.get(o.restaurant_id);
      order = {
        ...o,
        restaurant_name: rest?.name,
      };
      break;
    }
  }

  // Proactively notify Bot service (WhatsApp / Telegram)
  if (order) {
    const student = db.students.get(order.student_id);
    const user = student ? db.users.get(student.user_id) : null;
    const targetPhone = user?.phone || student?.phone_number;
    if (targetPhone) {
      fetch('http://localhost:4001/webhook/payment-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.order_number,
          phone: targetPhone,
          deliveryPin: order.delivery_pin,
          restaurantName: order.restaurant_name,
          totalNgn: order.total_amount_kobo / 100,
        }),
      }).catch(() => {});
    }
  }

  res.json({
    success: true,
    message: result.message,
    order,
  });
});


export default router;
