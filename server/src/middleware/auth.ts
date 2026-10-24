import { verifyToken } from '../utils/jwt.ts';
import type { TokenPayload } from '../utils/jwt.ts';
import type { UserRole } from '../types/index.ts';

export interface AuthenticatedRequest {
  headers: Record<string, string>;
  user?: TokenPayload;
  [key: string]: any;
}

export function authenticate(req: any, res: any, next: any): void {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Unauthorized: Token is expired or invalid.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: any, res: any, next: any): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(', ')}. Current role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}

export function verifyBotAuth(req: any, res: any, next: any): void {
  const secret = process.env.BOT_SERVICE_TOKEN || 'eu_bite_internal_bot_api_token_shared_secret';
  const token = req.headers?.['x-bot-service-token'] || req.headers?.['authorization']?.replace('Bearer ', '');

  if (!token || token !== secret) {
    res.status(403).json({ success: false, error: 'Forbidden: Invalid bot service token.' });
    return;
  }

  next();
}
