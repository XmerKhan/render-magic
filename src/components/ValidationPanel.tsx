import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { ValidationResult } from '@/types';

interface ValidationPanelProps {
  result: ValidationResult | null;
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  if (!result) return null;

  const isAutoSyncing = result.warnings.some((warn) => warn.toLowerCase().includes('auto sync is matching'));

  return (
    <div className="space-y-2 px-4 py-3">
      {isAutoSyncing && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/70">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-300">Auto Sync is matching your script</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Matching the original script against the word-level transcript…</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-label="Auto Sync matching in progress">
            <div className="h-full w-1/3 rounded-full bg-amber-400 animate-[auto-sync-progress_1.4s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {result.errors.map((err, i) => (
        <div
          key={`err-${i}`}
          className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-900"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{err}</p>
        </div>
      ))}

      {result.warnings.filter((warn) => !warn.toLowerCase().includes('auto sync is matching')).map((warn, i) => (
        <div
          key={`warn-${i}`}
          className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-900"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{warn}</p>
        </div>
      ))}

      {result.valid && result.warnings.length === 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300">
            Script validated — {result.scriptDurationSec.toFixed(1)}s of content, voiceover is{' '}
            {result.voiceoverDurationSec.toFixed(1)}s. No gaps, overlaps, or missing media.
          </p>
        </div>
      )}

      {result.valid && result.warnings.length > 0 && !isAutoSyncing && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300">
            Script is usable with warnings. {result.scriptDurationSec.toFixed(1)}s of content.
          </p>
        </div>
      )}
    </div>
  );
}
