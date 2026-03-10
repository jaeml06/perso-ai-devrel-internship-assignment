import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('ky', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('translateText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 { translatedText, wasSkipped }를 반환한다', async () => {
    const ky = await import('ky');
    vi.mocked(ky.default.post).mockReturnValue({
      json: async () => ({
        translatedText: '안녕하세요',
        wasSkipped: false,
      }),
    } as never);

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const result = await translateText({ text: 'Hello', sourceLanguage: 'en', targetLanguage: 'ko' });

    expect(result.translatedText).toBe('안녕하세요');
    expect(result.wasSkipped).toBe(false);
  });

  it('에러 응답 시 throw한다', async () => {
    const ky = await import('ky');
    vi.mocked(ky.default.post).mockReturnValue({
      json: vi.fn().mockRejectedValue(new Error('API error')),
    } as never);

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    await expect(
      translateText({ text: 'Hello', sourceLanguage: 'en', targetLanguage: 'ko' })
    ).rejects.toThrow();
  });

  it('같은 입력으로 반복 호출해도 매번 새 번역 요청을 보낸다', async () => {
    const ky = await import('ky');
    vi.mocked(ky.default.post).mockReturnValue({
      json: async () => ({
        translatedText: '안녕하세요',
        wasSkipped: false,
      }),
    } as never);

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const request = { text: 'Hello', sourceLanguage: 'en' as const, targetLanguage: 'ko' as const };

    await translateText(request);
    await translateText(request);

    expect(ky.default.post).toHaveBeenCalledTimes(2);
    expect(ky.default.post).toHaveBeenNthCalledWith(1, '/api/translate', expect.objectContaining({ json: request }));
    expect(ky.default.post).toHaveBeenNthCalledWith(2, '/api/translate', expect.objectContaining({ json: request }));
  });
});
