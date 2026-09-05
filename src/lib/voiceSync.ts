import type { ScriptSegment } from '@/types';

export interface TranscriptWord { word: string; startTime: number; endTime: number; }
export interface VoiceSyncLine { sceneId: string; text: string; startTime: number; endTime: number; confidence: number; }
export interface VoiceSyncResult { segments: ScriptSegment[]; lines: VoiceSyncLine[]; confidence: number; warnings: string[]; }

function normalizeWord(value: string): string {
  return value.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '');
}

function tokenize(value: string): string[] {
  return value.split(/\s+/).map(normalizeWord).filter(Boolean);
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return Math.max(0, 1 - matrix[a.length]![b.length]! / Math.max(a.length, b.length));
}

function scoreSpan(scriptWords: string[], transcriptWords: string[], start: number, endExclusive: number): number {
  const span = transcriptWords.slice(start, endExclusive);
  if (!span.length) return 0;
  const n = Math.min(scriptWords.length, span.length);
  let aligned = 0;
  for (let i = 0; i < n; i++) aligned += similarity(scriptWords[i]!, span[i]!);
  const alignedScore = aligned / Math.max(1, scriptWords.length);
  const lengthRatio = Math.min(span.length, scriptWords.length) / Math.max(span.length, scriptWords.length);
  let bagScore = 0;
  for (const word of scriptWords) {
    let best = 0;
    for (const candidate of span) best = Math.max(best, similarity(word, candidate));
    bagScore += best;
  }
  bagScore /= Math.max(1, scriptWords.length);
  return alignedScore * 0.7 + bagScore * 0.2 + lengthRatio * 0.1;
}

function findBestSpan(
  scriptWords: string[],
  transcriptWords: string[],
  cursor: number,
  maxStart: number,
  minimumWordsAfter: number,
): { start: number; endExclusive: number; score: number } {
  let best = {
    start: cursor,
    endExclusive: Math.min(transcriptWords.length, cursor + scriptWords.length),
    score: -1,
  };
  const minLen = Math.max(1, Math.floor(scriptWords.length * 0.65));
  const maxLen = Math.min(
    transcriptWords.length - cursor - minimumWordsAfter,
    Math.max(minLen, Math.ceil(scriptWords.length * 1.45)),
  );
  if (maxLen < minLen) return best;

  for (let start = cursor; start <= maxStart; start++) {
    if (scriptWords.length <= transcriptWords.length - start) {
      let exact = true;
      for (let i = 0; i < scriptWords.length; i++) {
        if (scriptWords[i] !== transcriptWords[start + i]) {
          exact = false;
          break;
        }
      }
      if (exact) return { start, endExclusive: start + scriptWords.length, score: 1 };
    }
    for (let length = minLen; length <= maxLen; length++) {
      const endExclusive = start + length;
      const score = scoreSpan(scriptWords, transcriptWords, start, endExclusive);
      if (score > best.score) best = { start, endExclusive, score };
    }
  }
  return best;
}

export function alignScriptToTranscript(scriptLines: string[], transcript: TranscriptWord[], mediaIds: string[]): VoiceSyncResult {
  const cleanScript = scriptLines.map((text) => text.trim()).filter(Boolean);
  const words = transcript
    .filter((item) => Number.isFinite(item.startTime) && Number.isFinite(item.endTime) && item.endTime >= item.startTime)
    .map((item) => ({ ...item, word: normalizeWord(item.word) }))
    .filter((item) => item.word);

  if (!cleanScript.length) throw new Error('The original script contains no usable lines.');
  if (!words.length) throw new Error('The transcript contains no timestamped words. Upload a word-timestamp transcript.');
  if (mediaIds.length < cleanScript.length) throw new Error(`There are ${cleanScript.length} script lines but only ${mediaIds.length} scene media files.`);

  const transcriptWords = words.map((item) => item.word);
  const matches: { start: number; endExclusive: number; score: number }[] = [];
  let cursor = 0;
  const warnings: string[] = [];

  for (let i = 0; i < cleanScript.length; i++) {
    const scriptWords = tokenize(cleanScript[i]!);
    const remainingLines = cleanScript.length - i - 1;
    const maxStart = transcriptWords.length - Math.max(1, remainingLines + 1);
    const match = findBestSpan(scriptWords, transcriptWords, cursor, Math.max(cursor, maxStart), remainingLines);
    if (match.endExclusive <= match.start || match.endExclusive > transcriptWords.length) {
      throw new Error(`Unable to align script scene ${i + 1}. Check that the transcript contains the same narration words in the same order.`);
    }
    if (match.score < 0.72) warnings.push(`Scene ${i + 1} has a low transcript match confidence (${Math.round(match.score * 100)}%). Review this scene before rendering.`);
    matches.push(match);
    cursor = match.endExclusive;
  }

  const lines: VoiceSyncLine[] = matches.map((match, index) => {
    const next = matches[index + 1];
    const startTime = index === 0 ? Math.max(0, words[match.start]!.startTime) : words[match.start]!.startTime;
    const endTime = next
      ? Math.max(startTime + 0.001, words[next.start]!.startTime)
      : Math.max(startTime + 0.001, words[match.endExclusive - 1]!.endTime);
    return { sceneId: `scene${index + 1}`, text: cleanScript[index]!, startTime, endTime, confidence: match.score };
  });

  // A valid word-level transcript must produce strictly increasing scene boundaries.
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]!.startTime <= lines[i - 1]!.startTime) {
      throw new Error(`Transcript timestamps are not increasing around scene ${i + 1}. Check the word timestamp JSON.`);
    }
  }

  const segments: ScriptSegment[] = lines.map((line, index) => ({
    sceneId: line.sceneId,
    mediaId: mediaIds[index]!,
    startTime: line.startTime,
    endTime: line.endTime,
    text: line.text,
  }));
  const confidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;
  if (confidence < 0.85) warnings.push(`Overall script/transcript confidence is ${Math.round(confidence * 100)}%. Review the flagged lines before rendering.`);
  return { segments, lines, confidence, warnings };
}

