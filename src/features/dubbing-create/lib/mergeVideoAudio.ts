import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface MergeVideoAudioParams {
  videoFile: File;
  audioBlob: Blob;
}

export interface MergeResult {
  url: string;
  blob: Blob;
}

const FFMPEG_CDN = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';

export async function mergeVideoAudio({ videoFile, audioBlob }: MergeVideoAudioParams): Promise<MergeResult> {
  const ffmpeg = new FFmpeg();

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpeg.writeFile('dubbed.mp3', await fetchFile(audioBlob));

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'dubbed.mp3',
      '-c:v', 'copy',
      '-map', '0:v',
      '-map', '1:a',
      '-shortest',
      'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    return { url, blob };
  } catch {
    throw new Error('영상 합성에 실패했습니다');
  }
}
