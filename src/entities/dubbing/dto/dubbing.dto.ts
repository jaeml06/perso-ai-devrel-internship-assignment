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

export type DubbingStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    text?: string;
    voiceId?: string;
    language?: string;
  };
}
