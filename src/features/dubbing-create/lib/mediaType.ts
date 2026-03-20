export type MediaType = 'video' | 'audio';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

export function getMediaType(file: File): MediaType {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';

  return 'audio';
}
