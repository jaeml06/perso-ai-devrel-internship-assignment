import ky, { HTTPError } from 'ky';
import { type TranscriptionResult } from '@/entities/dubbing/dto/dubbing.dto';

export async function transcribeFile(file: File): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await ky.post('/api/stt', { body: formData, timeout: false }).json<TranscriptionResult>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const data = await error.response.json<{ error?: string }>();
      throw new Error(data.error ?? '음성 인식에 실패했습니다');
    }
    throw error;
  }
}
