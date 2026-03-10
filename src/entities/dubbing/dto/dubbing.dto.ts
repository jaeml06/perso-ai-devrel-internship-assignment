export type DubbingLanguage = 'ko' | 'en';

export interface DubbingRequest {
  text: string;
  voiceId: string;
  language: DubbingLanguage;
}

export interface DubbingResponse {
  audioUrl: string;
  format: 'mp3';
}

// ── 파일 업로드 ──────────────────────────────────────────────────────────────

export const SUPPORTED_EXTENSIONS = [
  '.mp3', '.wav', '.ogg', '.flac', '.m4a',
  '.mp4', '.mov', '.webm',
] as const;

export const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export interface FileValidationErrors {
  file?: string;      // "파일을 업로드해주세요" | "지원하지 않는 파일 형식입니다" | "파일 크기가 25MB를 초과합니다"
  voiceId?: string;   // "음성을 선택해주세요"
  language?: string;  // "타겟 언어를 선택해주세요"
}

export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationErrors;
}

// ── STT (전사) ───────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  text: string;
  languageCode: string;
  languageProbability: number;
}

// ── 번역 ─────────────────────────────────────────────────────────────────────

export type TranslationSourceLanguage = DubbingLanguage | 'auto';

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: DubbingLanguage;
  wasSkipped: boolean;
}

// ── 파이프라인 상태 ──────────────────────────────────────────────────────────

export type DubbingPipelineStatus =
  | 'idle'
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'complete'
  | 'error';

export const PIPELINE_STATUS_MESSAGES: Record<DubbingPipelineStatus, string> = {
  idle: '',
  transcribing: '음성을 텍스트로 변환 중...',
  translating: '텍스트를 번역 중...',
  synthesizing: '음성을 합성 중...',
  complete: '더빙 완료',
  error: '오류가 발생했습니다',
};

// ── TTS 결과 ─────────────────────────────────────────────────────────────────

export interface AudioResult {
  audioUrl: string;
  format: 'mp3';
}

// ── 레거시 (기존 validateDubbingInput 호환용) ─────────────────────────────────

export type DubbingStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    text?: string;
    voiceId?: string;
    language?: string;
  };
}
