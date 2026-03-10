import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  type DubbingLanguage,
  type TranscriptionResult,
  type TranslationResult,
} from '@/entities/dubbing/dto/dubbing.dto';

vi.mock('@/entities/dubbing/api/transcribeFile', () => ({
  transcribeFile: vi.fn(),
}));

vi.mock('@/entities/dubbing/api/translateText', () => ({
  translateText: vi.fn(),
}));

vi.mock('@/entities/dubbing/api/createDubbing', () => ({
  createDubbing: vi.fn(),
}));

vi.mock('@/entities/voice/api/getVoices', () => ({
  getVoices: vi.fn(),
}));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

function makeFile(name = 'test.mp3', type = 'audio/mpeg'): File {
  return new File(['audio'], name, { type });
}

function buildTranscriptionResult(
  overrides: Partial<TranscriptionResult> = {},
): TranscriptionResult {
  return {
    text: 'Hello world',
    languageCode: 'en',
    languageProbability: 0.99,
    ...overrides,
  };
}

function buildTranslationResult(
  overrides: Partial<TranslationResult> = {},
): TranslationResult {
  return {
    translatedText: '안녕하세요',
    sourceLanguage: 'en',
    targetLanguage: 'ko',
    wasSkipped: false,
    ...overrides,
  };
}

async function renderUseDubbingCreate() {
  const { getVoices } = await import('@/entities/voice/api/getVoices');
  vi.mocked(getVoices).mockResolvedValue({ voices: [] });

  const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
  const hook = renderHook(() => useDubbingCreate());

  await waitFor(() => {
    expect(getVoices).toHaveBeenCalledTimes(1);
  });

  return hook;
}

async function completeSuccessfulSubmit(options?: {
  file?: File;
  voiceId?: string;
  targetLanguage?: DubbingLanguage;
  transcription?: TranscriptionResult;
  translation?: TranslationResult;
  audioUrl?: string;
}) {
  const file = options?.file ?? makeFile();
  const voiceId = options?.voiceId ?? 'voice123';
  const targetLanguage = options?.targetLanguage ?? 'ko';
  const transcription = options?.transcription ?? buildTranscriptionResult();
  const translation = options?.translation ?? buildTranslationResult({ targetLanguage });
  const audioUrl = options?.audioUrl ?? 'blob:http://localhost/audio-1';

  const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
  const { translateText } = await import('@/entities/dubbing/api/translateText');
  const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');

  vi.mocked(transcribeFile).mockResolvedValueOnce(transcription);
  vi.mocked(translateText).mockResolvedValueOnce({
    translatedText: translation.translatedText,
    wasSkipped: translation.wasSkipped,
  });
  vi.mocked(createDubbing).mockResolvedValueOnce(audioUrl);

  const hook = await renderUseDubbingCreate();

  act(() => {
    hook.result.current.setFile(file);
    hook.result.current.setVoiceId(voiceId);
    hook.result.current.setTargetLanguage(targetLanguage);
  });

  await act(async () => {
    await hook.result.current.submit();
  });

  return { ...hook, file, voiceId, targetLanguage, transcription, translation, audioUrl };
}