export function parseOriginalScript(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Original script file is empty.');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown;
    const raw = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).scenes ?? (parsed as Record<string, unknown>).segments ?? (parsed as Record<string, unknown>).lines ?? [])
        : [];
    if (!Array.isArray(raw)) throw new Error('Script JSON must contain a scenes, segments, lines, or array structure.');
    const lines = raw.map((item) => typeof item === 'string' ? item : String((item as Record<string, unknown>).text ?? '')).map((s) => s.trim()).filter(Boolean);
    if (!lines.length) throw new Error('Script JSON contains no usable scene lines.');
    return lines;
  }
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .map((line) => line.replace(/^(?:scene\s*)?\d+\s*[:.)-]\s*/i, '').trim()).filter(Boolean);
  if (!lines.length) throw new Error('Original script contains no usable lines.');
  return lines;
}

export function parseSceneOrder(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Scene order file is empty.');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown;
    const raw = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).scenes ?? (parsed as Record<string, unknown>).order ?? (parsed as Record<string, unknown>).media ?? [])
        : [];
    if (!Array.isArray(raw)) throw new Error('Scene order JSON must contain a scenes, order, media, or array structure.');
    return raw.map((item) => typeof item === 'string' ? item : String((item as Record<string, unknown>).mediaId ?? (item as Record<string, unknown>).file ?? (item as Record<string, unknown>).filename ?? ''))
      .map((s) => s.trim()).filter(Boolean);
  }
  return trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .map((line) => line.replace(/^(?:scene\s*)?\d+\s*[:.)-]\s*/i, '').trim()).filter(Boolean);
}

function parseSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  // Supports the user's format: "0.200s", "1s", "12.500s".
  const secondsMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*s$/i);
  if (secondsMatch) return Number(secondsMatch[1]);

  // Also accept plain numeric strings as seconds.
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseTimestampedTranscript(content: string): TranscriptWord[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Transcript file is empty.');

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as unknown;
    const raw = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).words ?? (parsed as Record<string, unknown>).transcript ?? [])
        : [];
    if (!Array.isArray(raw)) throw new Error('Transcript JSON must contain a words array.');

    const result: TranscriptWord[] = [];
    for (const item of raw) {
      const value = item as Record<string, unknown>;
      const start = parseSeconds(value.startOffset ?? value.startTime ?? value.start ?? value.start_sec);
      const end = parseSeconds(value.endOffset ?? value.endTime ?? value.end ?? value.end_sec);
      const word = String(value.word ?? value.text ?? '').trim();
      if (!word || start === null || end === null) continue;
      if (start < 0 || end < start) continue;
      result.push({ word, startTime: start, endTime: end });
    }

    if (!result.length) throw new Error('Transcript JSON contains no valid timestamped words. Expected word + startOffset/endOffset or startTime/endTime.');

    // Do not silently render a collapsed timeline when a timestamp field was parsed incorrectly.
    const hasMeaningfulTimeRange = result.some((word) => word.endTime > 0) && result[result.length - 1]!.endTime > result[0]!.startTime;
    if (!hasMeaningfulTimeRange) throw new Error('Transcript timestamps appear to be collapsed to zero. Check startOffset/endOffset values.');

    return result;
  }

  const result: TranscriptWord[] = [];
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^\s*\[?(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\s*(?:-->|[-–])\s*(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]?\s+(.+)$/);
    if (match) {
      const ms = (match[3] ?? '0').padEnd(3, '0').slice(0, 3);
      const ems = (match[6] ?? '0').padEnd(3, '0').slice(0, 3);
      const start = Number(match[1]) * 60 + Number(match[2]) + Number(ms) / 1000;
      const end = Number(match[4]) * 60 + Number(match[5]) + Number(ems) / 1000;
      const parts = match[7]!.trim().split(/\s+/).filter(Boolean);
      const duration = Math.max(0, end - start);
      parts.forEach((word, index) => result.push({ word, startTime: start + duration * index / parts.length, endTime: start + duration * (index + 1) / parts.length }));
      continue;
    }
    const simple = line.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (simple) {
      const start = Number(simple[1]);
      const end = Number(simple[2]);
      const parts = simple[3]!.trim().split(/\s+/).filter(Boolean);
      const duration = Math.max(0, end - start);
      parts.forEach((word, index) => result.push({ word, startTime: start + duration * index / parts.length, endTime: start + duration * (index + 1) / parts.length }));
    }
  }
  if (!result.length) throw new Error('Could not find timestamps. Upload word-level timestamp JSON, VTT/SRT-style ranges, or start/end/word text.');
  return result;
}
