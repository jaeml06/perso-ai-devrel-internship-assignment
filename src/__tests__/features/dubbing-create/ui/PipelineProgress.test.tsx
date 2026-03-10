import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineProgress } from '@/features/dubbing-create/ui/PipelineProgress';

describe('PipelineProgress', () => {
  it('idle 상태에서 아무것도 렌더하지 않는다', () => {
    const { container } = render(
      <PipelineProgress pipelineStatus="idle" errorMessage={null} onRetry={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('transcribing 상태에서 STT 단계가 data-state="active"이다', () => {
    render(
      <PipelineProgress pipelineStatus="transcribing" errorMessage={null} onRetry={vi.fn()} />,
    );
    const sttStep = screen.getByText(/STT/i).closest('[data-state]');
    expect(sttStep).toHaveAttribute('data-state', 'active');
  });

  it('translating 상태에서 STT가 data-state="done", 번역이 data-state="active"이다', () => {
    render(
      <PipelineProgress pipelineStatus="translating" errorMessage={null} onRetry={vi.fn()} />,
    );
    const sttStep = screen.getByText(/^STT/i).closest('[data-state]');
    const translateStep = screen.getAllByText(/번역/i)[0].closest('[data-state]');
    expect(sttStep).toHaveAttribute('data-state', 'done');
    expect(translateStep).toHaveAttribute('data-state', 'active');
  });

  it('complete 상태에서 모든 단계가 data-state="done"이다', () => {
    render(
      <PipelineProgress pipelineStatus="complete" errorMessage={null} onRetry={vi.fn()} />,
    );
    const steps = document.querySelectorAll('[data-state]');
    steps.forEach((step) => {
      expect(step).toHaveAttribute('data-state', 'done');
    });
  });

  it('error 상태에서 에러 메시지와 재시도 버튼이 표시된다', () => {
    render(
      <PipelineProgress
        pipelineStatus="error"
        errorMessage="처리 중 오류가 발생했습니다"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/처리 중 오류가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry가 호출된다', () => {
    const onRetry = vi.fn();
    render(
      <PipelineProgress pipelineStatus="error" errorMessage="에러" onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('진행 상태 메시지가 aria-live 영역에 표시된다', () => {
    render(
      <PipelineProgress pipelineStatus="transcribing" errorMessage={null} onRetry={vi.fn()} />,
    );
    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeInTheDocument();
  });
});
