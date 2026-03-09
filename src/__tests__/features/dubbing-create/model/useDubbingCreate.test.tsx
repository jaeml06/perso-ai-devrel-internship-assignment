import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/entities/dubbing/api/createDubbing', () => ({
  createDubbing: vi.fn(),
}));

vi.mock('@/entities/voice/api/getVoices', () => ({
  getVoices: vi.fn(),
}));

describe('useDubbingCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태: 빈 폼, 로딩 없음, 오디오 없음', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    expect(result.current.text).toBe('');
    expect(result.current.voiceId).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('빈 텍스트 제출 시 유효성 에러 표시', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    await act(async () => {
      result.current.setText('');
      result.current.setVoiceId('voice123');
      await result.current.submit();
    });

    expect(result.current.validationErrors.text).toBeDefined();
  });

  it('음성 미선택 제출 시 유효성 에러 표시', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    await act(async () => {
      result.current.setText('안녕하세요');
      result.current.setVoiceId('');
      await result.current.submit();
    });

    expect(result.current.validationErrors.voiceId).toBeDefined();
  });

  it('제출 성공 시 audioUrl이 설정된다', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockResolvedValue('blob:http://localhost/test-audio');

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setText('안녕하세요');
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.audioUrl).toBe('blob:http://localhost/test-audio');
    expect(result.current.isLoading).toBe(false);
  });

  it('API 에러 시 errorMessage가 설정된다', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockRejectedValue(new Error('API 오류'));

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setText('안녕하세요');
      result.current.setVoiceId('voice123');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.errorMessage).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('진행 중 중복 제출이 방지된다', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({ voices: [] });
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');

    let resolvePromise!: (value: string) => void;
    vi.mocked(createDubbing).mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { useDubbingCreate } = await import('@/features/dubbing-create/model/useDubbingCreate');
    const { result } = renderHook(() => useDubbingCreate());

    act(() => {
      result.current.setText('안녕하세요');
      result.current.setVoiceId('voice123');
    });

    act(() => {
      void result.current.submit();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      void result.current.submit();
    });

    expect(createDubbing).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise('blob:http://localhost/audio');
    });
  });
});
