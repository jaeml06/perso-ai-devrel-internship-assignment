'use client';

import { type MediaType } from '@/features/dubbing-create/lib/mediaType';
import { MediaPlayer } from '@/features/dubbing-create/ui/MediaPlayer';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';

interface DualMediaViewProps {
  sourceUrl: string;
  sourceMediaType: MediaType;
  dubbedUrl: string;
  dubbedMediaType: MediaType;
}

export function DualMediaView({ sourceUrl, sourceMediaType, dubbedUrl, dubbedMediaType }: DualMediaViewProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <section className="flex-1 min-w-0" aria-label="원본 미디어">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">원본</h3>
        <MediaPlayer mediaUrl={sourceUrl} mediaType={sourceMediaType} />
      </section>
      <section className="flex-1 min-w-0" aria-label="더빙 결과">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">더빙</h3>
        {dubbedMediaType === 'video' ? (
          <div className="flex flex-col gap-3">
            <MediaPlayer mediaUrl={dubbedUrl} mediaType="video" />
            <a
              href={dubbedUrl}
              download="dubbing.mp4"
              className="self-start text-sm text-primary underline hover:text-primary/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring rounded"
            >
              다운로드
            </a>
          </div>
        ) : (
          <AudioPlayer audioUrl={dubbedUrl} />
        )}
      </section>
    </div>
  );
}
