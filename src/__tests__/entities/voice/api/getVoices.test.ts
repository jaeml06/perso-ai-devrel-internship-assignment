import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('ky', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('getVoices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('/api/voices를 호출하고 음성 배열을 반환한다', async () => {
    const mockVoices = [
      {
        id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        gender: 'female',
        ageGroup: 'young',
        previewUrl: 'https://example.com/rachel.mp3',
        description: '젊은 여성',
      },
    ];

    const ky = (await import('ky')).default;
    vi.mocked(ky.get).mockReturnValueOnce({
      json: async () => ({ voices: mockVoices }),
    } as never);

    const { getVoices } = await import('@/entities/voice/api/getVoices');
    const result = await getVoices();
    expect(result.voices).toEqual(mockVoices);
    expect(ky.get).toHaveBeenCalledWith('/api/voices');
  });

  it('API 에러 시 예외를 throw한다', async () => {
    const ky = (await import('ky')).default;
    vi.mocked(ky.get).mockReturnValueOnce({
      json: async () => {
        throw new Error('Network Error');
      },
    } as never);

    const { getVoices } = await import('@/entities/voice/api/getVoices');
    await expect(getVoices()).rejects.toThrow();
  });
});
