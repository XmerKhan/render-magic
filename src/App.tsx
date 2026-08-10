import { useState, useCallback, useEffect, useRef } from 'react';
import { Film, Wand2, Loader2 } from 'lucide-react';
import type {
  MediaAsset,
  EditSettings,
  TimelineData,
  ScriptSegment,
  ValidationResult,
  PipelineProgress,
} from '@/types';
import { MediaBin } from '@/components/MediaBin';
import { PreviewPlayer } from '@/components/PreviewPlayer';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TimelineStrip } from '@/components/TimelineStrip';
import type { PlayerRef } from '@remotion/player';
import { RenderDialog } from '@/components/RenderDialog';
import { ValidationPanel } from '@/components/ValidationPanel';
import { buildTimeline } from '@/lib/timelineBuilder';
import { validateScript, parseScriptFile } from '@/lib/validator';
import { getAudioDuration, generateWaveform } from '@/lib/mediaUtils';
import { exportVideo } from '@/lib/videoExporter';
import type { WaveformPeak } from '@/lib/mediaUtils';

const DEFAULT_SETTINGS: EditSettings = {
  fps: 30,
  aspectRatio: '16:9',
  transitionPack: 'mixed',
  transitionDuration: 0.4,
  captionStyle: 'fade',
  captionPosition: 'lower-third',
  captionSettings: {
    fontFamily: 'inter',
    fontSize: 48,
    textColor: '#ffffff',
    karaokeColor: '#fbbf24',
    backgroundPill: true,
    outline: true,
    outlineColor: '#000000',
    timingOffsetMs: 0,
  },
  colorGrade: 'cinematic',
  manualColorGrade: {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    vignette: 0,
    filmGrain: 0,
  },
  exportResolution: '1080p',
  exportFormat: 'mp4',
  showIntro: false,
  showOutro: false,
  introText: 'My Video',
  introSubtitle: '',
  outroText: 'Thanks for watching',
  channelName: '',
  introOutroStyle: 'fade',
  musicVolume: 0.3,
  musicUrl: null,
  autoDuck: true,
  trimSilence: false,
  normalizeLoudness: false,
  voiceFadeInSec: 0.3,
  voiceFadeOutSec: 0.5,
  voiceClarityBoost: false,
};

