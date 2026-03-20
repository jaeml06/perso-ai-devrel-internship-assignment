import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { getMediaDuration } from '@/features/dubbing-create/lib/getMediaDuration';

export interface CropMediaParams {
  file: File;
  maxDurationSeconds: number;
}

export interface CropResult {
  file: File;
  wasCropped: boolean;
  originalDuration: number;
}

const FFMPEG_CDN = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex) : '';
}

export async function cropMedia({ file, maxDurationSeconds }: CropMediaParams): Promise<CropResult> {
  const originalDuration = await getMediaDuration(file);

  if (originalDuration <= maxDurationSeconds) {
    return { file, wasCropped: false, originalDuration };
  }

  const ext = getExtension(file.name);
  const inputName = `input${ext}`;
  const outputName = `output${ext}`;

  const ffmpeg = new FFmpeg();

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      '-i', inputName,
      '-t', String(maxDurationSeconds),
      '-c', 'copy',
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const croppedFile = new File([data as BlobPart], file.name, { type: file.type });

    return { file: croppedFile, wasCropped: true, originalDuration };
  } catch {
    throw new Error('미디어 크롭에 실패했습니다');
  }
}
