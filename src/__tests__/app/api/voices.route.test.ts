import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/voices/route';
import { type Voice } from '@/entities/voice/dto/voice.dto';

describe('GET /api/voices', () => {
  it('200 상태코드를 반환한다', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('6개의 음성 목록을 반환한다', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.voices).toHaveLength(6);
  });

  it('각 음성은 필수 필드를 포함한다', async () => {
    const res = await GET();
    const data = await res.json();
    data.voices.forEach((voice: Voice) => {
      expect(voice).toHaveProperty('id');
      expect(voice).toHaveProperty('name');
      expect(voice).toHaveProperty('gender');
      expect(voice).toHaveProperty('ageGroup');
      expect(voice).toHaveProperty('previewUrl');
      expect(voice).toHaveProperty('description');
    });
  });

  it('성별: female과 male이 모두 포함된다', async () => {
    const res = await GET();
    const data = await res.json();
    const genders = data.voices.map((v: Voice) => v.gender);
    expect(genders).toContain('female');
    expect(genders).toContain('male');
  });

  it('나이대: young과 middle이 모두 포함된다', async () => {
    const res = await GET();
    const data = await res.json();
    const ageGroups = data.voices.map((v: Voice) => v.ageGroup);
    expect(ageGroups).toContain('young');
    expect(ageGroups).toContain('middle');
  });
});
