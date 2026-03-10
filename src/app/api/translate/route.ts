import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/shared/config/env';

const translateRequestSchema = z.object({
  text: z.string().min(1),
  sourceLanguage: z.enum(['ko', 'en', 'auto']),
  targetLanguage: z.enum(['ko', 'en']),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '입력값이 유효하지 않습니다' }, { status: 400 });
  }

  const parsed = translateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 유효하지 않습니다' }, { status: 400 });
  }

  const { text, sourceLanguage, targetLanguage } = parsed.data;

  if (sourceLanguage === targetLanguage) {
    return NextResponse.json({ translatedText: text, wasSkipped: true });
  }

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
  } catch {
    return NextResponse.json({ error: '서버 설정 오류가 발생했습니다' }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const langName = targetLanguage === 'ko' ? 'Korean' : 'English';
    const prompt = `Translate the following text to ${langName}.\nReturn only the translated text, no explanations or additional content.\n\nText: ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });

    const translatedText = response.text ?? '';

    return NextResponse.json({ translatedText, wasSkipped: false });
  } catch {
    return NextResponse.json({ error: '번역에 실패했습니다. 다시 시도해주세요' }, { status: 502 });
  }
}
