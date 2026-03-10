import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/dubbing-create/model/useDubbingCreate', () => ({
  useDubbingCreate: () => ({
    file: null,
    setFile: vi.fn(),
    targetLanguage: 'ko',
    setTargetLanguage: vi.fn(),
    voiceId: '',
    setVoiceId: vi.fn(),
    voices: [],
    voicesError: null,
    loadVoices: vi.fn(),
    validationErrors: {},
    pipelineStatus: 'idle',
    errorMessage: null,
    audioUrl: null,
    submit: vi.fn(),
    retry: vi.fn(),
  }),
}));

import { DubbingDashboardPage } from '@/features/dubbing-create/ui/DubbingDashboardPage';

describe('DubbingDashboardPage', () => {
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
});
