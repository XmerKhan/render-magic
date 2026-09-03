import type { EditSettings, AspectRatio, CaptionFontFamily, IntroOutroStyle } from '@/types';
import { Sparkles, Type, Palette, Monitor, Film, ChevronDown, Music, Sliders, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { ASPECT_RATIOS } from '@/remotion/config';

interface SettingsPanelProps {
  settings: EditSettings;
  onChange: (settings: EditSettings) => void;
}

const TRANSITION_PACKS: { value: EditSettings['transitionPack']; label: string; desc: string }[] = [
  { value: 'mixed', label: 'Mixed', desc: 'Varied transitions for dynamic feel' },
  { value: 'smooth', label: 'Smooth', desc: 'Crossfades and zooms, gentle flow' },
  { value: 'dynamic', label: 'Dynamic', desc: 'Whip pans and slides, high energy' },
  { value: 'minimal', label: 'Minimal', desc: 'Hard cuts and simple dissolves' },
];

const CAPTION_STYLES: { value: EditSettings['captionStyle']; label: string }[] = [
  { value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' }, { value: 'slide', label: 'Slide' },
  { value: 'typewriter', label: 'Typewriter' }, { value: 'karaoke', label: 'Karaoke' },
];
const CAPTION_POSITIONS: { value: EditSettings['captionPosition']; label: string }[] = [
  { value: 'lower-third', label: 'Bottom' }, { value: 'center', label: 'Center' }, { value: 'top', label: 'Top' },
];
const CAPTION_FONTS: { value: CaptionFontFamily; label: string }[] = [
  { value: 'inter', label: 'Inter' }, { value: 'roboto-mono', label: 'Roboto Mono' },
  { value: 'georgia', label: 'Georgia' }, { value: 'system', label: 'System' },
];
const COLOR_GRADES: { value: EditSettings['colorGrade']; label: string }[] = [
  { value: 'none', label: 'None' }, { value: 'cinematic', label: 'Cinematic' }, { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' }, { value: 'vintage', label: 'Vintage' }, { value: 'vivid', label: 'Vivid' },
];
const RESOLUTIONS: { value: EditSettings['exportResolution']; label: string }[] = [
  { value: '720p', label: '720p HD' }, { value: '1080p', label: '1080p Full HD' }, { value: '4k', label: '4K Ultra HD' },
];
const INTRO_OUTRO_STYLES: { value: IntroOutroStyle; label: string }[] = [
  { value: 'fade', label: 'Fade' }, { value: 'slide-up', label: 'Slide Up' }, { value: 'typewriter', label: 'Typewriter' },
  { value: 'zoom', label: 'Zoom' }, { value: 'reveal', label: 'Reveal' },
];

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return <div className="border-b border-zinc-800">
    <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-800/50 transition-colors">
      <span className="text-amber-500">{icon}</span>
      <span className="text-sm font-medium text-zinc-200 flex-1 text-left">{title}</span>
      <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? '' : 'rotate-180'}`} />
    </button>
    {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
  </div>;
}

function SegmentedControl<T extends string>({ options, value, onChange, cols = 2 }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; cols?: number;
}) {
  return <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {options.map((opt) => <button key={opt.value} onClick={() => onChange(opt.value)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${value === opt.value ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>{opt.label}</button>)}
  </div>;
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return <div><label className="text-xs text-zinc-400 mb-1.5 block">{label}: {format ? format(value) : value}</label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-amber-500" />
  </div>;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="flex items-center gap-2"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 cursor-pointer" /><span className="text-xs text-zinc-400">{label}</span></div>;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (patch: Partial<EditSettings>) => onChange({ ...settings, ...patch });
  const updateCaption = (patch: Partial<EditSettings['captionSettings']>) => update({ captionSettings: { ...settings.captionSettings, ...patch } });
  const updateGrade = (patch: Partial<EditSettings['manualColorGrade']>) => update({ manualColorGrade: { ...settings.manualColorGrade, ...patch } });
  const motion = {
    lowerThird: true, callout: true, dateStamp: true, location: true, quoteCard: true,
    ...(settings.motionGraphics ?? {}),
  };
  const updateMotion = (key: keyof typeof motion, value: boolean) => update({ motionGraphics: { ...motion, [key]: value } });

  return <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
    <div className="px-4 py-3 border-b border-zinc-800"><h2 className="text-sm font-semibold text-zinc-200">Export Settings</h2></div>

    <Section icon={<Monitor className="w-4 h-4" />} title="Aspect Ratio">
      <div className="grid grid-cols-2 gap-1.5">{(Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS[AspectRatio]][]).map(([ar, info]) =>
        <button key={ar} onClick={() => update({ aspectRatio: ar })} className={`p-2.5 rounded-lg border text-left transition-colors ${settings.aspectRatio === ar ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
          <div className="flex items-center gap-2 mb-1"><div className="border border-zinc-500 rounded-sm shrink-0" style={{ width: 24 * (info.width > info.height ? 1 : info.width / info.height), height: 24 * (info.height > info.width ? 1 : info.height / info.width) }} /><span className="text-xs font-medium text-zinc-200">{info.label}</span></div>
          <p className="text-[10px] text-zinc-500">{info.desc}</p>
        </button>)}
      </div>
    </Section>

    <Section icon={<Sparkles className="w-4 h-4" />} title="Transitions">
      <div className="space-y-1.5">{TRANSITION_PACKS.map((pack) => <button key={pack.value} onClick={() => update({ transitionPack: pack.value })} className={`w-full text-left p-2.5 rounded-lg border transition-colors ${settings.transitionPack === pack.value ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}><p className="text-xs font-medium text-zinc-200">{pack.label}</p><p className="text-[10px] text-zinc-500">{pack.desc}</p></button>)}</div>
      <Slider label="Duration" value={settings.transitionDuration} min={0.2} max={2} step={0.1} onChange={(v) => update({ transitionDuration: v })} format={(v) => `${v.toFixed(1)}s`} />
    </Section>

    <Section icon={<Type className="w-4 h-4" />} title="Captions">
      <div><label className="text-xs text-zinc-400 mb-1.5 block">Style</label><SegmentedControl options={CAPTION_STYLES} value={settings.captionStyle} onChange={(v) => update({ captionStyle: v })} cols={3} /></div>
      <div><label className="text-xs text-zinc-400 mb-1.5 block">Position</label><SegmentedControl options={CAPTION_POSITIONS} value={settings.captionPosition} onChange={(v) => update({ captionPosition: v })} cols={3} /></div>
      <div><label className="text-xs text-zinc-400 mb-1.5 block">Font Family</label><SegmentedControl options={CAPTION_FONTS} value={settings.captionSettings.fontFamily} onChange={(v) => updateCaption({ fontFamily: v })} cols={2} /></div>
      <Slider label="Font Size" value={settings.captionSettings.fontSize} min={24} max={96} step={2} onChange={(v) => updateCaption({ fontSize: v })} />
      <div className="flex items-center gap-3"><ColorInput label="Text Color" value={settings.captionSettings.textColor} onChange={(v) => updateCaption({ textColor: v })} /><ColorInput label="Karaoke Color" value={settings.captionSettings.karaokeColor} onChange={(v) => updateCaption({ karaokeColor: v })} /></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.captionSettings.backgroundPill} onChange={(e) => updateCaption({ backgroundPill: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Background pill</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.captionSettings.outline} onChange={(e) => updateCaption({ outline: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Text outline / stroke</span></label>
      {settings.captionSettings.outline && <ColorInput label="Outline Color" value={settings.captionSettings.outlineColor} onChange={(v) => updateCaption({ outlineColor: v })} />}
      <Slider label="Timing Offset" value={settings.captionSettings.timingOffsetMs} min={-500} max={500} step={10} onChange={(v) => updateCaption({ timingOffsetMs: v })} format={(v) => `${v}ms`} />
    </Section>

    <Section icon={<Wand2 className="w-4 h-4" />} title="Motion Graphics">
      <p className="text-[10px] text-zinc-500">These overlays use the text/data from each script scene. Turn individual graphics on or off for the whole video.</p>
      <label className="flex items-center justify-between gap-2 cursor-pointer rounded-lg bg-zinc-800/70 px-3 py-2"><span className="text-xs text-zinc-300">Lower Third</span><input type="checkbox" checked={motion.lowerThird} onChange={(e) => updateMotion('lowerThird', e.target.checked)} className="accent-amber-500" /></label>
      <label className="flex items-center justify-between gap-2 cursor-pointer rounded-lg bg-zinc-800/70 px-3 py-2"><span className="text-xs text-zinc-300">Text Callout</span><input type="checkbox" checked={motion.callout} onChange={(e) => updateMotion('callout', e.target.checked)} className="accent-amber-500" /></label>
      <label className="flex items-center justify-between gap-2 cursor-pointer rounded-lg bg-zinc-800/70 px-3 py-2"><span className="text-xs text-zinc-300">Date Stamp</span><input type="checkbox" checked={motion.dateStamp} onChange={(e) => updateMotion('dateStamp', e.target.checked)} className="accent-amber-500" /></label>
      <label className="flex items-center justify-between gap-2 cursor-pointer rounded-lg bg-zinc-800/70 px-3 py-2"><span className="text-xs text-zinc-300">Location Pin</span><input type="checkbox" checked={motion.location} onChange={(e) => updateMotion('location', e.target.checked)} className="accent-amber-500" /></label>
      <label className="flex items-center justify-between gap-2 cursor-pointer rounded-lg bg-zinc-800/70 px-3 py-2"><span className="text-xs text-zinc-300">Quote Card</span><input type="checkbox" checked={motion.quoteCard} onChange={(e) => updateMotion('quoteCard', e.target.checked)} className="accent-amber-500" /></label>
    </Section>

    <Section icon={<Palette className="w-4 h-4" />} title="Color Grade">
      <SegmentedControl options={COLOR_GRADES} value={settings.colorGrade} onChange={(v) => update({ colorGrade: v })} cols={3} />
      <div className="pt-2 border-t border-zinc-800"><p className="text-xs text-zinc-500 mb-2">Manual Fine-Tune</p>
        <Slider label="Brightness" value={settings.manualColorGrade.brightness} min={0.5} max={1.5} step={0.01} onChange={(v) => updateGrade({ brightness: v })} format={(v) => v.toFixed(2)} />
        <Slider label="Contrast" value={settings.manualColorGrade.contrast} min={0.5} max={2} step={0.01} onChange={(v) => updateGrade({ contrast: v })} format={(v) => v.toFixed(2)} />
        <Slider label="Saturation" value={settings.manualColorGrade.saturation} min={0} max={2} step={0.01} onChange={(v) => updateGrade({ saturation: v })} format={(v) => v.toFixed(2)} />
        <Slider label="Vignette" value={settings.manualColorGrade.vignette} min={0} max={1} step={0.05} onChange={(v) => updateGrade({ vignette: v })} format={(v) => `${Math.round(v * 100)}%`} />
        <Slider label="Film Grain" value={settings.manualColorGrade.filmGrain} min={0} max={1} step={0.05} onChange={(v) => updateGrade({ filmGrain: v })} format={(v) => `${Math.round(v * 100)}%`} />
      </div>
    </Section>

    <Section icon={<Music className="w-4 h-4" />} title="Audio">
      <Slider label="Music Volume" value={settings.musicVolume} min={0} max={1} step={0.05} onChange={(v) => update({ musicVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.autoDuck} onChange={(e) => update({ autoDuck: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Auto-duck music under voiceover</span></label>
      <div className="pt-2 border-t border-zinc-800"><p className="text-xs text-zinc-500 mb-2">Voiceover Processing</p>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.trimSilence} onChange={(e) => update({ trimSilence: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Trim leading/trailing silence</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.normalizeLoudness} onChange={(e) => update({ normalizeLoudness: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Normalize loudness</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.voiceClarityBoost} onChange={(e) => update({ voiceClarityBoost: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Voice clarity boost</span></label>
        <Slider label="Fade In" value={settings.voiceFadeInSec} min={0} max={2} step={0.1} onChange={(v) => update({ voiceFadeInSec: v })} format={(v) => `${v.toFixed(1)}s`} />
        <Slider label="Fade Out" value={settings.voiceFadeOutSec} min={0} max={2} step={0.1} onChange={(v) => update({ voiceFadeOutSec: v })} format={(v) => `${v.toFixed(1)}s`} />
      </div>
    </Section>

    <Section icon={<Film className="w-4 h-4" />} title="Branding">
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.showIntro} onChange={(e) => update({ showIntro: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Show intro card</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings.showOutro} onChange={(e) => update({ showOutro: e.target.checked })} className="accent-amber-500" /><span className="text-xs text-zinc-300">Show outro card</span></label>
      {settings.showIntro && <>
        <input value={settings.introText} onChange={(e) => update({ introText: e.target.value })} placeholder="Intro title" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 placeholder:text-zinc-600" />
        <input value={settings.introSubtitle} onChange={(e) => update({ introSubtitle: e.target.value })} placeholder="Intro subtitle" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 placeholder:text-zinc-600" />
      </>}
      {settings.showOutro && <>
        <input value={settings.outroText} onChange={(e) => update({ outroText: e.target.value })} placeholder="Outro title" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 placeholder:text-zinc-600" />
        <input value={settings.channelName} onChange={(e) => update({ channelName: e.target.value })} placeholder="Channel name" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 placeholder:text-zinc-600" />
      </>}
      <div><label className="text-xs text-zinc-400 mb-1.5 block">Card Animation</label><SegmentedControl options={INTRO_OUTRO_STYLES} value={settings.introOutroStyle} onChange={(v) => update({ introOutroStyle: v })} cols={3} /></div>
    </Section>

    <Section icon={<Monitor className="w-4 h-4" />} title="Export">
      <SegmentedControl options={RESOLUTIONS} value={settings.exportResolution} onChange={(v) => update({ exportResolution: v })} cols={3} />
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => update({ exportFormat: 'mp4' })} className={`px-3 py-2 rounded-lg text-xs font-medium ${settings.exportFormat === 'mp4' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>MP4 (H.264)</button>
        <button onClick={() => update({ exportFormat: 'webm' })} className={`px-3 py-2 rounded-lg text-xs font-medium ${settings.exportFormat === 'webm' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>WebM (VP9)</button>
      </div>
      <Slider label="Frame Rate" value={settings.fps} min={24} max={60} step={1} onChange={(v) => update({ fps: v })} format={(v) => `${v}fps`} />
    </Section>
  </div>;
}
