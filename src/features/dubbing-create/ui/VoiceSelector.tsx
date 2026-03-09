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
      <div>
        <p>{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}>
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
    <div>
      <select
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
        <button type="button" onClick={handlePreview}>
          미리듣기
        </button>
      )}
    </div>
  );
}
