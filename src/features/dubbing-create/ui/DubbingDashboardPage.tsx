'use client';

import { useDubbingCreate } from '@/features/dubbing-create/model/useDubbingCreate';
import { isProcessingPipelineStatus } from '@/features/dubbing-create/lib/pipelineStatus';
import { DubbingForm } from '@/features/dubbing-create/ui/DubbingForm';
import { PipelineProgress } from '@/features/dubbing-create/ui/PipelineProgress';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';
import { MediaPlayer } from '@/features/dubbing-create/ui/MediaPlayer';
import { DualMediaView } from '@/features/dubbing-create/ui/DualMediaView';

export function DubbingDashboardPage() {
  const {
    file,
    setFile,
    targetLanguage,
    setTargetLanguage,
    voiceId,
    setVoiceId,
    voices,
    voicesError,
    loadVoices,
    validationErrors,
    pipelineStatus,
    errorMessage,
    audioUrl,
    sourceUrl,
    mediaType,
    dubbedVideoUrl,
    submit,
    retry,
  } = useDubbingCreate();

  const isProcessing = isProcessingPipelineStatus(pipelineStatus);
  const isComplete = pipelineStatus === 'complete' && audioUrl !== null;
  const shouldShowDualView = isComplete && sourceUrl !== null && mediaType !== null;
  const shouldShowAudioPlayerOnly = isComplete && !shouldShowDualView;
  const shouldShowPreview = sourceUrl !== null && mediaType !== null && !isComplete;

  const dubbedMediaType = mediaType === 'video' && dubbedVideoUrl ? 'video' as const : 'audio' as const;
  const dubbedUrl = dubbedMediaType === 'video' ? dubbedVideoUrl! : audioUrl;

  return (
    <main className='flex-1 py-8 px-4'>
      <div className='max-w-2xl mx-auto flex flex-col gap-6 motion-safe:animate-[fade-in_0.3s_ease-out_both]'>
        <h1 className='text-2xl font-bold text-foreground'>AI 더빙 생성</h1>

        <DubbingForm
          file={file}
          onFileChange={setFile}
          targetLanguage={targetLanguage}
          onTargetLanguageChange={setTargetLanguage}
          voiceId={voiceId}
          onVoiceIdChange={setVoiceId}
          voices={voices}
          voicesError={voicesError}
          onVoicesRetry={() => { void loadVoices(); }}
          validationErrors={validationErrors}
          disabled={isProcessing}
          onSubmit={() => { void submit(); }}
        />

        {shouldShowPreview ? (
          <MediaPlayer mediaUrl={sourceUrl} mediaType={mediaType} />
        ) : null}

        <PipelineProgress
          pipelineStatus={pipelineStatus}
          errorMessage={errorMessage}
          onRetry={() => { void retry(); }}
        />

        {shouldShowDualView ? (
          <DualMediaView
            sourceUrl={sourceUrl}
            sourceMediaType={mediaType}
            dubbedUrl={dubbedUrl!}
            dubbedMediaType={dubbedMediaType}
          />
        ) : null}

        {shouldShowAudioPlayerOnly ? <AudioPlayer audioUrl={audioUrl} /> : null}
      </div>
    </main>
  );
}
