'use client';

import { type MediaType } from '@/features/dubbing-create/lib/mediaType';
import { VideoPlayer } from '@/features/dubbing-create/ui/VideoPlayer';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';

interface MediaPlayerProps {
  mediaUrl: string;
  mediaType: MediaType;
  showDownload?: boolean;
  downloadFilename?: string;
}

export function MediaPlayer({ mediaUrl, mediaType, showDownload = false, downloadFilename }: MediaPlayerProps) {
  if (mediaType === 'video') {
    return <VideoPlayer videoUrl={mediaUrl} />;
  }

  return <AudioPlayer audioUrl={mediaUrl} showDownload={showDownload} downloadFilename={downloadFilename} />;
}
