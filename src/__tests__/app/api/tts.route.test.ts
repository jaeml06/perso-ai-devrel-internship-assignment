import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { POST } from '@/app/api/tts/route';

describe('POST /api/tts', () => {
  describe('입력 유효성 검증', () => {
    beforeEach(() => {
      process.env.ELEVENLABS_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('빈 텍스트 → 400 반환', async () => {
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '', voiceId: 'abc', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeTruthy();
    });

    it('5001자 텍스트 → 400 반환', async () => {
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'a'.repeat(5001), voiceId: 'abc', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });

    it('voiceId 빈값 → 400 반환', async () => {
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: '', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });

    it('잘못된 language → 400 반환', async () => {
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: 'abc', language: 'fr' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });
  });

  describe('API 키 오류', () => {
    it('ELEVENLABS_API_KEY 미설정 → 500 반환', async () => {
      const originalKey = process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: 'abc', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(500);
      if (originalKey) process.env.ELEVENLABS_API_KEY = originalKey;
    });
  });

  describe('ElevenLabs API 에러 처리', () => {
    beforeEach(() => {
      process.env.ELEVENLABS_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('ElevenLabs 401 → 503 반환', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: { status: 'invalid_api_key' } }), { status: 401 }),
      );
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(503);
    });

    it('ElevenLabs 429 → 429 반환 (크레딧 부족)', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: { status: 'quota_exceeded' } }), { status: 429 }),
      );
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(429);
    });

    it('ElevenLabs 500 → 502 반환', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Internal Server Error' }), { status: 500 }),
      );
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(502);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      process.env.ELEVENLABS_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('유효한 요청 → 200 + audio/mpeg 반환', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(new Uint8Array([0xff, 0xfb]).buffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        }),
      );
      const req = new Request('http://localhost/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });
});
