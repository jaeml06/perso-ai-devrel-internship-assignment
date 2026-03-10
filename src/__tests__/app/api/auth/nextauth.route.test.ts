import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({
  handlers: {
    GET: vi.fn().mockResolvedValue(new Response('OK', { status: 200 })),
    POST: vi.fn().mockResolvedValue(new Response('OK', { status: 200 })),
  },
}));

import * as routeModule from '@/app/api/auth/[...nextauth]/route';

describe('NextAuth route handler', () => {
  it('exports GET handler', () => {
    expect(typeof routeModule.GET).toBe('function');
  });

  it('exports POST handler', () => {
    expect(typeof routeModule.POST).toBe('function');
  });
});
