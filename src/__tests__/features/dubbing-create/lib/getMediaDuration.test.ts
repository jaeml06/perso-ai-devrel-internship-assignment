import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMediaDuration } from '@/features/dubbing-create/lib/getMediaDuration';

describe('getMediaDuration', () => {
  let revokeObjectURL: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test');
    revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('오디오 파일의 duration을 반환한다', async () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockAudio = {
      preload: '',
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 45.5,
      set src(_url: string) {
        setTimeout(() => this.onloadedmetadata?.(), 0);
      },
    };
    createElementSpy.mockReturnValueOnce(mockAudio as unknown as HTMLElement);

    const duration = await getMediaDuration(file);

    expect(duration).toBe(45.5);
    expect(createElementSpy).toHaveBeenCalledWith('audio');
  });

  it('비디오 파일의 duration을 반환한다', async () => {
    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockVideo = {
      preload: '',
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 120.0,
      set src(_url: string) {
        setTimeout(() => this.onloadedmetadata?.(), 0);
      },
    };
    createElementSpy.mockReturnValueOnce(mockVideo as unknown as HTMLElement);

    const duration = await getMediaDuration(file);

    expect(duration).toBe(120.0);
    expect(createElementSpy).toHaveBeenCalledWith('video');
  });

  it('손상된 파일 시 에러를 throw한다', async () => {
    const file = new File(['bad'], 'corrupt.mp3', { type: 'audio/mpeg' });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockAudio = {
      preload: '',
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: NaN,
      set src(_url: string) {
        setTimeout(() => this.onerror?.(), 0);
      },
    };
    createElementSpy.mockReturnValueOnce(mockAudio as unknown as HTMLElement);

    await expect(getMediaDuration(file)).rejects.toThrow('미디어 메타데이터를 읽을 수 없습니다');
  });

  it('Blob URL revokeObjectURL 호출을 확인한다', async () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockAudio = {
      preload: '',
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 30,
      set src(_url: string) {
        setTimeout(() => this.onloadedmetadata?.(), 0);
      },
    };
    createElementSpy.mockReturnValueOnce(mockAudio as unknown as HTMLElement);

    await getMediaDuration(file);

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test');
  });
});
