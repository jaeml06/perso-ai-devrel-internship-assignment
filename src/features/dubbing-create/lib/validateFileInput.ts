import {
  type DubbingLanguage,
  type FileValidationResult,
  type FileValidationErrors,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '@/entities/dubbing/dto/dubbing.dto';

export function validateFileInput(
  file: File | null,
  voiceId: string,
  language: DubbingLanguage | string,
): FileValidationResult {
  const errors: FileValidationErrors = {};

  if (!file) {
    errors.file = '파일을 업로드해주세요';
  } else {
    const mimeSupported = (SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const extSupported = (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);

    if (!mimeSupported && !extSupported) {
      errors.file = '지원하지 않는 파일 형식입니다';
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.file = '파일 크기가 25MB를 초과합니다';
    }
  }

  if (!voiceId || voiceId.trim().length === 0) {
    errors.voiceId = '음성을 선택해주세요';
  }

  if (language !== 'ko' && language !== 'en') {
    errors.language = '타겟 언어를 선택해주세요';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
