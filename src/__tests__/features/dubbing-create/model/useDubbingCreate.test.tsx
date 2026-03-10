import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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

function makeFile(name = 'test.mp3', type = 'audio/mpeg'): File {
  return new File(['audio'], name, { type });
}

describe('useDubbingCreate (pipeline)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태: file null, pipelineStatus idle, audioUrl null', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    expect(result.current.file).toBeNull();
    expect(result.current.pipelineStatus).toBe('idle');
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('파일 없이 제출 → validationErrors.file 설정, API 미호출', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    await act(async () => {
      result.current.setVoiceId('voice123');
      await result.current.submit();
    });

    expect(result.current.validationErrors.file).toBeDefined();
    expect(transcribeFile).not.toHaveBeenCalled();
  });

  it('voiceId 없이 제출 → validationErrors.voiceId 설정, API 미호출', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });
    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    await act(async () => {
      result.current.setFile(makeFile());
      await result.current.submit();
    });

    expect(result.current.validationErrors.voiceId).toBeDefined();
    expect(transcribeFile).not.toHaveBeenCalled();
  });

  it('정상 제출 → pipelineStatus 순서: transcribing → translating → synthesizing → complete', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockResolvedValue({
      text: 'Hello world',
      languageCode: 'en',
      languageProbability: 0.99,
    });

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(translateText).mockResolvedValue({
      translatedText: '안녕하세요',
      wasSkipped: false,
    });

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockResolvedValue('blob:http://localhost/audio');

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('complete');
    expect(result.current.audioUrl).toBe('blob:http://localhost/audio');
  });

  it('STT 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockRejectedValue(new Error('STT failed'));

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('번역 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockResolvedValue({
      text: 'Hello',
      languageCode: 'en',
      languageProbability: 0.99,
    });

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(translateText).mockRejectedValue(new Error('translate failed'));

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('TTS 실패 → pipelineStatus: error, errorMessage 설정', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockResolvedValue({
      text: 'Hello',
      languageCode: 'en',
      languageProbability: 0.99,
    });

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(translateText).mockResolvedValue({ translatedText: '안녕', wasSkipped: false });

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockRejectedValue(new Error('TTS failed'));

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.pipelineStatus).toBe('error');
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('진행 중 중복 제출 차단', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    let resolveTranscribe!: (v: { text: string; languageCode: string; languageProbability: number }) => void;
    vi.mocked(transcribeFile).mockReturnValueOnce(
      new Promise((resolve) => { resolveTranscribe = resolve; }),
    );

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    act(() => { void result.current.submit(); });

    expect(result.current.pipelineStatus).toBe('transcribing');

    await act(async () => { void result.current.submit(); });

    expect(transcribeFile).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTranscribe({ text: '', languageCode: 'en', languageProbability: 0.5 });
    });
  });

  it('retry() → 동일 입력으로 파이프라인 재시작', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockRejectedValueOnce(new Error('STT failed'));

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.pipelineStatus).toBe('error');

    vi.mocked(transcribeFile).mockResolvedValue({
      text: 'Hello',
      languageCode: 'en',
      languageProbability: 0.99,
    });

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(translateText).mockResolvedValue({ translatedText: '안녕', wasSkipped: false });

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockResolvedValue('blob:http://localhost/audio');

    await act(async () => { await result.current.retry(); });
    expect(result.current.pipelineStatus).toBe('complete');
  });

  it('STT가 지원하지 않는 languageCode(fr) 반환 → translateText에 sourceLanguage: auto 전달', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { transcribeFile } = await import('@/entities/dubbing/api/transcribeFile');
    vi.mocked(transcribeFile).mockResolvedValue({
      text: 'Bonjour',
      languageCode: 'fr',
      languageProbability: 0.98,
    });

    const { translateText } = await import('@/entities/dubbing/api/translateText');
    vi.mocked(translateText).mockResolvedValue({ translatedText: '안녕하세요', wasSkipped: false });

    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockResolvedValue('blob:http://localhost/audio');

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setFile(makeFile());
      result.current.setVoiceId('voice123');
    });

    await act(async () => { await result.current.submit(); });

    expect(translateText).toHaveBeenCalledWith(
      expect.objectContaining({ sourceLanguage: 'auto' }),
    );
    expect(result.current.pipelineStatus).toBe('complete');
  });
});
