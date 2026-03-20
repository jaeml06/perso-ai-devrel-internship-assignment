import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExec = vi.fn();
const mockWriteFile = vi.fn();
const mockReadFile = vi.fn();
const mockLoad = vi.fn();

vi.mock('@ffmpeg/ffmpeg', () => {
  return {
    FFmpeg: class {
      load = mockLoad;
      writeFile = mockWriteFile;
      readFile = mockReadFile;
      exec = mockExec;
    },
  };
});

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  toBlobURL: vi.fn().mockResolvedValue('blob:http://localhost/wasm'),
}));

vi.mock('@/features/dubbing-create/lib/getMediaDuration', () => ({
  getMediaDuration: vi.fn(),
}));

import { cropMedia } from '@/features/dubbing-create/lib/cropMedia';
import { getMediaDuration } from '@/features/dubbing-create/lib/getMediaDuration';

describe('cropMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockExec.mockResolvedValue(0);
    mockReadFile.mockResolvedValue(new Uint8Array([10, 20, 30]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('45초 파일 → wasCropped: false, 원본 반환', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(45);
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.wasCropped).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalDuration).toBe(45);
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('60초 정확히 → wasCropped: false', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(60);
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.wasCropped).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalDuration).toBe(60);
  });

  it('120초 → wasCropped: true, FFmpeg -t 60 -c copy 호출 확인', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(120);
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.wasCropped).toBe(true);
    expect(result.originalDuration).toBe(120);
    expect(mockExec).toHaveBeenCalledWith([
      '-i', 'input.mp3',
      '-t', '60',
      '-c', 'copy',
      'output.mp3',
    ]);
  });

  it('오디오 → 오디오 MIME 유지', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(120);
    const file = new File(['audio'], 'test.wav', { type: 'audio/wav' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.wasCropped).toBe(true);
    expect(result.file.type).toBe('audio/wav');
    expect(result.file.name).toBe('test.wav');
  });

  it('비디오 → 비디오 MIME 유지', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(120);
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.wasCropped).toBe(true);
    expect(result.file.type).toBe('video/mp4');
    expect(result.file.name).toBe('clip.mp4');
  });

  it('FFmpeg 로드 실패 → 에러 throw', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(120);
    mockLoad.mockRejectedValueOnce(new Error('WASM load failed'));
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    await expect(cropMedia({ file, maxDurationSeconds: 60 })).rejects.toThrow('미디어 크롭에 실패했습니다');
  });

  it('FFmpeg exec 실패 → 에러 throw', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(120);
    mockExec.mockRejectedValueOnce(new Error('exec failed'));
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    await expect(cropMedia({ file, maxDurationSeconds: 60 })).rejects.toThrow('미디어 크롭에 실패했습니다');
  });

  it('originalDuration 값 반환 확인', async () => {
    vi.mocked(getMediaDuration).mockResolvedValueOnce(90);
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    const result = await cropMedia({ file, maxDurationSeconds: 60 });

    expect(result.originalDuration).toBe(90);
  });
});
