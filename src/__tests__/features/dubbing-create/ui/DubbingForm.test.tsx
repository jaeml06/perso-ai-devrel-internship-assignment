import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/entities/voice/api/getVoices', () => ({
  getVoices: vi.fn().mockResolvedValue({ voices: [] }),
}));

vi.mock('@/entities/dubbing/api/createDubbing', () => ({
  createDubbing: vi.fn(),
}));

describe('DubbingForm', () => {
  it('텍스트 입력란과 음성 선택, 언어 선택, 제출 버튼을 렌더링한다', async () => {
    const { DubbingForm } = await import('@/features/dubbing-create/ui/DubbingForm');
    render(<DubbingForm />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /언어/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /더빙 생성/i })).toBeInTheDocument();
  });

  it('텍스트 길이가 0일 때 글자 수 카운터가 "0/5000"을 표시한다', async () => {
    const { DubbingForm } = await import('@/features/dubbing-create/ui/DubbingForm');
    render(<DubbingForm />);

    expect(screen.getByText('0/5000')).toBeInTheDocument();
  });

  it('빈 텍스트로 제출 시 유효성 에러 메시지를 표시한다', async () => {
    const { DubbingForm } = await import('@/features/dubbing-create/ui/DubbingForm');
    render(<DubbingForm />);

    const submitButton = screen.getByRole('button', { name: /더빙 생성/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/텍스트를 입력해주세요/)).toBeInTheDocument();
  });

  it('로딩 중 제출 버튼이 비활성화된다', async () => {
    const { getVoices } = await import('@/entities/voice/api/getVoices');
    vi.mocked(getVoices).mockResolvedValue({
      voices: [
        {
          id: 'voice123',
          name: 'Rachel',
          gender: 'female',
          ageGroup: 'young',
          previewUrl: 'https://example.com/rachel.mp3',
          description: '젊은 여성',
        },
      ],
    });
    const { createDubbing } = await import('@/entities/dubbing/api/createDubbing');
    vi.mocked(createDubbing).mockReturnValueOnce(new Promise(() => {}));

    const { DubbingForm } = await import('@/features/dubbing-create/ui/DubbingForm');
    const { act: reactAct } = await import('@testing-library/react');
    await reactAct(async () => {
      render(<DubbingForm />);
    });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '안녕하세요' } });

    const select = screen.getByRole('combobox', { name: '' });
    fireEvent.change(select, { target: { value: 'voice123' } });

    const submitButton = screen.getByRole('button', { name: /더빙 생성/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
