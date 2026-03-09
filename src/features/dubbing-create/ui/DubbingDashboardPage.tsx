'use client';

import { useState } from 'react';
import { DubbingForm } from '@/features/dubbing-create/ui/DubbingForm';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';

export function DubbingDashboardPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  return (
    <main>
      <h1>AI 더빙 생성</h1>
      <DubbingForm onAudioReady={setAudioUrl} />
      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </main>
  );
}
