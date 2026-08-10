import { useState } from 'react';
import { X, Download, Loader2, CheckCircle, AlertCircle, FileVideo } from 'lucide-react';
import type { PipelineProgress } from '@/types';

interface RenderDialogProps {
  open: boolean;
  progress: PipelineProgress;
  downloadUrl: string | null;
  fileName: string;
  onClose: () => void;
  onCancel: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  idle: 'Waiting',
  parsing: 'Parsing timestamps...',
  validating: 'Validating script...',
  building: 'Building timeline...',
  applying: 'Applying transitions & effects...',
  rendering: 'Rendering final video',
  done: 'Done — ready to download',
  error: 'Error',
};

function formatTime(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return 'Calculating…';
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export function RenderDialog({
  open,
  progress,
  downloadUrl,
  fileName,
  onClose,
  onCancel,
}: RenderDialogProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!open) return null;

  const isError = progress.stage === 'error';
  const isDone = progress.stage === 'done';

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    a.click();
    setDownloadStarted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Generate Video</h2>
          </div>
          {isDone && (
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-6">
          {!isError && !isDone && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {STAGE_LABELS[progress.stage] ?? progress.message}
                  </p>
                  <p className="text-xs text-zinc-500">{progress.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-zinc-500 font-mono">
                  {Math.round(progress.progress)}%
                </p>
              </div>

              {(progress.totalChunks ?? 0) > 0 && (
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-zinc-800 py-4 text-xs">
                  <div>
                    <dt className="text-zinc-500">Current chunk</dt>
                    <dd className="mt-1 font-mono text-zinc-200">
                      {progress.currentChunk === null || progress.currentChunk === undefined
                        ? 'Preparing'
                        : `${progress.currentChunk + 1} / ${progress.totalChunks}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Completed</dt>
                    <dd className="mt-1 font-mono text-zinc-200">
                      {progress.completedChunks ?? 0} / {progress.totalChunks} chunks
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Elapsed</dt>
                    <dd className="mt-1 font-mono text-zinc-200">{formatTime(progress.elapsedSeconds)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Estimated remaining</dt>
                    <dd className="mt-1 font-mono text-zinc-200">{formatTime(progress.etaSeconds)}</dd>
                  </div>
                </dl>
              )}

              <div className="mt-4 space-y-1.5">
                {['parsing', 'validating', 'building', 'applying', 'rendering'].map((stage) => {
                  const stageOrder = ['parsing', 'validating', 'building', 'applying', 'rendering'];
                  const currentIdx = stageOrder.indexOf(progress.stage);
                  const stageIdx = stageOrder.indexOf(stage);
                  const isPast = stageIdx < currentIdx;
                  const isCurrent = stageIdx === currentIdx;

                  return (
                    <div key={stage} className="flex items-center gap-2">
                      {isPast ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                      )}
                      <span
                        className={`text-xs ${
                          isPast
                            ? 'text-zinc-500'
                            : isCurrent
                              ? 'text-zinc-200'
                              : 'text-zinc-700'
                        }`}
                      >
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={onCancel}
                className="w-full mt-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {isDone && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-zinc-100 mb-1">Video is ready!</p>
              <p className="text-xs text-zinc-500 mb-6">
                Your video has been rendered and is ready to download.
              </p>
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloadStarted ? 'Download again' : 'Download Final Video'}
              </button>
              <p className="text-xs text-zinc-600 mt-3">{fileName}</p>
            </div>
          )}

          {isError && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm font-medium text-zinc-100 mb-1">Rendering failed</p>
              <p className="text-xs text-red-400 mb-6">{progress.message}</p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
