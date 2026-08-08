import { useEffect, useRef, useState } from 'react';
import type { TimelineData, TimelineScene, TransitionType } from '@/types';
import { frameToTime } from '@/lib/timelineBuilder';
import type { WaveformPeak } from '@/lib/mediaUtils';
import { ChevronDown } from 'lucide-react';

interface TimelineStripProps {
  timeline: TimelineData | null;
  waveform: WaveformPeak[] | null;
  currentFrame: number;
  onSeek: (frame: number) => void;
  onTransitionChange?: (sceneId: string, field: 'transitionIn' | 'transitionOut', value: TransitionType) => void;
}

const TRANSITION_COLORS: Record<string, string> = {
  crossfade: 'bg-sky-500',
  'slide-left': 'bg-violet-500',
  'slide-right': 'bg-violet-500',
  'slide-up': 'bg-teal-500',
  'slide-down': 'bg-teal-500',
  'whip-pan': 'bg-rose-500',
  'zoom-blur': 'bg-amber-500',
  'hard-cut': 'bg-zinc-600',
  'wipe': 'bg-cyan-500',
  'wipe-left': 'bg-cyan-500',
  'wipe-right': 'bg-cyan-500',
  'wipe-up': 'bg-cyan-500',
  'wipe-down': 'bg-cyan-500',
  'iris-wipe': 'bg-fuchsia-500',
  'glitch': 'bg-red-500',
  'flash-white': 'bg-yellow-300',
  'push': 'bg-orange-500',
  'push-left': 'bg-orange-500',
  'push-right': 'bg-orange-500',
  'push-up': 'bg-orange-500',
  'push-down': 'bg-orange-500',
  'blur-dissolve': 'bg-indigo-500',
  'star-wipe': 'bg-pink-500',
  'clock-wipe': 'bg-emerald-500',
};

const TRANSITION_GROUPS: { label: string; types: TransitionType[] }[] = [
  { label: 'Fades & Dissolves', types: ['crossfade', 'blur-dissolve', 'zoom-blur', 'hard-cut'] },
  { label: 'Slides', types: ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'whip-pan'] },
  { label: 'Wipes', types: ['wipe-left', 'wipe-right', 'wipe-up', 'wipe-down', 'iris-wipe', 'clock-wipe'] },
  { label: 'Pushes', types: ['push-left', 'push-right', 'push-up', 'push-down'] },
  { label: 'Special', types: ['glitch', 'flash-white', 'star-wipe'] },
];

