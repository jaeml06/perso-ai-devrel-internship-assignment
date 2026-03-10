import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

describe('POST /api/translate', () => {
  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    vi.clearAllMocks();

    // Set up default working Gemini mock for each test
    const { GoogleGenAI } = await import('@google/genai');
    vi.mocked(GoogleGenAI).mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({ text: '안녕하세요' }),
        },
      };
    } as never);
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('필드 누락 → 400', async () => {
    const { POST } = await import('@/app/api/translate/route');
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('동일 언어(en→en) → 200 { translatedText: 원문, wasSkipped: true }', async () => {
    const { POST } = await import('@/app/api/translate/route');
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello world', sourceLanguage: 'en', targetLanguage: 'en' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe('Hello world');
    expect(data.wasSkipped).toBe(true);
  });

  it('유효한 요청 → 200 { translatedText, wasSkipped: false }', async () => {
    const { POST } = await import('@/app/api/translate/route');
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello world', sourceLanguage: 'en', targetLanguage: 'ko' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBeTruthy();
    expect(data.wasSkipped).toBe(false);
  });

  it('GEMINI_API_KEY 미설정 → 500', async () => {
    delete process.env.GEMINI_API_KEY;
    const { POST } = await import('@/app/api/translate/route');
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', sourceLanguage: 'en', targetLanguage: 'ko' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });

  it('Gemini SDK 오류 → 502', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    vi.mocked(GoogleGenAI).mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('Gemini error')),
        },
      };
    } as never);

    const { POST } = await import('@/app/api/translate/route');
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', sourceLanguage: 'en', targetLanguage: 'ko' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('번역에 실패했습니다');
  });
});
