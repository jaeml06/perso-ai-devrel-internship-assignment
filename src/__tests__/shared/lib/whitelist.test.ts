import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/turso', () => ({
  turso: {
    execute: vi.fn(),
  },
}));

import { turso } from '@/shared/lib/turso';
import { isEmailWhitelisted } from '@/shared/lib/whitelist';

describe('isEmailWhitelisted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when email exists in allowed_users', async () => {
    vi.mocked(turso.execute).mockResolvedValue({
      rows: [{ '1': 1 }],
      columns: ['1'],
      columnTypes: ['integer'],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as never);

    const result = await isEmailWhitelisted('kts123@estsoft.com');
    expect(result).toBe(true);
  });

  it('returns false when email does not exist', async () => {
    vi.mocked(turso.execute).mockResolvedValue({
      rows: [],
      columns: ['1'],
      columnTypes: ['integer'],
      rowsAffected: 0,
      lastInsertRowid: undefined,
    } as never);

    const result = await isEmailWhitelisted('unknown@example.com');
    expect(result).toBe(false);
  });

  it('throws when DB execute fails', async () => {
    vi.mocked(turso.execute).mockRejectedValue(new Error('DB error'));

    await expect(isEmailWhitelisted('user@example.com')).rejects.toThrow('DB error');
  });
});
