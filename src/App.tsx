import { useState, useCallback, useEffect, useRef } from 'react';
import { Film, Wand2 } from 'lucide-react';
import type { MediaAsset, EditSettings, TimelineData, ScriptSegment, ValidationResult, PipelineProgress } from '@/types';
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
import { alignScriptToTranscript, parseOriginalScript, parseSceneOrder, parseTimestampedTranscript } from '@/lib/voiceSync';
import type { WaveformPeak } from '@/lib/mediaUtils';

const DEFAULT_SETTINGS: EditSettings = {
  fps: 30, aspectRatio: '16:9', transitionPack: 'mixed', transitionDuration: 0.4,
  captionStyle: 'fade', captionPosition: 'lower-third',
  captionSettings: { fontFamily: 'inter', fontSize: 48, textColor: '#ffffff', karaokeColor: '#fbbf24', backgroundPill: true, outline: true, outlineColor: '#000000', timingOffsetMs: 0 },
  colorGrade: 'cinematic', manualColorGrade: { brightness: 1, contrast: 1, saturation: 1, vignette: 0, filmGrain: 0 },
  exportResolution: '1080p', exportFormat: 'mp4', showIntro: false, showOutro: false, introText: 'My Video', introSubtitle: '', outroText: 'Thanks for watching', channelName: '', introOutroStyle: 'fade',
  musicVolume: 0.3, musicUrl: null, autoDuck: true, trimSilence: false, normalizeLoudness: false, voiceFadeInSec: 0.3, voiceFadeOutSec: 0.5, voiceClarityBoost: false,
};

function resolveMediaOrder(order: string[], assets: MediaAsset[]): string[] {
  const byId = new Map(assets.map((asset) => [asset.id.toLowerCase(), asset.id]));
  const byName = new Map(assets.map((asset) => [asset.name.toLowerCase(), asset.id]));
  const byBase = new Map(assets.map((asset) => [asset.name.split(/[\\/]/).pop()!.toLowerCase(), asset.id]));
  return order.map((value) => {
    const key = value.trim().toLowerCase();
    return byId.get(key) ?? byName.get(key) ?? byBase.get(key) ?? '';
  });
}

function autoValidation(segments: ScriptSegment[], voiceoverDuration: number, warnings: string[]): ValidationResult {
  const errors: string[] = [];
  if (!segments.length) errors.push('Auto Sync produced no scenes.');
  if (voiceoverDuration <= 0) errors.push('Voiceover duration could not be measured.');
  for (let i = 0; i < segments.length; i++) {
    const scene = segments[i]!;
    if (!Number.isFinite(scene.startTime) || !Number.isFinite(scene.endTime) || scene.endTime <= scene.startTime) errors.push(`Scene ${i + 1} has invalid timing.`);
    if (i > 0 && Math.abs(scene.startTime - segments[i - 1]!.endTime) > 0.002) errors.push(`Scene ${i + 1} is not contiguous with the previous scene.`);
  }
  return { valid: errors.length === 0, errors, warnings, voiceoverDurationSec: voiceoverDuration, scriptDurationSec: segments.at(-1)?.endTime ?? 0, gaps: [], overlaps: [], missingMedia: segments.filter((s) => !s.mediaId).map((s) => s.sceneId) };
}

