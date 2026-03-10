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
      className='rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className='flex flex-col gap-2'>
        <label htmlFor="file-input" className='text-sm font-medium text-foreground'>오디오/비디오 파일</label>
        <input
          id="file-input"
          type="file"
          accept=".mp3,.wav,.ogg,.flac,.m4a,.mp4,.mov,.webm"
          className='rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          onChange={handleFileChange}
          disabled={disabled}
        />
        {file && <span className='truncate max-w-[200px] text-sm text-muted-foreground'>{file.name}</span>}
        {validationErrors.file && (
          <p className='text-sm text-destructive' aria-live='polite'>{validationErrors.file}</p>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor="language-select" className='text-sm font-medium text-foreground'>타겟 언어</label>
        <select
          id="language-select"
          aria-label="타겟 언어"
          className='rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          value={targetLanguage}
          onChange={(e) => onTargetLanguageChange(e.target.value as DubbingLanguage)}
          disabled={disabled}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
        {validationErrors.language && (
          <p className='text-sm text-destructive' aria-live='polite'>{validationErrors.language}</p>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        <VoiceSelector
          voices={voices}
          selectedVoiceId={voiceId}
          onChange={onVoiceIdChange}
          error={voicesError ?? undefined}
          onRetry={onVoicesRetry}
        />
        {validationErrors.voiceId && (
          <p className='text-sm text-destructive' aria-live='polite'>{validationErrors.voiceId}</p>
        )}
      </div>

      <button
        type="submit"
        className='bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring'
        disabled={disabled || (!file || !voiceId || !targetLanguage)}
      >
        더빙 생성
      </button>
    </form>
  );
}
