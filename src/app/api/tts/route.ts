import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getElevenLabsApiKey } from '@/shared/config/env';

const ttsRequestSchema = z.object({
  text: z.string().min(1, '텍스트를 입력해주세요').max(5000, '텍스트는 5,000자를 초과할 수 없습니다'),
  voiceId: z.string().min(1, '음성을 선택해주세요'),
  language: z.enum(['ko', 'en']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const parsed = ttsRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json({ error: firstIssue?.message ?? '입력값이 유효하지 않습니다' }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = getElevenLabsApiKey();
  } catch {
    return NextResponse.json({ error: '서버 설정 오류가 발생했습니다' }, { status: 500 });
  }

  const { text, voiceId } = parsed.data;

  const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
    }),
  });

  if (!elevenLabsRes.ok) {
    if (elevenLabsRes.status === 401) {
      return NextResponse.json({ error: '서비스를 일시적으로 사용할 수 없습니다' }, { status: 503 });
    }
    if (elevenLabsRes.status === 429) {
      return NextResponse.json({ error: '크레딧이 부족합니다. 잠시 후 다시 시도해주세요' }, { status: 429 });
    }
    return NextResponse.json({ error: '오디오 생성에 실패했습니다' }, { status: 502 });
  }

  const audioBuffer = await elevenLabsRes.arrayBuffer();
  return new NextResponse(audioBuffer, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
