import { turso } from '@/shared/lib/turso';

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const result = await turso.execute({
    sql: 'SELECT 1 FROM allowed_users WHERE email = ? LIMIT 1',
    args: [email],
  });
  return result.rows.length > 0;
}

export async function addAllowedUser(email: string, name?: string): Promise<void> {
  await turso.execute({
    sql: 'INSERT OR IGNORE INTO allowed_users (email, name) VALUES (?, ?)',
    args: [email, name ?? null],
  });
}
