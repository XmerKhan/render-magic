import { useRef, useState, useCallback } from 'react';
import { Upload, Image, Video, X, FileAudio, FileJson, Music, FileText, ListOrdered } from 'lucide-react';
import type { MediaAsset } from '@/types';
import { createMediaAsset } from '@/lib/mediaFactory';

interface MediaBinProps {
  assets: MediaAsset[];
  onAssetsChange: (assets: MediaAsset[]) => void;
  voiceoverFile: File | null;
  voiceoverUrl: string | null;
  onVoiceoverChange: (file: File | null) => void;
  musicFile: File | null;
  onMusicChange: (file: File | null) => void;
  scriptFile: File | null;
  onScriptChange: (file: File | null) => void;
  originalScriptFile: File | null;
  onOriginalScriptChange: (file: File | null) => void;
  transcriptFile: File | null;
  onTranscriptChange: (file: File | null) => void;
  sceneOrderFile: File | null;
  onSceneOrderChange: (file: File | null) => void;
}

export function MediaBin({
  assets, onAssetsChange, voiceoverFile, onVoiceoverChange, musicFile, onMusicChange,
  scriptFile, onScriptChange, originalScriptFile, onOriginalScriptChange,
  transcriptFile, onTranscriptChange, sceneOrderFile, onSceneOrderChange,
}: MediaBinProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const originalScriptInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const sceneOrderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setLoading(true);
    const fileArr = Array.from(files);
    const newAssets: MediaAsset[] = [];
    for (const file of fileArr) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try { newAssets.push(await createMediaAsset(file)); } catch (e) { console.error('Failed to load', file.name, e); }
      }
    }
    if (newAssets.length > 0) onAssetsChange([...assets, ...newAssets]);
    setLoading(false);
  }, [assets, onAssetsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeAsset = (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) URL.revokeObjectURL(asset.url);
    onAssetsChange(assets.filter((a) => a.id !== id));
  };

  const fileButton = (label: string, file: File | null, icon: React.ReactNode, onClick: () => void, hint: string, active: string) => (
    <button onClick={onClick} className={`w-full rounded-lg border p-2.5 text-left transition-colors ${file ? active : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-300 font-medium truncate">{file ? file.name : label}</p>
          <p className="text-[10px] text-zinc-500">{file ? 'Loaded' : hint}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div className={`m-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-600'}`} onClick={() => mediaInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
        <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
        <p className="text-sm text-zinc-300 font-medium">Drop media here</p>
        <p className="text-xs text-zinc-500 mt-1">Images & videos — upload in Scene 1 → Scene 2 order</p>
        <input ref={mediaInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>
      {loading && <p className="text-xs text-amber-400 text-center px-3 pb-2">Loading files...</p>}

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {assets.length > 0 && <>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Media Bin ({assets.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset, index) => <div key={asset.id} className="group relative rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
              {asset.kind === 'image' ? <img src={asset.url} alt={asset.name} className="w-full h-20 object-cover" /> : <div className="w-full h-20 bg-zinc-800 flex items-center justify-center relative"><video src={asset.url} className="w-full h-full object-cover" muted /><div className="absolute inset-0 flex items-center justify-center"><Video className="w-6 h-6 text-white/70" /></div></div>}
              <span className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white">Scene {index + 1}</span>
              <button onClick={() => removeAsset(asset.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><X className="w-3 h-3 text-white" /></button>
              <div className="p-1.5"><p className="text-xs text-zinc-300 truncate">{asset.name}</p><p className="text-[10px] text-zinc-500">{asset.kind === 'image' ? <span className="flex items-center gap-1"><Image className="w-2.5 h-2.5" /> Image</span> : <span className="flex items-center gap-1"><Video className="w-2.5 h-2.5" /> Video</span>}</p></div>
            </div>)}
          </div>
        </>}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Audio & Script</p>
          {fileButton('Voiceover audio', voiceoverFile, <FileAudio className="w-4 h-4 text-zinc-400" />, () => audioInputRef.current?.click(), 'MP3 / WAV', 'border-emerald-600 bg-emerald-600/10')}
          <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && onVoiceoverChange(e.target.files[0])} />
          {fileButton('Background music', musicFile, <Music className="w-4 h-4 text-zinc-400" />, () => musicInputRef.current?.click(), 'MP3 / WAV', 'border-sky-600 bg-sky-600/10')}
          <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && onMusicChange(e.target.files[0])} />

          <p className="text-[10px] text-zinc-600 pt-2">AUTO SYNC INPUTS</p>
          {fileButton('Original script', originalScriptFile, <FileText className="w-4 h-4 text-zinc-400" />, () => originalScriptInputRef.current?.click(), 'TXT / MD / JSON — one scene line per line', 'border-amber-600 bg-amber-600/10')}
          <input ref={originalScriptInputRef} type="file" accept=".txt,.md,.json,text/plain,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onOriginalScriptChange(e.target.files[0])} />
          {fileButton('Word timestamp transcript', transcriptFile, <FileJson className="w-4 h-4 text-zinc-400" />, () => transcriptInputRef.current?.click(), 'JSON / SRT / VTT-style timestamps', 'border-violet-600 bg-violet-600/10')}
          <input ref={transcriptInputRef} type="file" accept=".json,.srt,.vtt,text/plain,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onTranscriptChange(e.target.files[0])} />
          {fileButton('Scene order (optional)', sceneOrderFile, <ListOrdered className="w-4 h-4 text-zinc-400" />, () => sceneOrderInputRef.current?.click(), 'TXT / JSON — one media filename per line', 'border-cyan-600 bg-cyan-600/10')}
          <input ref={sceneOrderInputRef} type="file" accept=".txt,.json,text/plain,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onSceneOrderChange(e.target.files[0])} />

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-[10px] text-zinc-500 leading-relaxed">
            <b className="text-zinc-400">How it works:</b> Voiceover + original script + word timestamps → exact scene timing. If Scene Order is not uploaded, the Media Bin order is used automatically. Legacy timestamp JSON/SRT is still supported below.
          </div>

          {fileButton('Timestamp / Script', scriptFile, <FileJson className="w-4 h-4 text-zinc-400" />, () => scriptInputRef.current?.click(), 'Legacy JSON / SRT', 'border-zinc-600 bg-zinc-700/20')}
          <input ref={scriptInputRef} type="file" accept=".json,.srt,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onScriptChange(e.target.files[0])} />
        </div>
      </div>
    </div>
  );
}
