import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('ky', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('transcribeFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 TranscriptionResult를 반환한다', async () => {
    const ky = await import('ky');
    vi.mocked(ky.default.post).mockReturnValue({
      json: async () => ({
        text: 'Hello world',
        languageCode: 'en',
        languageProbability: 0.99,
      }),
    } as never);

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    const result = await transcribeFile(file);

    expect(result.text).toBe('Hello world');
    expect(result.languageCode).toBe('en');
    expect(result.languageProbability).toBe(0.99);
  });

  it('에러 응답 시 throw한다', async () => {
    const ky = await import('ky');
    vi.mocked(ky.default.post).mockReturnValue({
      json: vi.fn().mockRejectedValue(new Error('API error')),
    } as never);

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    await expect(transcribeFile(file)).rejects.toThrow();
  });
});
