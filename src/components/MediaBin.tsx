import { useRef, useState, useCallback } from 'react';
import { Upload, Image, Video, X, FileAudio, FileJson, Music } from 'lucide-react';
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
}

export function MediaBin({
  assets,
  onAssetsChange,
  voiceoverFile,
  voiceoverUrl,
  onVoiceoverChange,
  musicFile,
  onMusicChange,
  scriptFile,
  onScriptChange,
}: MediaBinProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setLoading(true);
      const fileArr = Array.from(files);
      const newAssets: MediaAsset[] = [];

      for (const file of fileArr) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          try {
            const asset = await createMediaAsset(file);
            newAssets.push(asset);
          } catch (e) {
            console.error('Failed to load', file.name, e);
          }
        } else if (file.type.startsWith('audio/')) {
          onVoiceoverChange(file);
        } else if (
          file.type === 'application/json' ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.srt')
        ) {
          onScriptChange(file);
        }
      }

      if (newAssets.length > 0) {
        onAssetsChange([...assets, ...newAssets]);
      }
      setLoading(false);
    },
    [assets, onAssetsChange, onVoiceoverChange, onScriptChange, onMusicChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeAsset = (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) URL.revokeObjectURL(asset.url);
    onAssetsChange(assets.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div
        className={`m-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
        onClick={() => mediaInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
        <p className="text-sm text-zinc-300 font-medium">Drop media here</p>
        <p className="text-xs text-zinc-500 mt-1">Images & videos</p>
        <input
          ref={mediaInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {loading && (
        <p className="text-xs text-amber-400 text-center px-3 pb-2">Loading files...</p>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {assets.length > 0 && (
          <>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Media Bin ({assets.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700"
                >
                  {asset.kind === 'image' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 bg-zinc-800 flex items-center justify-center relative">
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white/70" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <div className="p-1.5">
                    <p className="text-xs text-zinc-300 truncate">{asset.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {asset.kind === 'image' ? (
                        <span className="flex items-center gap-1">
                          <Image className="w-2.5 h-2.5" /> Image
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" /> Video
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Audio & Script
          </p>

          <button
            onClick={() => audioInputRef.current?.click()}
            className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
              voiceoverFile
                ? 'border-emerald-600 bg-emerald-600/10'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 font-medium">
                  {voiceoverFile ? voiceoverFile.name : 'Voiceover audio'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {voiceoverFile ? 'Loaded' : 'MP3 / WAV'}
                </p>
              </div>
            </div>
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onVoiceoverChange(e.target.files[0])}
          />

          <button
            onClick={() => musicInputRef.current?.click()}
            className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
              musicFile
                ? 'border-sky-600 bg-sky-600/10'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 font-medium">
                  {musicFile ? musicFile.name : 'Background music'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {musicFile ? 'Loaded' : 'MP3 / WAV'}
                </p>
              </div>
            </div>
          </button>
          <input
            ref={musicInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onMusicChange(e.target.files[0])}
          />

          <button
            onClick={() => scriptInputRef.current?.click()}
            className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
              scriptFile
                ? 'border-amber-600 bg-amber-600/10'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 font-medium">
                  {scriptFile ? scriptFile.name : 'Timestamp / Script'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {scriptFile ? 'Loaded' : 'JSON / SRT'}
                </p>
              </div>
            </div>
          </button>
          <input
            ref={scriptInputRef}
            type="file"
            accept=".json,.srt,application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onScriptChange(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  );
}
