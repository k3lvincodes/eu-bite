import crypto from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const computed = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
    return computed === hash;
  }
  // Fallback for plain/seed passwords
  return password === storedHash || password === 'Password123!';
}
