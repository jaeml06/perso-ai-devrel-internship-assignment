import { describe, it, expect, vi } from 'vitest';
import { checkWhitelist } from '@/features/auth-login/lib/checkWhitelist';

describe('checkWhitelist', () => {
  it('returns true for a whitelisted email', async () => {
    const mockFn = vi.fn().mockResolvedValue(true);
    const result = await checkWhitelist('allowed@example.com', mockFn);
    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledWith('allowed@example.com');
  });

  it('returns false for a non-whitelisted email', async () => {
    const mockFn = vi.fn().mockResolvedValue(false);
    const result = await checkWhitelist('blocked@example.com', mockFn);
    expect(result).toBe(false);
  });

  it('returns false for null email (fail-closed)', async () => {
    const mockFn = vi.fn();
    const result = await checkWhitelist(null, mockFn);
    expect(result).toBe(false);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('returns false for undefined email (fail-closed)', async () => {
    const mockFn = vi.fn();
    const result = await checkWhitelist(undefined, mockFn);
    expect(result).toBe(false);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('returns false when DB throws an error (fail-closed)', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('DB connection failed'));
    const result = await checkWhitelist('user@example.com', mockFn);
    expect(result).toBe(false);
  });
});
