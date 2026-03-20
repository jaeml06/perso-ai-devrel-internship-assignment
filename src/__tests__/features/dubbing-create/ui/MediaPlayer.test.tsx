import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MediaPlayer } from '@/features/dubbing-create/ui/MediaPlayer';

describe('MediaPlayer', () => {
  const testUrl = 'blob:http://localhost/media-123';

  it('mediaType이 video이면 <video> 요소를 렌더링한다', () => {
    render(<MediaPlayer mediaUrl={testUrl} mediaType="video" />);
    expect(document.querySelector('video')).toBeInTheDocument();
    expect(document.querySelector('audio')).not.toBeInTheDocument();
  });

  it('mediaType이 audio이면 <audio> 요소를 렌더링한다', () => {
    render(<MediaPlayer mediaUrl={testUrl} mediaType="audio" />);
    expect(document.querySelector('audio')).toBeInTheDocument();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  it('audio 모드에서 재생 버튼이 존재한다', () => {
    render(<MediaPlayer mediaUrl={testUrl} mediaType="audio" />);
    const audio = document.querySelector('audio')!;
    expect(audio).toBeInTheDocument();
  });

  it('audio 모드에서 src가 올바르게 바인딩된다', () => {
    render(<MediaPlayer mediaUrl={testUrl} mediaType="audio" />);
    const audio = document.querySelector('audio')!;
    expect(audio.src).toBe(testUrl);
  });
});
