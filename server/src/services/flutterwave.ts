import { db } from '../db/index.ts';
import type { Order } from '../types/index.ts';
import { logAudit } from '../utils/logger.ts';


const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-mock-key';
const FLW_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || 'eu_bite_flutterwave_secret_webhook_hash';

export interface FlutterwavePaymentLinkRequest {
  tx_ref: string;
  amount_ngn: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId?: string;
  amount_kobo?: number;
  status: 'successful' | 'failed';
  flw_ref?: string;
  message: string;
}

// In-Memory processed webhook event tracking for idempotency
const processedWebhookRefs = new Set<string>();

export class FlutterwaveService {
  /**
   * Generates a standard Flutterwave hosted checkout payment link or a direct payment redirect.
   */
  static async createPaymentLink(order: Order, customerName: string, customerEmail: string, customerPhone: string): Promise<{ paymentUrl: string; tx_ref: string }> {
    const tx_ref = order.flutterwave_tx_ref || `EUB-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount_ngn = order.total_amount_kobo / 100;
    const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-confirmation?orderNumber=${order.order_number}`;

    // If live API key is configured and not in test/mock mode, call Flutterwave API
    if (FLW_SECRET_KEY && !FLW_SECRET_KEY.includes('mock') && !FLW_SECRET_KEY.includes('TEST-xxxx')) {
      try {
        const response = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref,
            amount: amount_ngn,
            currency: 'NGN',
            redirect_url,
            customer: {
              email: customerEmail,
              phonenumber: customerPhone,
              name: customerName,
            },
            customizations: {
              title: 'EU Bite Campus Food Order',
              description: `Payment for Order #${order.order_number} (${order.hostel})`,
              logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80',
            },
          }),
        });

        const data = (await response.json()) as any;
        if (data && data.status === 'success' && data.data?.link) {
          return { paymentUrl: data.data.link, tx_ref };
        }
      } catch (err) {
        console.warn('[Flutterwave] Direct API call error, falling back to simulated checkout endpoint:', err);
      }
    }

    // Default Hosted Checkout URL / Sandbox Portal
    const fallbackPaymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/pay?tx_ref=${tx_ref}&amount=${amount_ngn}&order=${order.order_number}`;
    return { paymentUrl: fallbackPaymentUrl, tx_ref };
  }

  /**
   * Validates Flutterwave webhook signature hash
   */
  static verifyWebhookSignature(providedHash?: string): boolean {
    if (!providedHash) return false;
    return providedHash === FLW_SECRET_HASH;
  }

  /**
   * Idempotent processing of payment verification.
   * Ensures an order is never credited twice.
   */
  static async processPaymentVerification(tx_ref: string, flw_ref?: string, status: string = 'successful'): Promise<PaymentVerificationResult> {
    // 1. Idempotency Check
    const idempotencyKey = `${tx_ref}-${status}`;
    if (processedWebhookRefs.has(idempotencyKey)) {
      return {
        verified: true,
        status: 'successful',
        message: 'Payment already processed previously (Idempotent replay).',
      };
    }

    // 2. Find Order by tx_ref
    let targetOrder: Order | undefined;
    for (const order of db.orders.values()) {
      if (order.flutterwave_tx_ref === tx_ref) {
        targetOrder = order;
        break;
      }
    }

    if (!targetOrder) {
      return {
        verified: false,
        status: 'failed',
        message: `No order found matching transaction reference ${tx_ref}`,
      };
    }

    // 3. Prevent duplicate transitions if already paid
    if (targetOrder.payment_status === 'successful' && targetOrder.status !== 'pending_payment') {
      processedWebhookRefs.add(idempotencyKey);
      return {
        verified: true,
        orderId: targetOrder.id,
        amount_kobo: targetOrder.total_amount_kobo,
        status: 'successful',
        flw_ref: targetOrder.flutterwave_flw_ref,
        message: 'Order already marked as paid.',
      };
    }

    // 4. Update order state atomically
    if (status === 'successful') {
      targetOrder.payment_status = 'successful';
      targetOrder.status = 'paid';
      targetOrder.paid_at = new Date().toISOString();
      targetOrder.flutterwave_flw_ref = flw_ref || `FLW-VERIFIED-${Date.now()}`;
      targetOrder.updated_at = new Date().toISOString();

      // Deduct packaging inventory if assigned
      if (targetOrder.packaging_type_id) {
        const packType = db.packagingTypes.get(targetOrder.packaging_type_id);
        if (packType) {
          packType.stock_count = Math.max(0, packType.stock_count - (targetOrder.packaging_qty || 1));
          db.packagingTypes.set(packType.id, packType);

          // Log transaction
          const transId = crypto.randomUUID();
          db.packTransactions.set(transId, {
            id: transId,
            pack_type_id: packType.id,
            order_id: targetOrder.id,
            student_id: targetOrder.student_id,
            vendor_id: targetOrder.restaurant_id,
            transaction_type: 'issued',
            quantity: targetOrder.packaging_qty || 1,
            notes: `Issued for Order #${targetOrder.order_number}`,
            created_at: new Date().toISOString(),
          });
        }
      }

      db.orders.set(targetOrder.id, targetOrder);
      processedWebhookRefs.add(idempotencyKey);

      logAudit(
        'ORDER_PAYMENT_VERIFIED',
        'orders',
        targetOrder.id,
        undefined,
        'system',
        {
          tx_ref,
          flw_ref: targetOrder.flutterwave_flw_ref,
          amount_kobo: targetOrder.total_amount_kobo,
          order_number: targetOrder.order_number,
        }
      );

      return {
        verified: true,
        orderId: targetOrder.id,
        amount_kobo: targetOrder.total_amount_kobo,
        status: 'successful',
        flw_ref: targetOrder.flutterwave_flw_ref,
        message: 'Order payment successfully verified and marked as paid.',
      };
    } else {
      targetOrder.payment_status = 'failed';
      targetOrder.updated_at = new Date().toISOString();
      db.orders.set(targetOrder.id, targetOrder);

      return {
        verified: false,
        orderId: targetOrder.id,
        status: 'failed',
        message: 'Payment reported as failed or cancelled.',
      };
    }
  }
}
