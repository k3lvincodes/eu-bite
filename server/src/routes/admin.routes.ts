import { createRouter as Router } from '../utils/expressCompat.ts';
import { db } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { RiderApprovalStatus } from '../types/index.ts';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', authenticate, requireRole('admin'), (req: any, res: any): void => {
  let totalGmvKobo = 0;
  let paidOrdersCount = 0;
  let deliveredOrdersCount = 0;
  let inProgressOrdersCount = 0;

  for (const o of db.orders.values()) {
    if (o.payment_status === 'successful') {
      totalGmvKobo += o.total_amount_kobo;
      paidOrdersCount++;
    }
    if (o.status === 'delivered') {
      deliveredOrdersCount++;
    } else if (['paid', 'vendor_accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'in_transit'].includes(o.status)) {
      inProgressOrdersCount++;
    }
  }

  const packagingInventory = Array.from(db.packagingTypes.values()).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    stock: p.stock_count,
    fee_ngn: p.fee_kobo / 100,
  }));

  const activeRidersCount = Array.from(db.riders.values()).filter((r) => r.approval_status === 'approved' && r.is_online).length;
  const pendingRiderApprovals = Array.from(db.riders.values()).filter((r) => r.approval_status === 'pending').length;
  const activeVendorsCount = Array.from(db.restaurants.values()).filter((r) => r.is_active).length;

  res.json({
    success: true,
    data: {
      financials: {
        total_gmv_kobo: totalGmvKobo,
        total_gmv_ngn: totalGmvKobo / 100,
      },
      orders: {
        total_orders: db.orders.size,
        paid_orders: paidOrdersCount,
        delivered_orders: deliveredOrdersCount,
        in_progress_orders: inProgressOrdersCount,
      },
      riders: {
        total_registered: db.riders.size,
        active_online: activeRidersCount,
        pending_approvals: pendingRiderApprovals,
      },
      vendors: {
        total_vendors: db.restaurants.size,
        active_vendors: activeVendorsCount,
      },
      packaging: packagingInventory,
    },
  });
});

// GET /api/admin/riders
router.get('/riders', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const ridersList: any[] = [];
  for (const r of db.riders.values()) {
    const user = db.users.get(r.user_id);
    ridersList.push({
      ...r,
      full_name: user?.full_name || 'Rider',
      email: user?.email,
      phone: user?.phone,
      total_earnings_ngn: r.total_earnings_kobo / 100,
    });
  }
  res.json({ success: true, count: ridersList.length, data: ridersList });
});

// PATCH /api/admin/riders/:id/status
router.patch('/riders/:id/status', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const { id } = req.params;
  const { status } = req.body;

  const rider = db.riders.get(id);
  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider not found' });
    return;
  }

  const validStatuses: RiderApprovalStatus[] = ['approved', 'suspended', 'rejected', 'pending'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    return;
  }

  rider.approval_status = status;
  if (status === 'suspended' || status === 'rejected') {
    rider.is_online = false;
  }
  rider.updated_at = new Date().toISOString();
  db.riders.set(rider.id, rider);

  logAudit('RIDER_STATUS_CHANGED', 'riders', rider.id, req.user!.userId, 'admin', { new_status: status });

  res.json({ success: true, message: `Rider status updated to '${status}'.`, data: rider });
});

// GET /api/admin/settings
router.get('/settings', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const settings = Array.from(db.platformSettings.values());
  res.json({ success: true, data: settings });
});

// PATCH /api/admin/settings
router.patch('/settings/:key', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const { key } = req.params;
  const { value } = req.body;

  let setting = db.platformSettings.get(key);
  const now = new Date().toISOString();

  if (!setting) {
    setting = {
      id: `set-${Date.now()}`,
      key,
      value_json: value,
      description: `Custom setting for ${key}`,
      updated_at: now,
    };
  } else {
    setting.value_json = value;
    setting.updated_at = now;
  }

  db.platformSettings.set(key, setting);
  logAudit('PLATFORM_SETTING_UPDATED', 'platform_settings', key, req.user!.userId, 'admin', { value });

  res.json({ success: true, message: `Setting '${key}' updated.`, data: setting });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const logs = Array.from(db.auditLogs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, count: logs.length, data: logs.slice(0, 100) });
});

// GET /api/admin/support-tickets
router.get('/support-tickets', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const tickets = Array.from(db.supportTickets.values());
  res.json({ success: true, data: tickets });
});

export default router;
