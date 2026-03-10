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

describe('getGeminiApiKey', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('GEMINI_API_KEY가 설정되지 않으면 에러를 throw한다', async () => {
    delete process.env.GEMINI_API_KEY;
    const { getGeminiApiKey } = await import('@/shared/config/env');
    expect(() => getGeminiApiKey()).toThrowError('GEMINI_API_KEY is not set');
  });

  it('GEMINI_API_KEY가 설정되면 값을 반환한다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const { getGeminiApiKey } = await import('@/shared/config/env');
    expect(getGeminiApiKey()).toBe('test-gemini-key');
  });
});
