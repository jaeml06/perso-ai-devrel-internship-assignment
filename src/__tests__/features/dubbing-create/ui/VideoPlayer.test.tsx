import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { VideoPlayer } from '@/features/dubbing-create/ui/VideoPlayer';

describe('VideoPlayer', () => {
  const testUrl = 'blob:http://localhost/video-123';

  it('<video> 요소를 렌더링한다', () => {
    render(<VideoPlayer videoUrl={testUrl} />);
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('src 속성에 전달된 URL이 바인딩된다', () => {
    render(<VideoPlayer videoUrl={testUrl} />);
    const video = document.querySelector('video')!;
    expect(video.src).toBe(testUrl);
  });

  it('controls 속성이 존재한다', () => {
    render(<VideoPlayer videoUrl={testUrl} />);
    const video = document.querySelector('video')!;
    expect(video.controls).toBe(true);
  });

  it('preload="metadata" 속성이 존재한다', () => {
    render(<VideoPlayer videoUrl={testUrl} />);
    const video = document.querySelector('video')!;
    expect(video.preload).toBe('metadata');
  });
});
