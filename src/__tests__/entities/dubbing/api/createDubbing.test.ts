import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ky', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('createDubbing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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

    expect(ky.post).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
      json: { text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' },
    }));
    expect(result.url).toBe('blob:http://localhost/test-audio');
    expect(result.blob).toBeInstanceOf(Blob);
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

  it('같은 요청으로 반복 호출해도 매번 새 오디오 URL을 생성한다', async () => {
    const ky = (await import('ky')).default;
    const firstBlob = new Blob([new Uint8Array([0xff, 0xfb])], { type: 'audio/mpeg' });
    const secondBlob = new Blob([new Uint8Array([0xff, 0xfb])], { type: 'audio/mpeg' });

    vi.mocked(ky.post)
      .mockReturnValueOnce({ blob: async () => firstBlob } as never)
      .mockReturnValueOnce({ blob: async () => secondBlob } as never);

    global.URL.createObjectURL = vi.fn()
      .mockReturnValueOnce('blob:http://localhost/audio-1')
      .mockReturnValueOnce('blob:http://localhost/audio-2');

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    const request = { text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' as const };

    const firstResult = await createDubbing(request);
    const secondResult = await createDubbing(request);

    expect(ky.post).toHaveBeenCalledTimes(2);
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(firstResult.url).toBe('blob:http://localhost/audio-1');
    expect(secondResult.url).toBe('blob:http://localhost/audio-2');
  });
});
