import { describe, it, expect, vi } from 'vitest';
import { checkWhitelist } from '@/features/auth-login/lib/checkWhitelist';

describe('checkWhitelist', () => {
  it('returns true for a whitelisted email', async () => {
    const mockFn = vi.fn().mockResolvedValue(true);
    const result = await checkWhitelist('allowed@example.com', mockFn);
    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledWith('allowed@example.com');
  });

  it('returns /unauthorized?error=not_whitelisted for a non-whitelisted email', async () => {
    const mockFn = vi.fn().mockResolvedValue(false);
    const result = await checkWhitelist('blocked@example.com', mockFn);
    expect(result).toBe('/unauthorized?error=not_whitelisted');
  });

  it('returns /unauthorized?error=no_email for null email', async () => {
    const mockFn = vi.fn();
    const result = await checkWhitelist(null, mockFn);
    expect(result).toBe('/unauthorized?error=no_email');
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('returns /unauthorized?error=no_email for undefined email', async () => {
    const mockFn = vi.fn();
    const result = await checkWhitelist(undefined, mockFn);
    expect(result).toBe('/unauthorized?error=no_email');
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('returns /unauthorized?error=server_error when DB throws an error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('DB connection failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await checkWhitelist('user@example.com', mockFn);
    expect(result).toBe('/unauthorized?error=server_error');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[auth][server_error]',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
