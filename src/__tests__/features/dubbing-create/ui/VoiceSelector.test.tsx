import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceSelector } from '@/features/dubbing-create/ui/VoiceSelector';
import { type Voice } from '@/entities/voice/dto/voice.dto';

const mockVoices: Voice[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    ageGroup: 'young',
    previewUrl: 'https://example.com/rachel.mp3',
    description: '젊은 여성 · 차분하고 명확한 발음',
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'male',
    ageGroup: 'young',
    previewUrl: 'https://example.com/josh.mp3',
    description: '젊은 남성 · 자연스럽고 친근한 목소리',
  },
];

describe('VoiceSelector', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('음성 목록이 드롭다운에 표시된다', () => {
    render(
      <VoiceSelector voices={mockVoices} selectedVoiceId="" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('음성을 선택해주세요')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Rachel/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Josh/ })).toBeInTheDocument();
  });

  it('음성 선택 시 onChange가 호출된다', () => {
    const onChange = vi.fn();
    render(
      <VoiceSelector voices={mockVoices} selectedVoiceId="" onChange={onChange} />,
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '21m00Tcm4TlvDq8ikWAM' } });
    expect(onChange).toHaveBeenCalledWith('21m00Tcm4TlvDq8ikWAM');
  });

  it('미리듣기 버튼이 표시된다', () => {
    render(
      <VoiceSelector
        voices={mockVoices}
        selectedVoiceId="21m00Tcm4TlvDq8ikWAM"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /미리듣기/i })).toBeInTheDocument();
  });

  it('API 에러 시 에러 메시지와 재시도 버튼을 표시한다', () => {
    render(
      <VoiceSelector
        voices={[]}
        selectedVoiceId=""
        onChange={vi.fn()}
        error="음성 목록을 불러오는데 실패했습니다"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/음성 목록을 불러오는데 실패했습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /재시도/i })).toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry가 호출된다', () => {
    const onRetry = vi.fn();
    render(
      <VoiceSelector
        voices={[]}
        selectedVoiceId=""
        onChange={vi.fn()}
        error="에러 발생"
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /재시도/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
