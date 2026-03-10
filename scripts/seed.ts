import { createClient } from '@libsql/client';

async function seed() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Create allowed_users table if not exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      name       TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    )
  `);

  // Seed required whitelist entry (FR-006)
  await turso.execute({
    sql: "INSERT OR IGNORE INTO allowed_users (email, name) VALUES (?, ?)",
    args: ['kts123@estsoft.com', '관리자'],
  });

  console.log('Seed complete: allowed_users table initialized with kts123@estsoft.com');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
