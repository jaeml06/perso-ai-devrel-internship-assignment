import ky from 'ky';
import { type DubbingRequest } from '@/entities/dubbing/dto/dubbing.dto';

export async function createDubbing(request: DubbingRequest): Promise<string> {
  const response = await ky.post('/api/tts', { json: request, timeout: false });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
