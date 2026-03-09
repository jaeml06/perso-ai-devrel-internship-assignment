'use client';

import { useEffect } from 'react';
import { useDubbingCreate } from '@/features/dubbing-create/model/useDubbingCreate';
import { VoiceSelector } from '@/features/dubbing-create/ui/VoiceSelector';

interface DubbingFormProps {
  onAudioReady?: (audioUrl: string) => void;
}

export function DubbingForm({ onAudioReady }: DubbingFormProps) {
  const {
    text,
    setText,
    voiceId,
    setVoiceId,
    language,
    setLanguage,
    isLoading,
    audioUrl,
    errorMessage,
    validationErrors,
    voices,
    voicesError,
    loadVoices,
    submit,
  } = useDubbingCreate();

  useEffect(() => {
    if (audioUrl && onAudioReady) {
      onAudioReady(audioUrl);
    }
  }, [audioUrl, onAudioReady]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="변환할 텍스트를 입력해주세요"
          maxLength={5000}
        />
        <span>{text.length}/5000</span>
        {validationErrors.text && <p>{validationErrors.text}</p>}
      </div>

      <div>
        <VoiceSelector
          voices={voices}
          selectedVoiceId={voiceId}
          onChange={setVoiceId}
          error={voicesError ?? undefined}
          onRetry={loadVoices}
        />
        {validationErrors.voiceId && <p>{validationErrors.voiceId}</p>}
      </div>

      <div>
        <label htmlFor="language-select">언어</label>
        <select
          id="language-select"
          aria-label="언어"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      {errorMessage && <p>{errorMessage}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? '생성 중...' : '더빙 생성'}
      </button>
    </form>
  );
}
