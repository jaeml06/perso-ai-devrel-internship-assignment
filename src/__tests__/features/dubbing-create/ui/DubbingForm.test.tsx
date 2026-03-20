import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DubbingForm } from '@/features/dubbing-create/ui/DubbingForm';

const defaultProps = {
  file: null,
  onFileChange: vi.fn(),
  targetLanguage: 'ko' as const,
  onTargetLanguageChange: vi.fn(),
  voiceId: '',
  onVoiceIdChange: vi.fn(),
  voices: [],
  voicesError: null,
  onVoicesRetry: vi.fn(),
  validationErrors: {},
  onSubmit: vi.fn(),
  fileDuration: null as number | null,
};

describe('DubbingForm', () => {
  it('파일 입력, 언어 선택, 제출 버튼을 렌더링한다', () => {
    render(<DubbingForm {...defaultProps} />);

    expect(screen.getByLabelText(/오디오\/비디오 파일/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /타겟 언어/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /더빙 생성/i })).toBeInTheDocument();
  });

  it('파일 선택 시 파일명을 표시한다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} />);

    expect(screen.getByText('test.mp3')).toBeInTheDocument();
  });

  it('validationErrors.file이 있으면 에러 메시지를 표시한다', () => {
    render(
      <DubbingForm
        {...defaultProps}
        validationErrors={{ file: '파일을 업로드해주세요' }}
      />,
    );

    expect(screen.getByText('파일을 업로드해주세요')).toBeInTheDocument();
  });

  it('disabled=true일 때 제출 버튼이 비활성화된다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} voiceId="voice123" disabled />);

    expect(screen.getByRole('button', { name: /더빙 생성/i })).toBeDisabled();
  });

  it('disabled=true일 때 파일 입력과 언어 선택도 비활성화된다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} voiceId="voice123" disabled />);

    expect(screen.getByLabelText(/오디오\/비디오 파일/i)).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /타겟 언어/i })).toBeDisabled();
  });

  it('disabled=false이면 완료 후 같은 입력으로 다시 제출할 수 있다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} voiceId="voice123" disabled={false} />);

    expect(screen.getByLabelText(/오디오\/비디오 파일/i)).toBeEnabled();
    expect(screen.getByRole('combobox', { name: /타겟 언어/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /더빙 생성/i })).toBeEnabled();
  });

  it('에러 메시지에 aria-live="polite" 속성이 있다', () => {
    render(
      <DubbingForm
        {...defaultProps}
        validationErrors={{ file: '파일을 업로드해주세요' }}
      />,
    );
    const errorMsg = screen.getByText('파일을 업로드해주세요');
    expect(errorMsg).toHaveAttribute('aria-live', 'polite');
  });

  it('파일명이 있을 때 truncate 구조로 렌더된다', () => {
    const file = new File(['audio'], 'very-long-filename-for-testing-truncate.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} />);
    const filenameEl = screen.getByText(/very-long-filename/i);
    expect(filenameEl).toHaveClass('truncate');
  });

  it('disabled 버튼은 opacity-50 클래스로 시각적으로 구분된다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} voiceId="voice123" disabled />);
    const btn = screen.getByRole('button', { name: /더빙 생성/i });
    expect(btn).toHaveClass('disabled:opacity-50');
  });

  it('fileDuration=300 (5분) 전달 시 크롭 안내 메시지를 표시한다', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} fileDuration={300} />);
    expect(screen.getByText(/처음 1분만 처리됩니다/)).toBeInTheDocument();
    expect(screen.getByText(/5분 0초/)).toBeInTheDocument();
  });

  it('fileDuration=30 (30초) 전달 시 크롭 안내 미표시', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} fileDuration={30} />);
    expect(screen.queryByText(/처음 1분만 처리됩니다/)).not.toBeInTheDocument();
  });

  it('fileDuration=null (파일 미선택) 시 크롭 안내 미표시', () => {
    render(<DubbingForm {...defaultProps} fileDuration={null} />);
    expect(screen.queryByText(/처음 1분만 처리됩니다/)).not.toBeInTheDocument();
  });

  it('fileDuration=60 (정확히 1분) 시 크롭 안내 미표시', () => {
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    render(<DubbingForm {...defaultProps} file={file} fileDuration={60} />);
    expect(screen.queryByText(/처음 1분만 처리됩니다/)).not.toBeInTheDocument();
  });
});
