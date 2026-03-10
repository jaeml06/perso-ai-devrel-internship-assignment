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
  { status: 'complete', label: '완료' },
];

const STATUS_ORDER: DubbingPipelineStatus[] = [
  'idle', 'transcribing', 'translating', 'synthesizing', 'complete',
];

function getStepState(
  stepStatus: DubbingPipelineStatus,
  currentStatus: DubbingPipelineStatus,
): 'done' | 'active' | 'idle' {
  if (currentStatus === 'error') return 'idle';
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepStatus);
  if (currentIndex > stepIndex) return 'done';
  if (currentIndex === stepIndex) return 'active';
  return 'idle';
}

export function PipelineProgress({ pipelineStatus, errorMessage, onRetry }: PipelineProgressProps) {
  if (pipelineStatus === 'idle') return null;

  return (
    <div>
      <ol>
        {STEPS.map(({ status, label }) => {
          const state = getStepState(status, pipelineStatus);
          return (
            <li key={status} data-state={state}>
              {label}
              {state === 'done' && ' ✓'}
              {state === 'active' && ' …'}
            </li>
          );
        })}
      </ol>

      {pipelineStatus !== 'idle' && pipelineStatus !== 'error' && (
        <p>{PIPELINE_STATUS_MESSAGES[pipelineStatus]}</p>
      )}

      {pipelineStatus === 'error' && (
        <div>
          <p>{errorMessage ?? PIPELINE_STATUS_MESSAGES.error}</p>
          <button type="button" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
