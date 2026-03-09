import { describe, it, expect, afterEach } from 'vitest';

describe('getElevenLabsApiKey', () => {
  const originalKey = process.env.ELEVENLABS_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalKey;
    }
  });

  it('ELEVENLABS_API_KEY가 설정되지 않으면 에러를 throw한다', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const { getElevenLabsApiKey } = await import('@/shared/config/env');
    expect(() => getElevenLabsApiKey()).toThrowError();
  });

  it('ELEVENLABS_API_KEY가 설정되면 값을 반환한다', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    const { getElevenLabsApiKey } = await import('@/shared/config/env');
    expect(getElevenLabsApiKey()).toBe('test-api-key');
  });
});
