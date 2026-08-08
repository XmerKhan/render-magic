import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ValidationResult } from '@/types';

interface ValidationPanelProps {
  result: ValidationResult | null;
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  if (!result) return null;

  return (
    <div className="space-y-2 px-4 py-3">
      {result.errors.map((err, i) => (
        <div
          key={`err-${i}`}
          className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-900"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{err}</p>
        </div>
      ))}

      {result.warnings.map((warn, i) => (
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

      {result.valid && result.warnings.length > 0 && (
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
