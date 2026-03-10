'use client';

import { useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (audio) setDuration(audio.duration);
  }

  function handleEnded() {
    setIsPlaying(false);
    setCurrentTime(0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }

  return (
    <div className='rounded-2xl border border-border bg-card p-4 flex flex-col gap-3'>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <div className='flex items-center gap-3'>
        <button
          type="button"
          aria-label={isPlaying ? '일시정지' : '재생'}
          className='flex items-center justify-center w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring'
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-px">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {duration > 0 && (
          <input
            type="range"
            aria-label="재생 위치"
            className='flex-1 accent-primary'
            min={0}
            max={duration}
            value={currentTime}
            step={0.1}
            onChange={handleSeek}
          />
        )}
      </div>
      <a
        href={audioUrl}
        download="dubbing.mp3"
        className='self-start text-sm text-primary underline hover:text-primary/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring rounded'
      >
        다운로드
      </a>
    </div>
  );
}
