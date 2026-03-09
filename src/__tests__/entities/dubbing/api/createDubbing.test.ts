import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('ky', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('createDubbing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('/api/tts를 POST 요청으로 호출한다', async () => {
    const ky = (await import('ky')).default;
    const mockBlob = new Blob([new Uint8Array([0xff, 0xfb])], { type: 'audio/mpeg' });

    vi.mocked(ky.post).mockReturnValueOnce({
      blob: async () => mockBlob,
    } as never);

    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-audio');

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    const result = await createDubbing({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' });

    expect(ky.post).toHaveBeenCalledWith('/api/tts', {
      json: { text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' },
    });
    expect(result).toBe('blob:http://localhost/test-audio');
  });

  it('400 에러 시 메시지와 함께 예외를 throw한다', async () => {
    const ky = (await import('ky')).default;

    vi.mocked(ky.post).mockReturnValueOnce({
      blob: async () => {
        throw Object.assign(new Error('Bad Request'), {
          response: { status: 400, json: async () => ({ error: '텍스트를 입력해주세요' }) },
        });
      },
    } as never);

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    await expect(
      createDubbing({ text: '', voiceId: 'abc', language: 'ko' }),
    ).rejects.toThrow();
  });
});
