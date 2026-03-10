import { describe, it, expect } from 'vitest';
import { validateFileInput } from '@/features/dubbing-create/lib/validateFileInput';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob(['x'.repeat(sizeBytes)], { type });
  return new File([blob], name, { type });
}

describe('validateFileInput', () => {
  it('파일 없음 → errors.file = "파일을 업로드해주세요"', () => {
    const result = validateFileInput(null, 'voice123', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.file).toBe('파일을 업로드해주세요');
  });

  it('지원하지 않는 포맷(pdf) → errors.file = "지원하지 않는 파일 형식입니다"', () => {
    const file = makeFile('test.pdf', 'application/pdf', 1024);
    const result = validateFileInput(file, 'voice123', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.file).toBe('지원하지 않는 파일 형식입니다');
  });

  it('25MB 초과 → errors.file = "파일 크기가 25MB를 초과합니다"', () => {
    const file = makeFile('big.mp3', 'audio/mpeg', 25 * 1024 * 1024 + 1);
    const result = validateFileInput(file, 'voice123', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.file).toBe('파일 크기가 25MB를 초과합니다');
  });

  it('voiceId 미선택 → errors.voiceId = "음성을 선택해주세요"', () => {
    const file = makeFile('test.mp3', 'audio/mpeg', 1024);
    const result = validateFileInput(file, '', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.voiceId).toBe('음성을 선택해주세요');
  });

  it('타겟 언어 미선택 → errors.language = "타겟 언어를 선택해주세요"', () => {
    const file = makeFile('test.mp3', 'audio/mpeg', 1024);
    const result = validateFileInput(file, 'voice123', '' as 'ko' | 'en');
    expect(result.isValid).toBe(false);
    expect(result.errors.language).toBe('타겟 언어를 선택해주세요');
  });

  it('유효한 mp3 + voiceId + language → isValid: true', () => {
    const file = makeFile('test.mp3', 'audio/mpeg', 1024);
    const result = validateFileInput(file, 'voice123', 'ko');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('유효한 mp4(비디오) → isValid: true', () => {
    const file = makeFile('video.mp4', 'video/mp4', 1024);
    const result = validateFileInput(file, 'voice123', 'en');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('MIME 불명확한 경우 확장자로 fallback (.wav 파일) → isValid: true', () => {
    const file = makeFile('test.wav', 'application/octet-stream', 1024);
    const result = validateFileInput(file, 'voice123', 'ko');
    expect(result.isValid).toBe(true);
  });
});
