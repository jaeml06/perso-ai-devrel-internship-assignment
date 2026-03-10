import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/stt/route';

describe('POST /api/stt', () => {
  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ELEVENLABS_API_KEY;
  });

  it('파일 없음 → 400', async () => {
    const formData = new FormData();
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('파일을 업로드해주세요');
  });

  it('유효한 파일 → 200 { text, languageCode, languageProbability }', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        text: 'Hello world',
        language_code: 'en',
        language_probability: 0.99,
        words: [],
      }),
    }));

    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('Hello world');
    expect(data.languageCode).toBe('en');
    expect(data.languageProbability).toBe(0.99);
  });

  it('빈 전사 결과 → 400 "음성을 감지하지 못했습니다"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        text: '',
        language_code: 'en',
        language_probability: 0.5,
        words: [],
      }),
    }));

    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('음성을 감지하지 못했습니다');
  });

  it('ElevenLabs 429 → 429 "크레딧이 부족합니다"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }));

    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('크레딧이 부족합니다');
  });

  it('ElevenLabs 401 → 503 "서비스를 일시적으로 사용할 수 없습니다"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }));

    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('서비스를 일시적으로 사용할 수 없습니다');
  });

  it('ELEVENLABS_API_KEY 미설정 → 500', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });

  it('ElevenLabs 기타 오류 → 502 "음성 인식에 실패했습니다"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const formData = new FormData();
    formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'test.mp3');
    const req = new Request('http://localhost/api/stt', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('음성 인식에 실패했습니다');
  });
});
