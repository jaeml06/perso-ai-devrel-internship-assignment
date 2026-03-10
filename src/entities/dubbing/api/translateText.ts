import ky from 'ky';
import {
  type TranslationSourceLanguage,
  type DubbingLanguage,
} from '@/entities/dubbing/dto/dubbing.dto';

interface TranslateRequest {
  text: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: DubbingLanguage;
}

interface TranslateResponse {
  translatedText: string;
  wasSkipped: boolean;
}

export async function translateText(
  request: TranslateRequest,
): Promise<TranslateResponse> {
  const result = await ky
    .post('/api/translate', { json: request, timeout: false })
    .json<TranslateResponse>();
  return result;
}
