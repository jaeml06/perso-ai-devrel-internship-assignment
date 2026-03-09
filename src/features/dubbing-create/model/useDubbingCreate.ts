'use client';

import { useState, useCallback, useEffect } from 'react';
import { type DubbingLanguage } from '@/entities/dubbing/dto/dubbing.dto';
import { type Voice } from '@/entities/voice/dto/voice.dto';
import { validateDubbingInput } from '@/features/dubbing-create/lib/validateDubbingInput';
import { createDubbing } from '@/entities/dubbing/api/createDubbing';
import { getVoices } from '@/entities/voice/api/getVoices';

interface ValidationErrors {
  text?: string;
  voiceId?: string;
}

export function useDubbingCreate() {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [language, setLanguage] = useState<DubbingLanguage>('ko');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  const loadVoices = useCallback(async () => {
    try {
      const data = await getVoices();
      setVoices(data.voices);
      setVoicesError(null);
    } catch {
      setVoicesError('음성 목록을 불러오는데 실패했습니다');
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const submit = useCallback(async () => {
    if (isLoading) return;

    const validation = validateDubbingInput(text, voiceId, language);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url = await createDubbing({ text, voiceId, language });
      setAudioUrl(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '오디오 생성에 실패했습니다',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, text, voiceId, language]);

  return {
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
  };
}
