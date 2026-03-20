import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { type DubbingPipelineStatus, type FileValidationErrors } from '@/entities/dubbing/dto/dubbing.dto';
import { type Voice } from '@/entities/voice/dto/voice.dto';
import { type MediaType } from '@/features/dubbing-create/lib/mediaType';

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
    sourceUrl: string | null;
    mediaType: MediaType | null;
    dubbedVideoUrl: string | null;
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
    sourceUrl: null,
    mediaType: null,
    dubbedVideoUrl: null,
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

  // US2: 파일 업로드 직후 원본 미디어 미리보기
  it('영상 파일 업로드 후 idle 상태에서 비디오 미리보기를 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'idle',
      }),
    );

    render(<DubbingDashboardPage />);

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video!.src).toBe('blob:http://localhost/source-1');
  });

  it('오디오 파일 업로드 후 idle 상태에서 오디오 미리보기를 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['audio'], 'song.mp3', { type: 'audio/mpeg' }),
        sourceUrl: 'blob:http://localhost/source-2',
        mediaType: 'audio',
        pipelineStatus: 'idle',
      }),
    );

    render(<DubbingDashboardPage />);

    const audios = document.querySelectorAll('audio');
    const previewAudio = Array.from(audios).find(a => a.src === 'blob:http://localhost/source-2');
    expect(previewAudio).toBeInTheDocument();
  });

  it('파이프라인 진행 중에도 원본 미리보기를 유지한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'transcribing',
      }),
    );

    render(<DubbingDashboardPage />);

    expect(document.querySelector('video')).toBeInTheDocument();
  });

  // US3: 영상 파일 + 더빙 완료 → DualMediaView
  it('영상 파일 더빙 완료 시 듀얼 미디어 뷰를 렌더링한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-1',
      }),
    );

    render(<DubbingDashboardPage />);

    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('더빙')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  // US4: 오디오 파일 더빙 완료 → DualMediaView
  it('오디오 파일 더빙 완료 시 듀얼 미디어 뷰를 렌더링한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['audio'], 'song.mp3', { type: 'audio/mpeg' }),
        sourceUrl: 'blob:http://localhost/source-2',
        mediaType: 'audio',
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-2',
      }),
    );

    render(<DubbingDashboardPage />);

    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('더빙')).toBeInTheDocument();
  });

  // US6: 영상 더빙 시 영상 형태로 결과 제공
  it('영상 파일 더빙 완료 + dubbedVideoUrl → 더빙 측에 비디오 플레이어를 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-1',
        dubbedVideoUrl: 'blob:http://localhost/merged-1',
      }),
    );

    render(<DubbingDashboardPage />);

    const videos = document.querySelectorAll('video');
    expect(videos.length).toBe(2);
    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('더빙')).toBeInTheDocument();
  });

  it('영상 파일 더빙 완료 + dubbedVideoUrl=null (폴백) → 더빙 측에 오디오 플레이어를 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-1',
        dubbedVideoUrl: null,
      }),
    );

    render(<DubbingDashboardPage />);

    const videos = document.querySelectorAll('video');
    expect(videos.length).toBe(1);
    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('더빙')).toBeInTheDocument();
  });

  it('pipelineStatus가 merging이면 "영상 합성 중..." 메시지를 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
        sourceUrl: 'blob:http://localhost/source-1',
        mediaType: 'video',
        pipelineStatus: 'merging',
        audioUrl: 'blob:http://localhost/audio-1',
      }),
    );

    render(<DubbingDashboardPage />);

    expect(screen.getByText(/영상 합성 중/)).toBeInTheDocument();
  });

  it('sourceUrl 없이 complete 상태이면 기존 AudioPlayer만 표시한다', () => {
    mockUseDubbingCreate.mockReturnValue(
      buildHookState({
        pipelineStatus: 'complete',
        audioUrl: 'blob:http://localhost/audio-1',
        sourceUrl: null,
        mediaType: null,
      }),
    );

    render(<DubbingDashboardPage />);

    expect(screen.queryByText('원본')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /다운로드/i })).toBeInTheDocument();
  });
});
