'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type DubbingLanguage,
  type DubbingPipelineStatus,
  type TranscriptionResult,
  type TranslationResult,
  type FileValidationErrors,
} from '@/entities/dubbing/dto/dubbing.dto';
import { type Voice } from '@/entities/voice/dto/voice.dto';
import { validateFileInput } from '@/features/dubbing-create/lib/validateFileInput';
import { transcribeFile } from '@/entities/dubbing/api/transcribeFile';
import { translateText } from '@/entities/dubbing/api/translateText';
import { createDubbing } from '@/entities/dubbing/api/createDubbing';
import { getVoices } from '@/entities/voice/api/getVoices';

export function useDubbingCreate() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<DubbingLanguage>('ko');
  const [voiceId, setVoiceId] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState<DubbingPipelineStatus>('idle');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FileValidationErrors>({});
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  // Keep latest inputs for retry
  const latestFile = useRef(file);
  const latestVoiceId = useRef(voiceId);
  const latestTargetLanguage = useRef(targetLanguage);

  useEffect(() => { latestFile.current = file; }, [file]);
  useEffect(() => { latestVoiceId.current = voiceId; }, [voiceId]);
  useEffect(() => { latestTargetLanguage.current = targetLanguage; }, [targetLanguage]);

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
    getVoices()
      .then((data) => {
        setVoices(data.voices);
        setVoicesError(null);
      })
      .catch(() => {
        setVoicesError('음성 목록을 불러오는데 실패했습니다');
      });
  }, []);

  const runPipeline = useCallback(async (
    currentFile: File | null,
    currentVoiceId: string,
    currentTargetLanguage: DubbingLanguage,
  ) => {
    const validation = validateFileInput(currentFile, currentVoiceId, currentTargetLanguage);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    setErrorMessage(null);
    setAudioUrl(null);
    setTranscription(null);
    setTranslation(null);

    try {
      setPipelineStatus('transcribing');
      const sttResult = await transcribeFile(currentFile!);
      setTranscription(sttResult);

      const normalizedSourceLanguage = (['ko', 'en'] as string[]).includes(sttResult.languageCode)
        ? (sttResult.languageCode as DubbingLanguage)
        : 'auto';

      setPipelineStatus('translating');
      const translateResult = await translateText({
        text: sttResult.text,
        sourceLanguage: normalizedSourceLanguage,
        targetLanguage: currentTargetLanguage,
      });
      setTranslation({
        translatedText: translateResult.translatedText,
        sourceLanguage: normalizedSourceLanguage,
        targetLanguage: currentTargetLanguage,
        wasSkipped: translateResult.wasSkipped,
      });

      setPipelineStatus('synthesizing');
      const url = await createDubbing({
        text: translateResult.translatedText,
        voiceId: currentVoiceId,
        language: currentTargetLanguage,
      });
      setAudioUrl(url);
      setPipelineStatus('complete');
    } catch (error) {
      setPipelineStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '오류가 발생했습니다');
    }
  }, []);

  const submit = useCallback(async () => {
    if (pipelineStatus !== 'idle' && pipelineStatus !== 'error') return;
    await runPipeline(latestFile.current, latestVoiceId.current, latestTargetLanguage.current);
  }, [pipelineStatus, runPipeline]);

  const retry = useCallback(async () => {
    await runPipeline(latestFile.current, latestVoiceId.current, latestTargetLanguage.current);
  }, [runPipeline]);

  return {
    file,
    setFile,
    targetLanguage,
    setTargetLanguage,
    voiceId,
    setVoiceId,
    pipelineStatus,
    transcription,
    translation,
    audioUrl,
    errorMessage,
    validationErrors,
    voices,
    voicesError,
    loadVoices,
    submit,
    retry,
  };
}
