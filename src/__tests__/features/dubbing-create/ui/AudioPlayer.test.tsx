import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';

describe('AudioPlayer', () => {
  const mockAudioUrl = 'blob:http://localhost/test-audio';

  beforeEach(() => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('재생 버튼을 렌더링한다', () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    expect(screen.getByRole('button', { name: /재생/i })).toBeInTheDocument();
  });

  it('재생 버튼 클릭 시 오디오가 재생된다', () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    const playButton = screen.getByRole('button', { name: /재생/i });
    fireEvent.click(playButton);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('다운로드 버튼을 렌더링한다', () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    const downloadLink = screen.getByRole('link', { name: /다운로드/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', mockAudioUrl);
    expect(downloadLink).toHaveAttribute('download');
  });
});
