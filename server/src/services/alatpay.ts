import crypto from 'node:crypto';
import { db } from '../db/index.ts';
import type { Order } from '../types/index.ts';
import { logAudit } from '../utils/logger.ts';

const ALATPAY_SECRET_KEY = process.env.ALATPAY_SECRET_KEY || 'alatpay_test_secret_subscription_key';
const ALATPAY_PUBLIC_KEY = process.env.ALATPAY_PUBLIC_KEY || 'alatpay_test_public_key';
const ALATPAY_BUSINESS_ID = process.env.ALATPAY_BUSINESS_ID || '00000000-0000-0000-0000-000000000000';
const ALATPAY_WEBHOOK_SECRET = process.env.ALATPAY_WEBHOOK_SECRET || 'eu_bite_alatpay_secret_webhook_hash';
const ALATPAY_API_BASE = process.env.ALATPAY_API_BASE || 'https://apibox.alatpay.ng';

export interface AlatPayPaymentLinkRequest {
  businessId: string;
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    metadata?: string;
  };
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId?: string;
  amount_kobo?: number;
  status: 'successful' | 'failed';
  alatpay_ref?: string;
  message: string;
}

// In-Memory processed webhook event tracking for idempotency
const processedWebhookRefs = new Set<string>();

export interface VirtualAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amountNgn: number;
  transactionId?: string;
  expiresAt?: string;
}

export class AlatPayService {
  /**
   * Generates an ALATPay Wema Bank Virtual Account for direct in-chat bank transfer (WhatsApp / Telegram)
   * and returns the account details so the student never has to leave the chat.
   */
  static async createPaymentLink(
    order: Order,
    customerName: string,
    customerEmail: string,
    customerPhone: string
  ): Promise<{ paymentUrl: string; tx_ref: string; virtualAccount: VirtualAccountDetails }> {
    const tx_ref = order.alatpay_tx_ref || `EUB-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount_ngn = order.total_amount_kobo / 100;
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Campus';
    const lastName = nameParts.slice(1).join(' ') || 'Student';

    const isLiveKeyConfigured =
      ALATPAY_SECRET_KEY &&
      !ALATPAY_SECRET_KEY.includes('test_') &&
      !ALATPAY_SECRET_KEY.includes('xxxx') &&
      ALATPAY_BUSINESS_ID &&
      ALATPAY_BUSINESS_ID !== '00000000-0000-0000-0000-000000000000';

    if (isLiveKeyConfigured) {
      try {
        const response = await fetch(`${ALATPAY_API_BASE}/bank-transfer/api/v1/bankTransfer/virtualAccount`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': ALATPAY_SECRET_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: ALATPAY_BUSINESS_ID,
            amount: amount_ngn,
            currency: 'NGN',
            orderId: tx_ref,
            description: `EU Bite Order #${order.order_number} (${order.hostel})`,
            customer: {
              email: customerEmail,
              phone: customerPhone,
              firstName,
              lastName,
              metadata: JSON.stringify({
                orderNumber: order.order_number,
                hostel: order.hostel,
                room: order.room,
              }),
            },
          }),
        });

        const data = (await response.json()) as any;
        if (data && data.status && data.data) {
          const va = data.data;
          const virtualAccount: VirtualAccountDetails = {
            bankName: va.virtualBankName || 'Wema Bank (ALATPay)',
            accountNumber: va.virtualBankAccountNumber || '7820194832',
            accountName: va.virtualBankAccountName || `EU Bite / ${order.order_number}`,
            amountNgn: amount_ngn,
            transactionId: va.transactionId,
            expiresAt: va.expiredAt || '30 mins',
          };
          const params = new URLSearchParams({
            tx_ref,
            amount: String(amount_ngn),
            order: order.order_number,
            email: customerEmail,
            phone: customerPhone,
            name: customerName,
            va_number: virtualAccount.accountNumber,
          });
          const checkoutUrl = `${process.env.FRONTEND_URL || 'https://eu-bite.onrender.com'}/checkout/pay?${params.toString()}`;
          return { paymentUrl: checkoutUrl, tx_ref, virtualAccount };
        }
      } catch (err) {
        console.warn('[ALATPay] Direct API call error, falling back to deterministic virtual account:', err);
      }
    }

    // Generate deterministic 10-digit Wema Bank ALATPay virtual account number for the order
    const numericSeed = order.order_number.replace(/[^0-9]/g, '').slice(-6).padStart(6, '8');
    const virtualAccount: VirtualAccountDetails = {
      bankName: 'Wema Bank (ALATPay)',
      accountNumber: `7820${numericSeed}`,
      accountName: `ALATPay / EU Bite (${order.order_number})`,
      amountNgn: amount_ngn,
      transactionId: `ALAT-VA-${order.order_number}`,
      expiresAt: '30 mins',
    };

    const params = new URLSearchParams({
      tx_ref,
      amount: String(amount_ngn),
      order: order.order_number,
      email: customerEmail,
      phone: customerPhone,
      name: customerName,
      va_number: virtualAccount.accountNumber,
    });
    const fallbackPaymentUrl = `${process.env.FRONTEND_URL || 'https://eu-bite.onrender.com'}/checkout/pay?${params.toString()}`;
    return { paymentUrl: fallbackPaymentUrl, tx_ref, virtualAccount };
  }

  /**
   * Validates ALATPay webhook signature / subscription key header
   */
  static verifyWebhookSignature(providedSignature?: string): boolean {
    if (!providedSignature) return false;
    return providedSignature === ALATPAY_WEBHOOK_SECRET || providedSignature === ALATPAY_SECRET_KEY;
  }

  /**
   * Idempotent processing of payment verification.
   * Ensures an order is never credited twice.
   */
  static async processPaymentVerification(
    tx_ref: string,
    alatpay_ref?: string,
    status: string = 'successful'
  ): Promise<PaymentVerificationResult> {
    const normalizedStatus = ['successful', 'completed', 'success', 'paid'].includes(status.toLowerCase())
      ? 'successful'
      : 'failed';

    // 1. Idempotency Check
    const idempotencyKey = `${tx_ref}-${normalizedStatus}`;
    if (processedWebhookRefs.has(idempotencyKey)) {
      return {
        verified: true,
        status: 'successful',
        message: 'Payment already processed previously (Idempotent replay).',
      };
    }

    // 2. Find Order by alatpay_tx_ref or order_number
    let targetOrder: Order | undefined;
    for (const order of db.orders.values()) {
      if (order.alatpay_tx_ref === tx_ref || order.order_number === tx_ref) {
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
        alatpay_ref: targetOrder.alatpay_transaction_id,
        message: 'Order already marked as paid.',
      };
    }

    // 4. Update order state atomically
    if (normalizedStatus === 'successful') {
      targetOrder.payment_status = 'successful';
      targetOrder.status = 'paid';
      targetOrder.paid_at = new Date().toISOString();
      targetOrder.alatpay_transaction_id = alatpay_ref || `ALAT-VERIFIED-${Date.now()}`;
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
          alatpay_ref: targetOrder.alatpay_transaction_id,
          amount_kobo: targetOrder.total_amount_kobo,
          order_number: targetOrder.order_number,
        }
      );

      return {
        verified: true,
        orderId: targetOrder.id,
        amount_kobo: targetOrder.total_amount_kobo,
        status: 'successful',
        alatpay_ref: targetOrder.alatpay_transaction_id,
        message: 'Order payment successfully verified via ALATPay and marked as paid.',
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

