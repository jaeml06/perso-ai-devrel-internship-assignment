import { describe, expect, it } from 'vitest';
import { getMediaType } from '@/features/dubbing-create/lib/mediaType';

function makeFile(name: string, type: string): File {
  return new File(['data'], name, { type });
}

describe('getMediaType', () => {
  it('video/mp4 → video', () => {
    expect(getMediaType(makeFile('clip.mp4', 'video/mp4'))).toBe('video');
  });

  it('video/quicktime → video', () => {
    expect(getMediaType(makeFile('clip.mov', 'video/quicktime'))).toBe('video');
  });

  it('video/webm → video', () => {
    expect(getMediaType(makeFile('clip.webm', 'video/webm'))).toBe('video');
  });

  it('audio/mpeg → audio', () => {
    expect(getMediaType(makeFile('song.mp3', 'audio/mpeg'))).toBe('audio');
  });

  it('audio/wav → audio', () => {
    expect(getMediaType(makeFile('song.wav', 'audio/wav'))).toBe('audio');
  });

  it('빈 MIME + .mp4 확장자 → video (폴백)', () => {
    expect(getMediaType(makeFile('clip.mp4', ''))).toBe('video');
  });

  it('빈 MIME + .mov 확장자 → video (폴백)', () => {
    expect(getMediaType(makeFile('clip.mov', ''))).toBe('video');
  });

  it('빈 MIME + .webm 확장자 → video (폴백)', () => {
    expect(getMediaType(makeFile('clip.webm', ''))).toBe('video');
  });

  it('빈 MIME + .mp3 확장자 → audio (폴백)', () => {
    expect(getMediaType(makeFile('song.mp3', ''))).toBe('audio');
  });
});
