import { createHash, randomBytes } from 'crypto';

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function generateStorageKey(prefix: string, ext: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = randomBytes(16).toString('hex');
  return `${prefix}/${year}/${month}/${day}/${random}${ext}`;
}

export function generateApiKey(): { key: string; prefix: string } {
  const key = `clrv_${randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 12);
  return { key, prefix };
}

export function hashApiKey(key: string): string {
  return sha256(key);
}

export function generateAppId(): string {
  return `app_${randomBytes(8).toString('hex')}`;
}
