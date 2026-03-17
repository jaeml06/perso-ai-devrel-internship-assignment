import ky, { HTTPError } from 'ky';
import { type DubbingRequest } from '@/entities/dubbing/dto/dubbing.dto';

export async function createDubbing(request: DubbingRequest): Promise<string> {
  try {
    const response = await ky.post('/api/tts', { json: request, timeout: false });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    if (error instanceof HTTPError) {
      const data = await error.response.json<{ error?: string }>();
      throw new Error(data.error ?? '오디오 생성에 실패했습니다');
    }
    throw error;
  }
}
