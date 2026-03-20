'use client';

interface VideoPlayerProps {
  videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <video
      controls
      preload="metadata"
      src={videoUrl}
      className="w-full rounded-lg"
    />
  );
}
