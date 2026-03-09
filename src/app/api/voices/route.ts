import { NextResponse } from 'next/server';
import { type Voice } from '@/entities/voice/dto/voice.dto';

export const PREMADE_VOICES: Voice[] = [
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    gender: 'female',
    ageGroup: 'young',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
    description: '젊은 여성 · 밝고 따뜻한 목소리',
  },
  {
    id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    gender: 'male',
    ageGroup: 'young',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3',
    description: '젊은 남성 · 자연스럽고 친근한 목소리',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'male',
    ageGroup: 'middle',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/d6905d7a-dd26-4187-bfff-1bd3a5ea7cac.mp3',
    description: '중년 남성 · 깊고 안정적인 목소리',
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    gender: 'female',
    ageGroup: 'young',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3',
    description: '젊은 여성 · 활기차고 에너지 넘치는 목소리',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'female',
    ageGroup: 'middle',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3',
    description: '중년 여성 · 차분하고 신뢰감 있는 목소리',
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    gender: 'male',
    ageGroup: 'middle',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3',
    description: '중년 남성 · 자신감 있고 활기찬 목소리',
  },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ voices: PREMADE_VOICES });
}