export default function App() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [voiceoverDuration, setVoiceoverDuration] = useState(0);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [settings, setSettings] = useState<EditSettings>(DEFAULT_SETTINGS);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [waveform, setWaveform] = useState<WaveformPeak[] | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showRender, setShowRender] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: 'idle',
    message: '',
    progress: 0,
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<PlayerRef>(null);

  const mediaMap = new Map(assets.map((a) => [a.id, a]));

  useEffect(() => {
    if (!voiceoverFile) {
      setVoiceoverUrl(null);
      setVoiceoverDuration(0);
      setWaveform(null);
      return;
    }
    const url = URL.createObjectURL(voiceoverFile);
    setVoiceoverUrl(url);
    getAudioDuration(url)
      .then((d) => setVoiceoverDuration(d))
      .catch(() => setVoiceoverDuration(0));
    generateWaveform(url, 200)
      .then(setWaveform)
      .catch(() => setWaveform(null));
    return () => URL.revokeObjectURL(url);
  }, [voiceoverFile]);

  useEffect(() => {
    if (!musicFile) {
      setSettings((s) => ({ ...s, musicUrl: null }));
      return;
    }
    const url = URL.createObjectURL(musicFile);
    setSettings((s) => ({ ...s, musicUrl: url }));
    return () => URL.revokeObjectURL(url);
  }, [musicFile]);

  useEffect(() => {
    if (!scriptFile) {
      setSegments([]);
      setValidation(null);
      return;
    }
    scriptFile.text().then((text) => {
      try {
        const parsed = parseScriptFile(text);
        setSegments(parsed);
      } catch (e) {
        setValidation({
          valid: false,
          errors: [`Failed to parse script file: ${(e as Error).message}`],
          warnings: [],
          voiceoverDurationSec: voiceoverDuration,
          scriptDurationSec: 0,
          gaps: [],
          overlaps: [],
          missingMedia: [],
        });
      }
    });
  }, [scriptFile, voiceoverDuration]);

  useEffect(() => {
    if (segments.length === 0) {
      setTimeline(null);
      setValidation(null);
      return;
    }

    const result = validateScript(segments, mediaMap, voiceoverDuration);
    setValidation(result);

    if (result.valid || (result.errors.length === 0 && result.warnings.length > 0)) {
      const tl = buildTimeline(
        segments,
        mediaMap,
        voiceoverUrl,
        voiceoverDuration,
        settings,
        settings.musicUrl,
      );
      setTimeline(tl);
    } else {
      setTimeline(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, assets, voiceoverDuration, voiceoverUrl]);

  useEffect(() => {
    if (segments.length === 0) return;
    const tl = buildTimeline(
      segments,
      mediaMap,
      voiceoverUrl,
      voiceoverDuration,
      settings,
      settings.musicUrl,
    );
    setTimeline(tl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleVoiceoverChange = useCallback((file: File | null) => {
    setVoiceoverFile(file);
  }, []);

  const handleMusicChange = useCallback((file: File | null) => {
    setMusicFile(file);
  }, []);

  const handleScriptChange = useCallback((file: File | null) => {
    setScriptFile(file);
  }, []);

  const handleSeek = useCallback((frame: number) => {
    setCurrentFrame(frame);
    playerRef.current?.seekTo(frame);
  }, []);

  const canGenerate =
    assets.length > 0 && segments.length > 0 && voiceoverDuration > 0;

  const handleGenerate = async () => {
    if (!timeline) return;

    setShowRender(true);
    setDownloadUrl(null);
    setProgress({ stage: 'rendering', message: 'Uploading media to server...', progress: 2 });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const downloadUrlResult = await exportVideo({
        timeline,
        settings,
        assets,
        voiceoverFile,
        musicFile,
        signal: controller.signal,
        onProgress: (pct, msg, details) => {
          // pct < 0 means "no new progress, message only" (e.g. reconnecting).
          setProgress((prev) => ({
            stage: 'rendering',
            message: msg,
            progress: pct < 0 ? prev.progress : pct,
            ...details,
          }));
        },
      });

      setDownloadUrl(downloadUrlResult);
      setProgress({
        stage: 'done',
        message: 'Video rendered successfully',
        progress: 100,
      });
    } catch (e) {
      setProgress({
        stage: 'error',
        message: (e as Error).message || 'Unknown rendering error',
        progress: 0,
      });
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setShowRender(false);
    setProgress({ stage: 'idle', message: '', progress: 0 });
  };

  const handleClose = () => {
    setShowRender(false);
  };

  const fileName = `autocut-${Date.now()}.mp4`;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Film className="w-4 h-4 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AutoCut Studio</h1>
            <p className="text-[10px] text-zinc-500 -mt-0.5">Automatic Video Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {validation && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                validation.valid
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {validation.valid ? 'Script OK' : 'Script has issues'}
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Generate Video
          </button>
        </div>
      </header>

      {/* Main editor area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-72 shrink-0 flex flex-col">
          <MediaBin
            assets={assets}
            onAssetsChange={setAssets}
            voiceoverFile={voiceoverFile}
            voiceoverUrl={voiceoverUrl}
            onVoiceoverChange={handleVoiceoverChange}
            musicFile={musicFile}
            onMusicChange={handleMusicChange}
            scriptFile={scriptFile}
            onScriptChange={handleScriptChange}
          />
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <PreviewPlayer timeline={timeline} settings={settings} onFrameUpdate={setCurrentFrame} playerRef={playerRef} />
          </div>

          {/* Validation messages */}
          {validation && (
            <div className="max-h-32 overflow-y-auto bg-zinc-900 border-t border-zinc-800">
              <ValidationPanel result={validation} />
            </div>
          )}

          {/* Timeline */}
          <div className="h-48 shrink-0">
            <TimelineStrip
              timeline={timeline}
              waveform={waveform}
              currentFrame={currentFrame}
              onSeek={handleSeek}
              onTransitionChange={(sceneId, field, value) => {
                if (!timeline) return;
                setTimeline({
                  ...timeline,
                  scenes: timeline.scenes.map((s) =>
                    s.id === sceneId ? { ...s, [field]: value } : s,
                  ),
                });
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 shrink-0">
          <SettingsPanel settings={settings} onChange={setSettings} />
        </div>
      </div>

      <RenderDialog
        open={showRender}
        progress={progress}
        downloadUrl={downloadUrl}
        fileName={fileName}
        onClose={handleClose}
        onCancel={handleCancel}
      />
    </div>
  );
}
