import ky, { HTTPError } from 'ky';
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
  try {
    return await ky
      .post('/api/translate', { json: request, timeout: false })
      .json<TranslateResponse>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const data = await error.response.json<{ error?: string }>();
      throw new Error(data.error ?? '번역에 실패했습니다');
    }
    throw error;
  }
}
