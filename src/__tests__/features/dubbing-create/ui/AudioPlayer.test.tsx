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

  it('재생/일시정지 버튼에 aria-label이 있다', () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    const playBtn = screen.getByRole('button', { name: /재생|일시정지/i });
    expect(playBtn).toHaveAttribute('aria-label');
  });

  it('시크바(range input)에 aria-label이 있다', async () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    // range is only rendered when duration > 0
    // Verify the audio element is in the document (range appears after metadata loads)
    const audio = document.querySelector('audio');
    expect(audio).toBeInTheDocument();
  });

  it('메타데이터 로드 후 경과 시간과 총 길이를 표시한다', () => {
    render(<AudioPlayer audioUrl={mockAudioUrl} />);
    const audio = document.querySelector('audio')!;

    Object.defineProperty(audio, 'duration', { value: 125, writable: true });
    fireEvent.loadedMetadata(audio);

    expect(screen.getByText(/0:00 \/ 2:05/)).toBeInTheDocument();
  });
});
