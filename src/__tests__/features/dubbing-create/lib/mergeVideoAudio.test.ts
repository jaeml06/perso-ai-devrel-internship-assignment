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

import { mergeVideoAudio } from '@/features/dubbing-create/lib/mergeVideoAudio';

describe('mergeVideoAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockExec.mockResolvedValue(0);
    mockReadFile.mockResolvedValue(new Uint8Array([10, 20, 30]));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/merged');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FFmpeg를 로드하고 합성 명령어를 실행한다', async () => {
    const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const audioBlob = new Blob(['audio'], { type: 'audio/mpeg' });

    await mergeVideoAudio({ videoFile, audioBlob });

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    expect(mockExec).toHaveBeenCalledWith([
      '-i', 'input.mp4',
      '-i', 'dubbed.mp3',
      '-c:v', 'copy',
      '-map', '0:v',
      '-map', '1:a',
      '-shortest',
      'output.mp4',
    ]);
  });

  it('합성 결과를 Blob URL로 반환한다', async () => {
    const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const audioBlob = new Blob(['audio'], { type: 'audio/mpeg' });

    const result = await mergeVideoAudio({ videoFile, audioBlob });

    expect(result.url).toBe('blob:http://localhost/merged');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe('video/mp4');
  });

  it('FFmpeg 로딩 실패 시 에러를 throw한다', async () => {
    mockLoad.mockRejectedValueOnce(new Error('WASM load failed'));

    const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const audioBlob = new Blob(['audio'], { type: 'audio/mpeg' });

    await expect(mergeVideoAudio({ videoFile, audioBlob })).rejects.toThrow('영상 합성에 실패했습니다');
  });

  it('FFmpeg exec 실패 시 에러를 throw한다', async () => {
    mockExec.mockRejectedValueOnce(new Error('exec failed'));

    const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const audioBlob = new Blob(['audio'], { type: 'audio/mpeg' });

    await expect(mergeVideoAudio({ videoFile, audioBlob })).rejects.toThrow('영상 합성에 실패했습니다');
  });
});
