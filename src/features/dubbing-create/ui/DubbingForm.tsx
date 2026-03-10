'use client';

import { type DubbingLanguage } from '@/entities/dubbing/dto/dubbing.dto';
import { type Voice } from '@/entities/voice/dto/voice.dto';
import { type FileValidationErrors } from '@/entities/dubbing/dto/dubbing.dto';
import { VoiceSelector } from '@/features/dubbing-create/ui/VoiceSelector';

interface DubbingFormProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  targetLanguage: DubbingLanguage;
  onTargetLanguageChange: (lang: DubbingLanguage) => void;
  voiceId: string;
  onVoiceIdChange: (id: string) => void;
  voices: Voice[];
  voicesError: string | null;
  onVoicesRetry: () => void;
  validationErrors: FileValidationErrors;
  disabled?: boolean;
  onSubmit: () => void;
}

export function DubbingForm({
  file,
  onFileChange,
  targetLanguage,
  onTargetLanguageChange,
  voiceId,
  onVoiceIdChange,
  voices,
  voicesError,
  onVoicesRetry,
  validationErrors,
  disabled,
  onSubmit,
}: DubbingFormProps) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    onFileChange(selected);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor="file-input">오디오/비디오 파일</label>
        <input
          id="file-input"
          type="file"
          accept=".mp3,.wav,.ogg,.flac,.m4a,.mp4,.mov,.webm"
          onChange={handleFileChange}
          disabled={disabled}
        />
        {file && <span>{file.name}</span>}
        {validationErrors.file && <p>{validationErrors.file}</p>}
      </div>

      <div>
        <label htmlFor="language-select">타겟 언어</label>
        <select
          id="language-select"
          aria-label="타겟 언어"
          value={targetLanguage}
          onChange={(e) => onTargetLanguageChange(e.target.value as DubbingLanguage)}
          disabled={disabled}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
        {validationErrors.language && <p>{validationErrors.language}</p>}
      </div>

      <div>
        <VoiceSelector
          voices={voices}
          selectedVoiceId={voiceId}
          onChange={onVoiceIdChange}
          error={voicesError ?? undefined}
          onRetry={onVoicesRetry}
        />
        {validationErrors.voiceId && <p>{validationErrors.voiceId}</p>}
      </div>

      <button
        type="submit"
        disabled={disabled || (!file || !voiceId || !targetLanguage)}
      >
        더빙 생성
      </button>
    </form>
  );
}
