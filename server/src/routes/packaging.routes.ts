import { createRouter as Router } from '../utils/expressCompat.ts';
import crypto from 'node:crypto';
import { z } from '../utils/zodCompat.ts';
import { db } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { PackagingType, PackTransaction } from '../types/index.ts';

const router = Router();

// Public / Student / Vendor: Get all active packaging types with stock & pricing
router.get('/types', (req: any, res: any): void => {
  const types = Array.from(db.packagingTypes.values()).filter((p) => p.is_active);
  res.json({ success: true, count: types.length, data: types });
});

// Admin / Vendor: Get packaging inventory transactions history
router.get('/transactions', authenticate, requireRole('admin', 'vendor'), (req: any, res: any): void => {
  const transactions = Array.from(db.packTransactions.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, count: transactions.length, data: transactions });
});

const packTransactionSchema = z.object({
  pack_type_id: z.string(),
  transaction_type: z.enum(['issued', 'collected', 'returned', 'lost', 'damaged', 'restocked']),
  quantity: z.number().int().positive(),
  student_id: z.string().optional(),
  vendor_id: z.string().optional(),
  rider_id: z.string().optional(),
  order_id: z.string().optional(),
  notes: z.string().optional(),
});

// Admin / Rider / Vendor: Record a physical pack transaction
router.post('/transactions', authenticate, requireRole('admin', 'rider', 'vendor'), (req: any, res: any): void => {
  try {
    const data = packTransactionSchema.parse(req.body);
    const packType = db.packagingTypes.get(data.pack_type_id);

    if (!packType) {
      res.status(404).json({ success: false, error: 'Packaging type not found' });
      return;
    }

    if (data.transaction_type === 'restocked' || data.transaction_type === 'returned') {
      packType.stock_count += data.quantity;
    } else if (data.transaction_type === 'issued' || data.transaction_type === 'lost' || data.transaction_type === 'damaged') {
      packType.stock_count = Math.max(0, packType.stock_count - data.quantity);
    }
    packType.updated_at = new Date().toISOString();
    db.packagingTypes.set(packType.id, packType);

    if (data.transaction_type === 'returned' && data.student_id) {
      const student = db.students.get(data.student_id);
      if (student) {
        student.pack_allowance_balance += data.quantity;
        student.updated_at = new Date().toISOString();
        db.students.set(student.id, student);
      }
    }

    const transactionId = crypto.randomUUID();
    const newTransaction: PackTransaction = {
      id: transactionId,
      pack_type_id: data.pack_type_id,
      order_id: data.order_id,
      student_id: data.student_id,
      vendor_id: data.vendor_id,
      rider_id: data.rider_id,
      transaction_type: data.transaction_type,
      quantity: data.quantity,
      notes: data.notes,
      recorded_by: req.user!.userId,
      created_at: new Date().toISOString(),
    };

    db.packTransactions.set(transactionId, newTransaction);
    logAudit('PACK_TRANSACTION_RECORDED', 'pack_inventory_transactions', transactionId, req.user!.userId, req.user!.role, data);

    res.status(201).json({
      success: true,
      message: `Packaging transaction recorded successfully (${data.transaction_type})`,
      currentStock: packType.stock_count,
      data: newTransaction,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Invalid transaction request' });
  }
});

// Admin: Update packaging fee or details
router.patch('/types/:id', authenticate, requireRole('admin'), (req: any, res: any): void => {
  const { id } = req.params;
  const packType = db.packagingTypes.get(id);

  if (!packType) {
    res.status(404).json({ success: false, error: 'Packaging type not found' });
    return;
  }

  const { fee_kobo, name, description, is_active } = req.body;
  if (fee_kobo !== undefined) packType.fee_kobo = fee_kobo;
  if (name !== undefined) packType.name = name;
  if (description !== undefined) packType.description = description;
  if (is_active !== undefined) packType.is_active = is_active;
  packType.updated_at = new Date().toISOString();

  db.packagingTypes.set(packType.id, packType);
  logAudit('PACK_TYPE_UPDATED', 'packaging_types', packType.id, req.user!.userId, 'admin', req.body);

  res.json({ success: true, message: 'Packaging type updated', data: packType });
});

export default router;
