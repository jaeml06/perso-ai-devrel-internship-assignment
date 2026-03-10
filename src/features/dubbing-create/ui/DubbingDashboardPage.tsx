'use client';

import { useDubbingCreate } from '@/features/dubbing-create/model/useDubbingCreate';
import { DubbingForm } from '@/features/dubbing-create/ui/DubbingForm';
import { PipelineProgress } from '@/features/dubbing-create/ui/PipelineProgress';
import { AudioPlayer } from '@/features/dubbing-create/ui/AudioPlayer';

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
    submit,
    retry,
  } = useDubbingCreate();

  const isProcessing = pipelineStatus !== 'idle' && pipelineStatus !== 'complete' && pipelineStatus !== 'error';

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

      <PipelineProgress
        pipelineStatus={pipelineStatus}
        errorMessage={errorMessage}
        onRetry={() => { void retry(); }}
      />

      {pipelineStatus === 'complete' && audioUrl && (
        <AudioPlayer audioUrl={audioUrl} />
      )}
      </div>
    </main>
  );
}
