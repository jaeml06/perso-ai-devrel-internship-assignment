'use client';

import { useRef } from 'react';
import { type Voice } from '@/entities/voice/dto/voice.dto';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  error?: string;
  onRetry?: () => void;
}

export function VoiceSelector({
  voices,
  selectedVoiceId,
  onChange,
  error,
  onRetry,
}: VoiceSelectorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (error) {
    return (
      <div className='bg-destructive/10 rounded-lg p-3 flex flex-col gap-2'>
        <p className='text-sm text-destructive' aria-live='polite'>{error}</p>
        {onRetry && (
          <button
            type="button"
            className='self-start text-sm bg-destructive text-destructive-foreground rounded-lg px-3 py-1 hover:bg-destructive/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring'
            onClick={onRetry}
          >
            재시도
          </button>
        )}
      </div>
    );
  }

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);

  function handlePreview() {
    if (!selectedVoice) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(selectedVoice.previewUrl);
    audioRef.current = audio;
    audio.play();
  }

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor="voice-select" className='text-sm font-medium text-foreground'>음성 선택</label>
      <select
        id="voice-select"
        className='rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
        value={selectedVoiceId}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">음성을 선택해주세요</option>
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} ({voice.gender === 'female' ? '여성' : '남성'} ·{' '}
            {voice.ageGroup === 'young' ? '젊은' : '중년'})
          </option>
        ))}
      </select>
      {selectedVoice && (
        <button
          type="button"
          className='self-start text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded'
          onClick={handlePreview}
        >
          미리듣기
        </button>
      )}
    </div>
  );
}