export function TimelineStrip({ timeline, waveform, currentFrame, onSeek, onTransitionChange }: TimelineStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [openTransition, setOpenTransition] = useState<number | null>(null);

  useEffect(() => {
    if (!stripRef.current || !timeline) return;
    const pct = currentFrame / Math.max(1, timeline.totalFrames);
    stripRef.current.scrollLeft = pct * stripRef.current.scrollWidth - stripRef.current.clientWidth / 2;
  }, [currentFrame, timeline]);

  useEffect(() => {
    if (openTransition === null) return;
    const close = () => setOpenTransition(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openTransition]);

  if (!timeline || timeline.scenes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">Timeline will appear here once media and script are loaded</p>
      </div>
    );
  }

  const totalFrames = timeline.totalFrames;
  const fps = timeline.fps;
  const pixelsPerFrame = 0.4;
  const totalWidth = Math.max(totalFrames * pixelsPerFrame, 600);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (openTransition !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const frame = Math.floor(x / pixelsPerFrame);
    onSeek(Math.min(frame, totalFrames - 1));
  };

  // Compute boundary positions for transition markers
  const boundaries: { frame: number; sceneIndex: number }[] = [];
  for (let i = 0; i < timeline.scenes.length - 1; i++) {
    boundaries.push({
      frame: timeline.scenes[i].endFrame,
      sceneIndex: i,
    });
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-zinc-300">Auto-Generated Timeline</p>
          <span className="text-[10px] text-zinc-600">
            {timeline.scenes.length} scenes · {frameToTime(totalFrames, fps)} total
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(TRANSITION_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[9px] text-zinc-600">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex-1 overflow-x-auto overflow-y-visible cursor-pointer relative"
        onClick={handleSeek}
      >
        <div className="relative" style={{ width: totalWidth }}>
          {/* Scene blocks row with transition markers overlaid at boundaries */}
          <div className="relative flex h-16 mt-1">
            {timeline.scenes.map((scene, i) => (
              <SceneBlock
                key={scene.id}
                scene={scene}
                pixelsPerFrame={pixelsPerFrame}
                isActive={currentFrame >= scene.startFrame && currentFrame < scene.endFrame}
                index={i}
              />
            ))}

            {/* Transition markers — absolutely positioned at each scene boundary */}
            {boundaries.map(({ frame, sceneIndex }) => {
              const leftPx = frame * pixelsPerFrame;
              const scene = timeline.scenes[sceneIndex];
              const transColor = TRANSITION_COLORS[scene.transitionOut] ?? 'bg-zinc-600';
              const isOpen = openTransition === sceneIndex;

              return (
                <button
                  key={`boundary-${sceneIndex}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTransition(isOpen ? null : sceneIndex);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 h-5 rounded-full ${transColor} hover:brightness-110 cursor-pointer z-20 transition-all ${isOpen ? 'ring-2 ring-amber-400 scale-110' : 'shadow-md'}`}
                  style={{ left: leftPx }}
                  title={`Cut ${sceneIndex + 1}→${sceneIndex + 2}: ${scene.transitionOut} (click to change)`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <ChevronDown className="w-2.5 h-2.5 text-white/80" />
                </button>
              );
            })}
          </div>

          {/* Transition picker dropdown — absolutely positioned, doesn't affect layout */}
          {openTransition !== null && timeline.scenes[openTransition] && (
            <TransitionPopover
              scene={timeline.scenes[openTransition]}
              cutIndex={openTransition}
              pixelsPerFrame={pixelsPerFrame}
              onSelect={(type) => {
                onTransitionChange?.(timeline.scenes[openTransition].id, 'transitionOut', type);
                setOpenTransition(null);
              }}
            />
          )}

          {/* Waveform row — uses same totalWidth as scene blocks */}
          {waveform && waveform.length > 0 && (
            <div className="h-12 mt-1 relative">
              <svg width={totalWidth} height="100%" className="absolute inset-0" preserveAspectRatio="none">
                {waveform.map((peak, i) => {
                  const x = (i / waveform.length) * totalWidth;
                  const w = Math.max(1, totalWidth / waveform.length);
                  const mid = 24;
                  const top = mid + peak.min * 20;
                  const bottom = mid + peak.max * 20;
                  return (
                    <line key={i} x1={x} y1={Math.max(2, top)} x2={x} y2={Math.min(46, bottom)} stroke="rgba(251, 191, 36, 0.4)" strokeWidth={w} />
                  );
                })}
              </svg>
            </div>
          )}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none z-10" style={{ left: currentFrame * pixelsPerFrame }}>
            <div className="w-3 h-3 bg-amber-400 rounded-full -translate-x-1/2 -translate-y-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneBlock({ scene, pixelsPerFrame, isActive, index }: {
  scene: TimelineScene; pixelsPerFrame: number; isActive: boolean; index: number;
}) {
  const width = scene.durationFrames * pixelsPerFrame;
  const transColor = TRANSITION_COLORS[scene.transitionIn] ?? 'bg-zinc-600';

  return (
    <div className={`relative border-r border-zinc-800 group ${isActive ? 'ring-1 ring-amber-400' : ''}`} style={{ width }}>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 relative bg-zinc-900">
          {scene.media.kind === 'image' ? (
            <img src={scene.media.url} alt={scene.media.name} className="w-full h-full object-cover opacity-70" />
          ) : (
            <video src={scene.media.url} className="w-full h-full object-cover opacity-70" muted />
          )}
          <div className={`absolute top-0 left-0 h-1 ${transColor} w-full`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="px-1.5 py-1 bg-zinc-900">
          <p className="text-[9px] text-zinc-400 truncate font-mono">
            {String(index + 1).padStart(2, '0')} · {scene.media.name}
          </p>
          <p className="text-[8px] text-zinc-600 font-mono">{scene.durationSec.toFixed(1)}s</p>
        </div>
      </div>
    </div>
  );
}

function TransitionPopover({ scene, cutIndex, pixelsPerFrame, onSelect }: {
  scene: TimelineScene;
  cutIndex: number;
  pixelsPerFrame: number;
  onSelect: (type: TransitionType) => void;
}) {
  const leftPos = (scene.startFrame + scene.durationFrames) * pixelsPerFrame;
  const popoverWidth = 224;
  const popoverLeft = Math.max(8, leftPos - popoverWidth / 2);

  return (
    <div
      className="absolute z-30 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-2"
      style={{ top: 76, left: popoverLeft, width: popoverWidth }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] text-zinc-500 mb-1.5 px-1 font-semibold">
        Cut {cutIndex + 1} → {cutIndex + 2}
      </p>
      <p className="text-[9px] text-zinc-600 mb-2 px-1">
        Current: <span className="text-zinc-400">{scene.transitionOut}</span>
      </p>
      <div className="max-h-56 overflow-y-auto space-y-2">
        {TRANSITION_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wide px-1 mb-1">{group.label}</p>
            <div className="grid grid-cols-1 gap-0.5">
              {group.types.map((type) => (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] text-zinc-300 hover:bg-zinc-800 text-left ${scene.transitionOut === type ? 'bg-zinc-800 ring-1 ring-amber-500/40' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full ${TRANSITION_COLORS[type] ?? 'bg-zinc-600'}`} />
                  {type}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
