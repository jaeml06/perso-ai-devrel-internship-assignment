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
import { isProcessingPipelineStatus } from '@/features/dubbing-create/lib/pipelineStatus';
import { type MediaType, getMediaType } from '@/features/dubbing-create/lib/mediaType';
import { mergeVideoAudio } from '@/features/dubbing-create/lib/mergeVideoAudio';
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
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [dubbedVideoUrl, setDubbedVideoUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  // Keep latest inputs for retry
  const latestFile = useRef(file);
  const latestVoiceId = useRef(voiceId);
  const latestTargetLanguage = useRef(targetLanguage);
  const activeAudioUrl = useRef<string | null>(null);
  const activeSourceUrl = useRef<string | null>(null);
  const activeDubbedVideoUrl = useRef<string | null>(null);

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
    const load = async () => {
      try {
        const data = await getVoices();
        setVoices(data.voices);
        setVoicesError(null);
      } catch {
        setVoicesError('음성 목록을 불러오는데 실패했습니다');
      }
    };
    void load();
  }, []);

  const revokeSourceUrl = useCallback(() => {
    if (!activeSourceUrl.current) return;
    URL.revokeObjectURL(activeSourceUrl.current);
    activeSourceUrl.current = null;
  }, []);

  const handleSetFile = useCallback((newFile: File | null) => {
    revokeSourceUrl();
    setFile(newFile);
    if (newFile) {
      const url = URL.createObjectURL(newFile);
      activeSourceUrl.current = url;
      setSourceUrl(url);
      setMediaType(getMediaType(newFile));
    } else {
      setSourceUrl(null);
      setMediaType(null);
    }
  }, [revokeSourceUrl]);

  const revokeAudioUrl = useCallback(() => {
    if (!activeAudioUrl.current) return;
    URL.revokeObjectURL(activeAudioUrl.current);
    activeAudioUrl.current = null;
  }, []);

  const revokeDubbedVideoUrl = useCallback(() => {
    if (!activeDubbedVideoUrl.current) return;
    URL.revokeObjectURL(activeDubbedVideoUrl.current);
    activeDubbedVideoUrl.current = null;
  }, []);

  const resetSessionState = useCallback(() => {
    revokeAudioUrl();
    revokeDubbedVideoUrl();
    setAudioUrl(null);
    setDubbedVideoUrl(null);
    setTranscription(null);
    setTranslation(null);
    setErrorMessage(null);
  }, [revokeAudioUrl, revokeDubbedVideoUrl]);

  useEffect(() => () => {
    revokeAudioUrl();
    revokeSourceUrl();
    revokeDubbedVideoUrl();
  }, [revokeAudioUrl, revokeSourceUrl, revokeDubbedVideoUrl]);

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
    resetSessionState();

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
      const ttsResult = await createDubbing({
        text: translateResult.translatedText,
        voiceId: currentVoiceId,
        language: currentTargetLanguage,
      });
      activeAudioUrl.current = ttsResult.url;
      setAudioUrl(ttsResult.url);

      const currentMediaType = currentFile ? getMediaType(currentFile) : null;
      if (currentMediaType === 'video' && currentFile) {
        setPipelineStatus('merging');
        try {
          const mergeResult = await mergeVideoAudio({
            videoFile: currentFile,
            audioBlob: ttsResult.blob,
          });
          activeDubbedVideoUrl.current = mergeResult.url;
          setDubbedVideoUrl(mergeResult.url);
        } catch {
          setDubbedVideoUrl(null);
        }
      }

      setPipelineStatus('complete');
    } catch (error) {
      setPipelineStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '오류가 발생했습니다');
    }
  }, [resetSessionState]);

  const submit = useCallback(async () => {
    if (isProcessingPipelineStatus(pipelineStatus)) return;
    await runPipeline(latestFile.current, latestVoiceId.current, latestTargetLanguage.current);
  }, [pipelineStatus, runPipeline]);

  const retry = useCallback(async () => {
    if (isProcessingPipelineStatus(pipelineStatus)) return;
    await runPipeline(latestFile.current, latestVoiceId.current, latestTargetLanguage.current);
  }, [pipelineStatus, runPipeline]);

  return {
    file,
    setFile: handleSetFile,
    targetLanguage,
    setTargetLanguage,
    voiceId,
    setVoiceId,
    pipelineStatus,
    transcription,
    translation,
    audioUrl,
    sourceUrl,
    mediaType,
    dubbedVideoUrl,
    errorMessage,
    validationErrors,
    voices,
    voicesError,
    loadVoices,
    submit,
    retry,
  };
}
