import { NextResponse } from 'next/server';
import { getElevenLabsApiKey } from '@/shared/config/env';

export async function POST(request: Request) {
  let apiKey: string;
  try {
    apiKey = getElevenLabsApiKey();
  } catch {
    return NextResponse.json({ error: '서버 설정 오류가 발생했습니다' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: '파일을 업로드해주세요' }, { status: 400 });
  }

  const elevenLabsForm = new FormData();
  elevenLabsForm.append('file', file);
  elevenLabsForm.append('model_id', 'scribe_v1');

  let response: Response;
  try {
    response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elevenLabsForm,
    });
  } catch {
    return NextResponse.json({ error: '음성 인식에 실패했습니다. 다시 시도해주세요' }, { status: 502 });
  }

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json({ error: '서비스를 일시적으로 사용할 수 없습니다' }, { status: 503 });
    }
    if (response.status === 429) {
      return NextResponse.json({ error: '크레딧이 부족합니다. 잠시 후 다시 시도해주세요' }, { status: 429 });
    }
    return NextResponse.json({ error: '음성 인식에 실패했습니다. 다시 시도해주세요' }, { status: 502 });
  }

  const data = await response.json();

  if (!data.text || data.text.trim() === '') {
    return NextResponse.json({ error: '음성을 감지하지 못했습니다' }, { status: 400 });
  }

  return NextResponse.json({
    text: data.text,
    languageCode: data.language_code,
    languageProbability: data.language_probability,
  });
}
