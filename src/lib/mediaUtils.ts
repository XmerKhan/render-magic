export async function getAudioDuration(url: string): Promise<number> {
  // MP3/VBR files can expose different durations through container metadata
  // and Web Audio decoding. Never let the shorter measurement truncate the
  // timeline; compare both sources and use the longest valid duration.
  const decodeDuration = (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Audio fetch failed [${response.status}]`);
    const arrayBuffer = await response.arrayBuffer();
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextCtor();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const duration = audioBuffer.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Decoded audio duration is unavailable');
      }
      return duration;
    } finally {
      await audioCtx.close();
    }
  })();

  const metadataDuration = new Promise<number>((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration);
      } else {
        reject(new Error('Audio metadata duration is unavailable'));
      }
    };
    audio.onerror = () => reject(new Error('Failed to load audio metadata'));
    audio.src = url;
  });

  const results = await Promise.allSettled([decodeDuration, metadataDuration]);
  const durations = results
    .filter((result): result is PromiseFulfilledResult<number> => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter((duration) => Number.isFinite(duration) && duration > 0);

  if (durations.length === 0) {
    throw new Error('Could not determine the audio duration');
  }

  // Use the longest valid measurement so a short VBR/container estimate cannot
  // cut off the final voiceover or scenes.
  return Math.max(...durations);
}

export async function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = url;
  });
}

export async function getMediaDimensions(
  file: File,
  kind: 'image' | 'video',
): Promise<{ width: number; height: number; duration?: number }> {
  const url = URL.createObjectURL(file);

  if (kind === 'image') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
    video.src = url;
  });
}

export interface WaveformPeak {
  min: number;
  max: number;
}

export async function generateWaveform(
  url: string,
  numPeaks: number,
): Promise<WaveformPeak[]> {
  const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer());
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPeak = Math.floor(channelData.length / numPeaks);
  const peaks: WaveformPeak[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * samplesPerPeak;
    const end = start + samplesPerPeak;
    let min = 1;
    let max = -1;
    for (let j = start; j < end && j < channelData.length; j++) {
      const v = channelData[j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    peaks.push({ min, max });
  }

  audioCtx.close();
  return peaks;
}
