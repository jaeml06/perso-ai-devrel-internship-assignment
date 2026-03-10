import { type DubbingPipelineStatus } from '@/entities/dubbing/dto/dubbing.dto';

export function isProcessingPipelineStatus(status: DubbingPipelineStatus) {
  return status === 'transcribing' || status === 'translating' || status === 'synthesizing';
}