describe('useDubbingCreate (pipeline)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태: file null, pipelineStatus idle, audioUrl null', async () => {
    const { result } = await renderUseDubbingCreate();

    expect(result.current.file).toBeNull();
    expect(result.current.pipelineStatus).toBe('idle');
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('파일 없이 제출 → validationErrors.file 설정, API 미호출', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { result } = await renderUseDubbingCreate();

    await act(async () => {
      result.current.setVoiceId('voice123');
      await result.current.submit();
    });

    expect(result.current.validationErrors.file).toBeDefined();
    expect(transcribeFile).not.toHaveBeenCalled();
  });

  it('voiceId 없이 제출 → validationErrors.voiceId 설정, API 미호출', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { result } = await renderUseDubbingCreate();

    await act(async () => {
      result.current.setFile(makeFile());
      await result.current.submit();
    });

    expect(result.current.validationErrors.voiceId).toBeDefined();
    expect(transcribeFile).not.toHaveBeenCalled();
  });

  it('정상 제출 → pipelineStatus 순서: transcribing → translating → synthesizing → complete', async () => {
    const { result } = await completeSuccessfulSubmit();

    expect(result.current.pipelineStatus).toBe('complete');
    expect(result.current.audioUrl).toBe('blob:http://localhost/audio-1');
  });

  it('STT 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockRejectedValueOnce(new Error('STT failed'));

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBe('STT failed');
  });

  it('번역 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult());
    vi.mocked(translateText).mockRejectedValueOnce(new Error('translate failed'));

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBe('translate failed');
  });

  it('TTS 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult());
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: '안녕',
      wasSkipped: false,
    });
    vi.mocked(createDubbing).mockRejectedValueOnce(new Error('TTS failed'));

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBe('TTS failed');
  });

  it('진행 중 중복 제출 차단', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const transcribeDeferred = createDeferred<TranscriptionResult>();
    vi.mocked(transcribeFile).mockReturnValueOnce(transcribeDeferred.promise);

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    act(() => {
      void result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.pipelineStatus).toBe('transcribing');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(transcribeFile).toHaveBeenCalledTimes(1);

    await act(async () => {
      transcribeDeferred.reject(new Error('stop'));
      await transcribeDeferred.promise.catch(() => undefined);
    });
  });

  it('complete 상태에서 동일 입력으로 submit()을 다시 호출하면 새 attempt가 시작된다', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    const initial = await completeSuccessfulSubmit({
      audioUrl: 'blob:http://localhost/audio-1',
    });

    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult({ text: 'Again' }));
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: '다시',
      wasSkipped: false,
    });
    vi.mocked(createDubbing).mockResolvedValueOnce('blob:http://localhost/audio-2');

    await act(async () => {
      await initial.result.current.submit();
    });

    expect(transcribeFile).toHaveBeenCalledTimes(2);
    expect(translateText).toHaveBeenNthCalledWith(2, {
      text: 'Again',
      sourceLanguage: 'en',
      targetLanguage: 'ko',
    });
    expect(createDubbing).toHaveBeenNthCalledWith(2, {
      text: '다시',
      voiceId: 'voice123',
      language: 'ko',
    });
    expect(initial.result.current.pipelineStatus).toBe('complete');
    expect(initial.result.current.audioUrl).toBe('blob:http://localhost/audio-2');
  });

  it('complete 상태에서 입력을 바꾸고 submit()을 다시 호출하면 변경된 조건으로 새 attempt가 시작된다', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    const initial = await completeSuccessfulSubmit();
    const nextFile = makeFile('second.mp4', 'video/mp4');

    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult({ text: 'Second' }));
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: 'Second',
      wasSkipped: true,
    });
    vi.mocked(createDubbing).mockResolvedValueOnce('blob:http://localhost/audio-2');

    act(() => {
      initial.result.current.setFile(nextFile);
      initial.result.current.setTargetLanguage('en');
      initial.result.current.setVoiceId('voice456');
    });

    await act(async () => {
      await initial.result.current.submit();
    });

    expect(transcribeFile).toHaveBeenNthCalledWith(2, nextFile);
    expect(translateText).toHaveBeenNthCalledWith(2, {
      text: 'Second',
      sourceLanguage: 'en',
      targetLanguage: 'en',
    });
    expect(createDubbing).toHaveBeenNthCalledWith(2, {
      text: 'Second',
      voiceId: 'voice456',
      language: 'en',
    });
    expect(initial.result.current.audioUrl).toBe('blob:http://localhost/audio-2');
  });

  it('새 submit이 수락되면 이전 결과와 오류 상태를 즉시 초기화한다', async () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const initial = await completeSuccessfulSubmit({
      audioUrl: 'blob:http://localhost/audio-stale',
    });
    const transcribeDeferred = createDeferred<TranscriptionResult>();

    vi.mocked(transcribeFile).mockReturnValueOnce(transcribeDeferred.promise);

    act(() => {
      void initial.result.current.submit();
    });

    await waitFor(() => {
      expect(initial.result.current.pipelineStatus).toBe('transcribing');
    });

    expect(initial.result.current.audioUrl).toBeNull();
    expect(initial.result.current.transcription).toBeNull();
    expect(initial.result.current.translation).toBeNull();
    expect(initial.result.current.errorMessage).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/audio-stale');

    await act(async () => {
      transcribeDeferred.reject(new Error('stop'));
      await transcribeDeferred.promise.catch(() => undefined);
    });
  });

  it('error 상태에서 retry()는 현재 입력으로 새 attempt를 시작하고 이전 오류 상태를 즉시 초기화한다', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult());
    vi.mocked(translateText).mockRejectedValueOnce(new Error('translate failed'));

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.transcription).toEqual(buildTranscriptionResult());
    expect(result.current.errorMessage).toBe('translate failed');

    const retryDeferred = createDeferred<TranscriptionResult>();
    vi.mocked(transcribeFile).mockReturnValueOnce(retryDeferred.promise);
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: '안녕하세요',
      wasSkipped: false,
    });
    vi.mocked(createDubbing).mockResolvedValueOnce('blob:http://localhost/audio-retry');

    act(() => {
      void result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.pipelineStatus).toBe('transcribing');
    });

    expect(result.current.transcription).toBeNull();
    expect(result.current.translation).toBeNull();
    expect(result.current.errorMessage).toBeNull();

    await act(async () => {
      retryDeferred.resolve(buildTranscriptionResult({ text: 'Retry' }));
      await retryDeferred.promise;
    });

    await waitFor(() => {
      expect(result.current.pipelineStatus).toBe('complete');
    });

    expect(transcribeFile).toHaveBeenCalledTimes(2);
    expect(createDubbing).toHaveBeenLastCalledWith({
      text: '안녕하세요',
      voiceId: 'voice123',
      language: 'ko',
    });
  });

  it('error 상태에서 submit()을 다시 호출해도 새 attempt가 시작된다', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockRejectedValueOnce(new Error('STT failed'));

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');

    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult({ text: 'Recovered' }));
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: '복구됨',
      wasSkipped: false,
    });
    vi.mocked(createDubbing).mockResolvedValueOnce('blob:http://localhost/audio-recovered');

    await act(async () => {
      await result.current.submit();
    });

    expect(transcribeFile).toHaveBeenCalledTimes(2);
    expect(result.current.pipelineStatus).toBe('complete');
    expect(result.current.audioUrl).toBe('blob:http://localhost/audio-recovered');
  });

  it('훅이 언마운트되면 현재 Blob URL을 revoke한다', async () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const hook = await completeSuccessfulSubmit({
      audioUrl: 'blob:http://localhost/audio-cleanup',
    });

    hook.unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/audio-cleanup');
  });

  it('STT가 지원하지 않는 languageCode(fr) 반환 → translateText에 sourceLanguage: auto 전달', async () => {
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    const { translateText } = await import('@/entities/dubbing/api/translateText');
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(transcribeFile).mockResolvedValueOnce(buildTranscriptionResult({
      text: 'Bonjour',
      languageCode: 'fr',
      languageProbability: 0.98,
    }));
    vi.mocked(translateText).mockResolvedValueOnce({
      translatedText: '안녕하세요',
      wasSkipped: false,
    });
    vi.mocked(createDubbing).mockResolvedValueOnce('blob:http://localhost/audio');

    const { result } = await renderUseDubbingCreate();

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(translateText).toHaveBeenCalledWith(
      expect.objectContaining({ sourceLanguage: 'auto' }),
    );
    expect(result.current.pipelineStatus).toBe('complete');
  });
});
