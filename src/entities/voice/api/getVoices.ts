import ky from 'ky';
import { type VoiceListResponse } from '@/entities/voice/dto/voice.dto';

export async function getVoices(): Promise<VoiceListResponse> {
  return ky.get('/api/voices').json<VoiceListResponse>();
}
