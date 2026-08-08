import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Player, type PlayerRef } from '@remotion/player';
import type { TimelineData, EditSettings } from '@/types';
import { VideoComposition } from '@/remotion/VideoComposition';
import { getCompositionConfig } from '@/remotion/config';

interface PreviewPlayerProps {
  timeline: TimelineData | null;
  settings: EditSettings;
  onFrameUpdate?: (frame: number) => void;
  playerRef?: React.RefObject<PlayerRef | null>;
}

function frameToTimecode(frame: number, fps: number): string {
  const totalSec = frame / fps;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PreviewPlayer({ timeline, settings, onFrameUpdate, playerRef }: PreviewPlayerProps) {
  const internalRef = useRef<PlayerRef>(null);
  const ref = playerRef ?? internalRef;
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const config = timeline
    ? getCompositionConfig(timeline, settings)
    : null;

  useEffect(() => {
    const p = ref.current;
    if (!p) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
      onFrameUpdate?.(e.detail.frame);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      p.seekTo(0);
    };

    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('ended', onEnded);

    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
      p.removeEventListener('ended', onEnded);
    };
  }, [timeline]);

  const togglePlay = useCallback(() => {
    const p = ref.current;
    if (!p) return;
    if (p.isPlaying()) {
      p.pause();
    } else {
      p.play();
    }
  }, []);

  const skipToStart = useCallback(() => {
    ref.current?.seekTo(0);
  }, []);

  const skipToEnd = useCallback(() => {
    if (!config) return;
    ref.current?.seekTo(config.durationInFrames - 1);
  }, [config]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!config) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const frame = Math.floor(pct * config.durationInFrames);
      ref.current?.seekTo(frame);
    },
    [config],
  );

  const totalFrames = config?.durationInFrames ?? 0;
  const fps = timeline?.fps ?? settings.fps;

  // Compute preview dimensions that fit within the available space
  // while preserving the aspect ratio. The box itself changes shape
  // when the aspect ratio setting changes.
  const maxW = 720;
  const maxH = 520;
  const ar = config ? config.width / config.height : 16 / 9;
  let previewW = maxW;
  let previewH = previewW / ar;
  if (previewH > maxH) {
    previewH = maxH;
    previewW = previewH * ar;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
      <div
        className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-zinc-800 transition-all duration-300"
        style={{ width: previewW, height: previewH }}
      >
        {timeline && config ? (
          <Player
            key={`${config.width}x${config.height}`}
            ref={ref}
            component={VideoComposition}
            inputProps={{ timeline, settings }}
            durationInFrames={config.durationInFrames}
            compositionWidth={config.width}
            compositionHeight={config.height}
            fps={config.fps}
            style={{ width: '100%', height: '100%' }}
            controls={false}
            loop={false}
            autoPlay={false}
            acknowledgeRemotionLicense={false}
          />
        ) : (
          <div
            style={{ width: '100%', height: '100%' }}
            className="flex items-center justify-center bg-zinc-950"
          >
            <p className="text-zinc-600 text-sm">
              Upload media and a script to see preview
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 w-full max-w-2xl">
        <div
          className="h-1.5 bg-zinc-800 rounded-full cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${(currentFrame / Math.max(1, totalFrames)) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `${(currentFrame / Math.max(1, totalFrames)) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={skipToStart}
            disabled={!timeline}
            className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!timeline}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-zinc-900 disabled:opacity-30 transition-colors"
          >
            {playing ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>
          <button
            onClick={skipToEnd}
            disabled={!timeline}
            className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-2">
          {frameToTimecode(currentFrame, fps)} / {frameToTimecode(totalFrames, fps)}
        </p>
      </div>
    </div>
  );
}
