export async function getAudioDuration(url: string): Promise<number> {
  // HTMLMediaElement.duration can be unreliable for some VBR/encoded MP3s and
  // may report a shorter container duration than the decoded audio actually
  // contains. The timeline uses this value as its authoritative endpoint, so
  // a bad metadata duration can truncate the final scenes and voiceover.
  try {
    const arrayBuffer = await fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Audio fetch failed [${response.status}]`);
      return response.arrayBuffer();
    });
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextCtor();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const duration = audioBuffer.duration;
      if (Number.isFinite(duration) && duration > 0) return duration;
    } finally {
      await audioCtx.close();
    }
  } catch {
    // Fall back to media metadata below for formats the Web Audio decoder cannot
    // decode. This preserves support for unusual browser-supported audio files.
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration);
      } else {
        reject(new Error('Audio duration is unavailable'));
      }
    };
    audio.onerror = () => reject(new Error('Failed to load audio metadata'));
    audio.src = url;
  });
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
