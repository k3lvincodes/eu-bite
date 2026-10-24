import crypto from 'crypto';
import { db } from '../db/index.ts';
import type { AuditLog } from '../types/index.ts';

export function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  actorId?: string,
  actorRole?: string,
  details?: any,
  ipAddress?: string
): AuditLog {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details_json: details,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  };

  db.auditLogs.set(log.id, log);
  console.log(`[AUDIT] [${log.action}] ${log.entity_type} (${log.entity_id || 'N/A'}) by ${log.actor_role || 'system'}:${log.actor_id || 'anonymous'}`);
  return log;
}
