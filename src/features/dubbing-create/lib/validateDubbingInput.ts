import { type DubbingLanguage, type ValidationResult } from '@/entities/dubbing/dto/dubbing.dto';

export function validateDubbingInput(
  text: string,
  voiceId: string,
  language: DubbingLanguage | string,
): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!text || text.trim().length === 0) {
    errors.text = '텍스트를 입력해주세요';
  } else if (text.length > 5000) {
    errors.text = '텍스트는 5,000자를 초과할 수 없습니다';
  }

  if (!voiceId || voiceId.trim().length === 0) {
    errors.voiceId = '음성을 선택해주세요';
  }

  if (language !== 'ko' && language !== 'en') {
    errors.language = '유효하지 않은 언어입니다';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
