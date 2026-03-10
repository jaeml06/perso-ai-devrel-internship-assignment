import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { type DubbingPipelineStatus, type FileValidationErrors } from '@/entities/dubbing/dto/dubbing.dto';
import { type Voice } from '@/entities/voice/dto/voice.dto';

const { mockUseDubbingCreate } = vi.hoisted(() => ({
  mockUseDubbingCreate: vi.fn(),
}));

vi.mock('@/features/dubbing-create/model/useDubbingCreate', () => ({
  useDubbingCreate: mockUseDubbingCreate,
}));

import { DubbingDashboardPage } from '@/features/dubbing-create/ui/DubbingDashboardPage';

function buildHookState(
  overrides: Partial<{
    file: File | null;
    targetLanguage: 'ko' | 'en';
    voiceId: string;
    voices: Voice[];
    voicesError: string | null;
    validationErrors: FileValidationErrors;
    pipelineStatus: DubbingPipelineStatus;
    errorMessage: string | null;
    audioUrl: string | null;
    submit: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    file: null,
    setFile: vi.fn(),
    targetLanguage: 'ko' as const,
    setTargetLanguage: vi.fn(),
    voiceId: 'voice123',
    setVoiceId: vi.fn(),
    voices: [] as Voice[],
    voicesError: null,
    loadVoices: vi.fn(),
    validationErrors: {} as FileValidationErrors,
    pipelineStatus: 'idle' as DubbingPipelineStatus,
    errorMessage: null,
    audioUrl: null,
    submit: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('DubbingDashboardPage', () => {
  beforeEach(() => {
    mockUseDubbingCreate.mockReturnValue(buildHookState());
  });

  it('main 역할이 존재한다', () => {
    render(<DubbingDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('heading "AI 더빙 생성"이 렌더된다', () => {
    render(<DubbingDashboardPage />);
    expect(screen.getByRole('heading', { name: /AI 더빙 생성/i })).toBeInTheDocument();
  });

  it('DubbingForm이 렌더된다 (더빙 생성 버튼 존재)', () => {
    render(<DubbingDashboardPage />);
    expect(screen.getByRole('button', { name: /더빙 생성/i })).toBeInTheDocument();
  });

  it('complete 상태에서는 같은 화면에서 다시 submit할 수 있다', () => {
    const submit = vi.fn();
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['audio'], 'done.mp3', { type: 'audio/mpeg' }),
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-finished',
        submit,
      }),
    );

    render(<DubbingDashboardPage />);

    const submitButton = screen.getByRole('button', { name: /더빙 생성/i });
    expect(submitButton).toBeEnabled();
    expect(screen.getByRole('link', { name: /다운로드/i })).toBeInTheDocument();

    fireEvent.click(submitButton);

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('새 attempt가 시작된 상태에서는 이전 오디오를 숨긴다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['audio'], 'repeat.mp3', { type: 'audio/mpeg' }),
        pipelineStatus: 'transcribing',
        audioUrl: 'blob:http://localhost/audio-stale',
      }),
    );

    render(<DubbingDashboardPage />);

    expect(screen.queryByRole('link', { name: /다운로드/i })).not.toBeInTheDocument();
    expect(screen.getByText(/음성을 텍스트로 변환 중/i)).toBeInTheDocument();
  });
});
