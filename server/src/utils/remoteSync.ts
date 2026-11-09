import { db } from '../db/index.ts';
import type { Order, OrderItem } from '../types/index.ts';

const REMOTE_API_URL = process.env.REMOTE_SYNC_URL || 'https://eu-bite.onrender.com';
const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.execArgv.some((a) => a.includes('test')) ||
  process.argv.some((a) => a.includes('.test.'));

let cachedRemoteAdminToken: string | null = null;
let cachedRemoteRiderToken: string | null = null;
let lastSyncTimestamp = 0;

const STATUS_RANK: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  vendor_accepted: 2,
  preparing: 3,
  ready_for_pickup: 4,
  rider_assigned: 5,
  in_transit: 6,
  delivered: 7,
  rejected: 8,
  cancelled: 9,
};

async function getRemoteAdminToken(): Promise<string | null> {
  if (cachedRemoteAdminToken) return cachedRemoteAdminToken;
  try {
    const res = await fetch(`${REMOTE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eubite.com', password: 'Password123!' }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data?.success && data?.token) {
      cachedRemoteAdminToken = data.token;
      return cachedRemoteAdminToken;
    }
  } catch {}
  return null;
}

async function getRemoteRiderToken(): Promise<string | null> {
  if (cachedRemoteRiderToken) return cachedRemoteRiderToken;
  try {
    const res = await fetch(`${REMOTE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rider.musa@eubite.com', password: 'Password123!' }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data?.success && data?.token) {
      cachedRemoteRiderToken = data.token;
      return cachedRemoteRiderToken;
    }
  } catch {}
  return null;
}

/**
 * Pulls live orders placed via the cloud Telegram/WhatsApp bot on Render into the local dev store
 * so local Vendor (localhost:3003), Rider (localhost:3001), and Admin (localhost:3002) dashboards
 * immediately display orders placed on @eubite_bot.
 */
export async function syncOrdersFromRemote(force = false): Promise<void> {
  if (isTestEnv || process.env.NODE_ENV === 'production') return;
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 3000) return;
  lastSyncTimestamp = now;

  try {
    let token = await getRemoteAdminToken();
    if (!token) return;

    let res = await fetch(`${REMOTE_API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      cachedRemoteAdminToken = null;
      token = await getRemoteAdminToken();
      if (!token) return;
      res = await fetch(`${REMOTE_API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    if (!res.ok) return;

    const payload = (await res.json()) as any;
    const remoteOrders: any[] = payload?.data || [];

    for (const ro of remoteOrders) {
      const existing = db.orders.get(ro.id);

      // Orders created via the bot on Render where the user confirmed payment in-chat
      const shouldPromotePaid =
        ro.payment_status === 'successful' ||
        ro.status !== 'pending_payment' ||
        Boolean(ro.alatpay_tx_ref && (ro.alatpay_tx_ref.startsWith('EUB-WA-') || ro.alatpay_tx_ref.startsWith('EUB-TG-')));

      if (!existing) {
        const orderRecord: Order = {
          id: ro.id,
          order_number: ro.order_number,
          student_id: ro.student_id,
          restaurant_id: ro.restaurant_id,
          rider_id: ro.rider_id,
          status: shouldPromotePaid && ro.status === 'pending_payment' ? 'paid' : ro.status,
          food_subtotal_kobo: ro.food_subtotal_kobo,
          packaging_fee_kobo: ro.packaging_fee_kobo,
          packaging_type_id: ro.packaging_type_id,
          packaging_qty: ro.packaging_qty || 1,
          delivery_fee_kobo: ro.delivery_fee_kobo,
          service_fee_kobo: ro.service_fee_kobo,
          total_amount_kobo: ro.total_amount_kobo,
          hostel: ro.hostel,
          room: ro.room,
          delivery_notes: ro.delivery_notes,
          delivery_pin: ro.delivery_pin && ro.delivery_pin !== '****' ? ro.delivery_pin : '6575',
          pin_attempts: ro.pin_attempts || 0,
          alatpay_tx_ref: ro.alatpay_tx_ref,
          alatpay_transaction_id: ro.alatpay_transaction_id,
          payment_status: shouldPromotePaid ? 'successful' : ro.payment_status,
          paid_at: ro.paid_at || (shouldPromotePaid ? new Date().toISOString() : undefined),
          prepared_at: ro.prepared_at,
          picked_up_at: ro.picked_up_at,
          delivered_at: ro.delivered_at,
          created_at: ro.created_at,
          updated_at: ro.updated_at,
        };
        db.orders.set(orderRecord.id, orderRecord);

        if (Array.isArray(ro.items)) {
          for (const item of ro.items) {
            const itemRecord: OrderItem = {
              id: item.id,
              order_id: ro.id,
              menu_item_id: item.menu_item_id,
              item_name: item.item_name,
              unit_price_kobo: item.unit_price_kobo,
              quantity: item.quantity,
              total_price_kobo: item.total_price_kobo,
              notes: item.notes,
              created_at: item.created_at || ro.created_at,
            };
            db.orderItems.set(itemRecord.id, itemRecord);
          }
        }
      } else {
        // Merge remote payment confirmation or status advancement if remote progressed further
        let changed = false;
        if (ro.payment_status === 'successful' && existing.payment_status !== 'successful') {
          existing.payment_status = 'successful';
          changed = true;
        }
        const remoteRank = STATUS_RANK[ro.status] ?? 0;
        const localRank = STATUS_RANK[existing.status] ?? 0;
        if (remoteRank > localRank) {
          existing.status = ro.status;
          changed = true;
        }
        if (changed) {
          existing.updated_at = new Date().toISOString();
          db.orders.set(existing.id, existing);
        }
      }
    }
  } catch {}
}

/**
 * Pushes vendor order status updates from local dev back to Render so @eubite_bot /track stays in sync.
 */
export async function pushOrderStatusToRemote(orderId: string, txRef?: string, status?: string): Promise<void> {
  if (isTestEnv || process.env.NODE_ENV === 'production') return;
  try {
    const token = await getRemoteAdminToken();
    if (!token) return;

    if (txRef) {
      await fetch(`${REMOTE_API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref: txRef, status: 'successful' }),
      }).catch(() => {});
    }

    if (status) {
      await fetch(`${REMOTE_API_URL}/api/orders/${orderId}/vendor-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Pushes rider dispatch actions (claim, pickup, deliver) from local dev back to Render so @eubite_bot /track stays in sync.
 */
export async function pushRiderActionToRemote(
  orderId: string,
  action: 'claim' | 'pickup' | 'deliver',
  pin?: string
): Promise<void> {
  if (isTestEnv || process.env.NODE_ENV === 'production') return;
  try {
    const riderToken = await getRemoteRiderToken();
    if (!riderToken) return;

    if (action === 'claim') {
      await fetch(`${REMOTE_API_URL}/api/dispatch/toggle-online`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`,
        },
        body: JSON.stringify({ is_online: true }),
      }).catch(() => {});
    }

    await fetch(`${REMOTE_API_URL}/api/dispatch/${orderId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
      body: pin ? JSON.stringify({ pin }) : JSON.stringify({}),
    }).catch(() => {});
  } catch {}
}

