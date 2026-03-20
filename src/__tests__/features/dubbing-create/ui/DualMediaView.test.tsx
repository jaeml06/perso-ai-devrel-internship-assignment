import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DualMediaView } from '@/features/dubbing-create/ui/DualMediaView';

describe('DualMediaView', () => {
  it('"원본" 레이블을 표시한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    expect(screen.getByText('원본')).toBeInTheDocument();
  });

  it('"더빙" 레이블을 표시한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    expect(screen.getByText('더빙')).toBeInTheDocument();
  });

  it('sourceMediaType이 video이면 <video> 요소를 렌더링한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('sourceMediaType이 audio이면 원본 측에 <audio> 요소를 렌더링한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="audio"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    const audios = document.querySelectorAll('audio');
    expect(audios.length).toBeGreaterThanOrEqual(1);
  });

  it('더빙 AudioPlayer의 다운로드 링크가 존재한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    expect(screen.getByRole('link', { name: /다운로드/i })).toBeInTheDocument();
  });

  it('반응형 레이아웃 클래스가 존재한다', () => {
    const { container } = render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed"
        dubbedMediaType="audio"
      />,
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toMatch(/flex/);
    expect(wrapper.className).toMatch(/flex-col/);
  });

  it('dubbedMediaType이 video이면 더빙 측에 <video> 요소를 렌더링한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed-video"
        dubbedMediaType="video"
      />,
    );
    const videos = document.querySelectorAll('video');
    expect(videos.length).toBe(2);
  });

  it('dubbedMediaType이 audio이면 더빙 측에 AudioPlayer를 렌더링한다', () => {
    render(
      <DualMediaView
        sourceUrl="blob:http://localhost/source"
        sourceMediaType="video"
        dubbedUrl="blob:http://localhost/dubbed-audio"
        dubbedMediaType="audio"
      />,
    );
    const videos = document.querySelectorAll('video');
    expect(videos.length).toBe(1);
    const audios = document.querySelectorAll('audio');
    expect(audios.length).toBeGreaterThanOrEqual(1);
  });
});