export default function App() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [voiceoverDuration, setVoiceoverDuration] = useState(0);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [originalScriptFile, setOriginalScriptFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [sceneOrderFile, setSceneOrderFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [settings, setSettings] = useState<EditSettings>(DEFAULT_SETTINGS);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [waveform, setWaveform] = useState<WaveformPeak[] | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showRender, setShowRender] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress>({ stage: 'idle', message: '', progress: 0 });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<PlayerRef>(null);
  const mediaMap = new Map(assets.map((a) => [a.id, a]));

  useEffect(() => {
    if (!voiceoverFile) { setVoiceoverUrl(null); setVoiceoverDuration(0); setWaveform(null); return; }
    const url = URL.createObjectURL(voiceoverFile); setVoiceoverUrl(url);
    getAudioDuration(url).then(setVoiceoverDuration).catch(() => setVoiceoverDuration(0));
    generateWaveform(url, 200).then(setWaveform).catch(() => setWaveform(null));
    return () => URL.revokeObjectURL(url);
  }, [voiceoverFile]);

  useEffect(() => {
    if (!musicFile) { setSettings((s) => ({ ...s, musicUrl: null })); return; }
    const url = URL.createObjectURL(musicFile); setSettings((s) => ({ ...s, musicUrl: url }));
    return () => URL.revokeObjectURL(url);
  }, [musicFile]);

  // Legacy timestamp JSON/SRT workflow remains intact.
  useEffect(() => {
    if (!scriptFile || originalScriptFile || transcriptFile) return;
    scriptFile.text().then((text) => {
      try { setSegments(parseScriptFile(text)); }
      catch (e) { setValidation({ valid: false, errors: [`Failed to parse script file: ${(e as Error).message}`], warnings: [], voiceoverDurationSec: voiceoverDuration, scriptDurationSec: 0, gaps: [], overlaps: [], missingMedia: [] }); }
    });
  }, [scriptFile, originalScriptFile, transcriptFile, voiceoverDuration]);

  // New automatic pipeline: original script + word timestamps + ordered media.
  useEffect(() => {
    if (!originalScriptFile || !transcriptFile || !voiceoverDuration || !assets.length) return;
    let cancelled = false;
    setValidation({ valid: false, errors: [], warnings: ['Auto Sync is matching the original script against the word-level transcript…'], voiceoverDurationSec: voiceoverDuration, scriptDurationSec: 0, gaps: [], overlaps: [], missingMedia: [] });
    Promise.all([originalScriptFile.text(), transcriptFile.text(), sceneOrderFile?.text() ?? Promise.resolve('')]).then(([scriptText, transcriptText, orderText]) => {
      if (cancelled) return;
      try {
        const scriptLines = parseOriginalScript(scriptText);
        const transcript = parseTimestampedTranscript(transcriptText);
        const requestedOrder = orderText.trim() ? parseSceneOrder(orderText) : assets.map((asset) => asset.id);
        if (requestedOrder.length !== scriptLines.length) throw new Error(`Scene order has ${requestedOrder.length} entries but the original script has ${scriptLines.length} scene lines.`);
        const mediaIds = orderText.trim() ? resolveMediaOrder(requestedOrder, assets) : requestedOrder;
        const missing = mediaIds.map((id, index) => id ? '' : `Scene ${index + 1}`).filter(Boolean);
        if (missing.length) throw new Error(`These scene-order entries do not match uploaded media: ${missing.join(', ')}.`);
        const result = alignScriptToTranscript(scriptLines, transcript, mediaIds);
        // The final visual scene stays visible through the real audio end. No blank tail.
        const final = result.segments[result.segments.length - 1];
        if (final) final.endTime = Math.max(final.endTime, voiceoverDuration);
        const syncValidation = autoValidation(result.segments, voiceoverDuration, result.warnings);
        if (!cancelled) { setSegments(result.segments); setValidation(syncValidation); }
      } catch (e) {
        if (!cancelled) { setSegments([]); setTimeline(null); setValidation({ valid: false, errors: [`Auto Sync failed: ${(e as Error).message}`], warnings: [], voiceoverDurationSec: voiceoverDuration, scriptDurationSec: 0, gaps: [], overlaps: [], missingMedia: [] }); }
      }
    }).catch((e) => {
      if (!cancelled) setValidation({ valid: false, errors: [`Auto Sync failed: ${(e as Error).message}`], warnings: [], voiceoverDurationSec: voiceoverDuration, scriptDurationSec: 0, gaps: [], overlaps: [], missingMedia: [] });
    });
    return () => { cancelled = true; };
  }, [originalScriptFile, transcriptFile, sceneOrderFile, voiceoverDuration, assets]);

  useEffect(() => {
    if (!segments.length) { setTimeline(null); return; }
    const result = originalScriptFile && transcriptFile ? autoValidation(segments, voiceoverDuration, validation?.warnings ?? []) : validateScript(segments, mediaMap, voiceoverDuration);
    setValidation(result);
    if (result.valid || result.errors.length === 0) {
      setTimeline(buildTimeline(segments, mediaMap, voiceoverUrl, voiceoverDuration, settings, settings.musicUrl));
    } else setTimeline(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, assets, voiceoverDuration, voiceoverUrl]);

  useEffect(() => {
    if (!segments.length) return;
    setTimeline(buildTimeline(segments, mediaMap, voiceoverUrl, voiceoverDuration, settings, settings.musicUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleVoiceoverChange = useCallback((file: File | null) => setVoiceoverFile(file), []);
  const handleMusicChange = useCallback((file: File | null) => setMusicFile(file), []);
  const handleScriptChange = useCallback((file: File | null) => setScriptFile(file), []);
  const handleOriginalScriptChange = useCallback((file: File | null) => setOriginalScriptFile(file), []);
  const handleTranscriptChange = useCallback((file: File | null) => setTranscriptFile(file), []);
  const handleSceneOrderChange = useCallback((file: File | null) => setSceneOrderFile(file), []);
  const handleSeek = useCallback((frame: number) => { setCurrentFrame(frame); playerRef.current?.seekTo(frame); }, []);

  const canGenerate = assets.length > 0 && segments.length > 0 && voiceoverDuration > 0 && !!timeline && !!validation?.valid;

  const handleGenerate = async () => {
    if (!timeline || !canGenerate) return;
    setShowRender(true); setDownloadUrl(null); setProgress({ stage: 'rendering', message: 'Uploading media to server...', progress: 2 });
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const url = await exportVideo({ timeline, settings, assets, voiceoverFile, musicFile, signal: controller.signal, onProgress: (pct, msg, details) => setProgress((prev) => ({ stage: 'rendering', message: msg, progress: pct < 0 ? prev.progress : pct, ...details })) });
      setDownloadUrl(url); setProgress({ stage: 'done', message: 'Video rendered successfully', progress: 100 });
    } catch (e) { setProgress({ stage: 'error', message: (e as Error).message || 'Unknown rendering error', progress: 0 }); }
  };
  const handleCancel = () => { abortRef.current?.abort(); setShowRender(false); setProgress({ stage: 'idle', message: '', progress: 0 }); };
  const fileName = `autocut-${Date.now()}.mp4`;

  return <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
    <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
      <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center"><Film className="w-4 h-4 text-zinc-900" /></div><div><h1 className="text-sm font-bold tracking-tight">AutoCut Studio</h1><p className="text-[10px] text-zinc-500 -mt-0.5">Automatic Video Editor</p></div></div>
      <div className="flex items-center gap-3">{validation && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${validation.valid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{validation.valid ? 'Script OK' : 'Script has issues'}</span>}<button onClick={handleGenerate} disabled={!canGenerate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><Wand2 className="w-4 h-4" />Generate Video</button></div>
    </header>
    <div className="flex-1 flex min-h-0">
      <div className="w-72 shrink-0"><MediaBin assets={assets} onAssetsChange={setAssets} voiceoverFile={voiceoverFile} onVoiceoverChange={handleVoiceoverChange} musicFile={musicFile} onMusicChange={handleMusicChange} scriptFile={scriptFile} onScriptChange={handleScriptChange} originalScriptFile={originalScriptFile} onOriginalScriptChange={handleOriginalScriptChange} transcriptFile={transcriptFile} onTranscriptChange={handleTranscriptChange} sceneOrderFile={sceneOrderFile} onSceneOrderChange={handleSceneOrderChange} /></div>
      <div className="flex-1 flex flex-col min-w-0"><div className="flex-1 min-h-0"><PreviewPlayer timeline={timeline} settings={settings} onFrameUpdate={setCurrentFrame} playerRef={playerRef} /></div>{validation && <div className="max-h-32 overflow-y-auto bg-zinc-900 border-t border-zinc-800"><ValidationPanel result={validation} /></div>}<div className="h-48 shrink-0"><TimelineStrip timeline={timeline} waveform={waveform} currentFrame={currentFrame} onSeek={handleSeek} onTransitionChange={(sceneId, field, value) => { if (!timeline) return; setTimeline({ ...timeline, scenes: timeline.scenes.map((s) => s.id === sceneId ? { ...s, [field]: value } : s) }); }} /></div></div>
      <div className="w-72 shrink-0"><SettingsPanel settings={settings} onChange={setSettings} /></div>
    </div>
    <RenderDialog open={showRender} progress={progress} downloadUrl={downloadUrl} fileName={fileName} onClose={() => setShowRender(false)} onCancel={handleCancel} />
  </div>;
}
