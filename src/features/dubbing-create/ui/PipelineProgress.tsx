'use client';

import {
  type DubbingPipelineStatus,
  PIPELINE_STATUS_MESSAGES,
} from '@/entities/dubbing/dto/dubbing.dto';

interface PipelineProgressProps {
  pipelineStatus: DubbingPipelineStatus;
  errorMessage: string | null;
  onRetry: () => void;
}

const STEPS: { status: DubbingPipelineStatus; label: string }[] = [
  { status: 'transcribing', label: 'STT' },
  { status: 'translating', label: '번역' },
  { status: 'synthesizing', label: 'TTS' },
  { status: 'merging', label: '영상 합성' },
  { status: 'complete', label: '완료' },
];

const STATUS_ORDER: DubbingPipelineStatus[] = [
  'idle', 'transcribing', 'translating', 'synthesizing', 'merging', 'complete',
];

function getStepState(
  stepStatus: DubbingPipelineStatus,
  currentStatus: DubbingPipelineStatus,
): 'done' | 'active' | 'idle' {
  if (currentStatus === 'error') return 'idle';
  if (currentStatus === 'complete') return 'done';
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepStatus);
  if (currentIndex > stepIndex) return 'done';
  if (currentIndex === stepIndex) return 'active';
  return 'idle';
}

export function PipelineProgress({ pipelineStatus, errorMessage, onRetry }: PipelineProgressProps) {
  if (pipelineStatus === 'idle') return null;

  const shouldShowStatusMessage = pipelineStatus !== 'error';
  const shouldShowRetry = pipelineStatus === 'error';

  return (
    <div className='rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col gap-4'>
      <ol className='flex flex-col gap-3'>
        {STEPS.map(({ status, label }) => {
          const state = getStepState(status, pipelineStatus);
          return (
            <li
              key={status}
              data-state={state}
              className={[
                'flex items-center gap-2 text-sm font-medium motion-safe:transition-all motion-safe:duration-300',
                state === 'done' ? 'text-success' : '',
                state === 'active' ? 'text-primary' : '',
                state === 'idle' ? 'text-muted-foreground' : '',
              ].join(' ')}
            >
              {state === 'done' && (
                <span aria-hidden="true" className='text-success'>✓</span>
              )}
              {state === 'active' && (
                <svg aria-hidden="true" className="animate-spin inline-block w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {state === 'idle' && (
                <span aria-hidden="true" className='opacity-30'>○</span>
              )}
              {label}
            </li>
          );
        })}
      </ol>

      {shouldShowStatusMessage ? (
        <p aria-live='polite' className='text-sm text-muted-foreground'>
          {PIPELINE_STATUS_MESSAGES[pipelineStatus]}
        </p>
      ) : null}

      {shouldShowRetry ? (
        <div className='bg-destructive/10 border border-destructive rounded-lg p-4 flex flex-col gap-3'>
          <p className='text-sm text-destructive'>{errorMessage ?? PIPELINE_STATUS_MESSAGES.error}</p>
          <button
            type="button"
            className='self-start bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring'
            onClick={onRetry}
          >
            다시 시도
          </button>
        </div>
      ) : null}
    </div>
  );
}
