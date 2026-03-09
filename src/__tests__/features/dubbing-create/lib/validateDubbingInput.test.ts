import { describe, it, expect } from 'vitest';
import { validateDubbingInput } from '@/features/dubbing-create/lib/validateDubbingInput';

describe('validateDubbingInput', () => {
  it('빈 텍스트를 거부한다', () => {
    const result = validateDubbingInput('', 'voiceId123', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.text).toBeDefined();
  });

  it('5000자 초과 텍스트를 거부한다', () => {
    const result = validateDubbingInput('a'.repeat(5001), 'voiceId123', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.text).toBeDefined();
  });

  it('voiceId 미선택을 거부한다', () => {
    const result = validateDubbingInput('안녕하세요', '', 'ko');
    expect(result.isValid).toBe(false);
    expect(result.errors.voiceId).toBeDefined();
  });

  it('유효하지 않은 language를 거부한다', () => {
    const result = validateDubbingInput('안녕하세요', 'voiceId123', 'fr' as 'ko' | 'en');
    expect(result.isValid).toBe(false);
    expect(result.errors.language).toBeDefined();
  });

  it('유효한 입력은 통과한다', () => {
    const result = validateDubbingInput('안녕하세요', 'voiceId123', 'ko');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('5000자 텍스트는 통과한다', () => {
    const result = validateDubbingInput('a'.repeat(5000), 'voiceId123', 'en');
    expect(result.isValid).toBe(true);
  });
});
