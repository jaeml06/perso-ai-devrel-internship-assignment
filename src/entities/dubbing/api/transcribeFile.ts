import ky from 'ky';
import { type TranscriptionResult } from '@/entities/dubbing/dto/dubbing.dto';

export async function transcribeFile(file: File): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await ky.post('/api/stt', { body: formData, timeout: false }).json<TranscriptionResult>();
  return result;
}
