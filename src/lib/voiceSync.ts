import type { ScriptSegment } from '@/types';

export interface TranscriptWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface VoiceSyncLine {
  sceneId: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface VoiceSyncResult {
  segments: ScriptSegment[];
  lines: VoiceSyncLine[];
  confidence: number;
  warnings: string[];
}

function normalizeWord(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function tokenize(value: string): string[] {
  return value
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return 0;
  let common = 0;
  const used = new Set<number>();
  for (const char of a) {
    const index = b.indexOf(char);
    if (index >= 0 && !used.has(index)) {
      used.add(index);
      common++;
    }
  }
  return (2 * common) / (a.length + b.length);
}

function lineScore(scriptWords: string[], transcriptWords: string[], start: number): number {
  if (start < 0 || start >= transcriptWords.length || scriptWords.length === 0) return 0;
  const span = Math.max(1, Math.round(scriptWords.length * 1.25));
  const end = Math.min(transcriptWords.length, start + span);
  const window = transcriptWords.slice(start, end);
  if (window.length === 0) return 0;

  let matched = 0;
  for (const word of scriptWords) {
    let best = 0;
    for (const candidate of window) best = Math.max(best, similarity(word, candidate));
    matched += best;
  }
  const coverage = matched / scriptWords.length;
  const lengthPenalty = Math.min(1, Math.abs(window.length - scriptWords.length) / Math.max(4, scriptWords.length));
  return coverage * (1 - lengthPenalty * 0.15);
}

/**
 * Aligns already-timestamped transcript words to ordered script lines.
 * The algorithm is intentionally monotonic: a later script line can never
 * consume words belonging to an earlier line. Low-confidence matches are
 * reported instead of silently producing misleading timestamps.
 */
export function alignScriptToTranscript(
  scriptLines: string[],
  transcript: TranscriptWord[],
  mediaIds: string[],
): VoiceSyncResult {
  const cleanScript = scriptLines.map((text) => text.trim()).filter(Boolean);
  const words = transcript
    .filter((item) => Number.isFinite(item.startTime) && Number.isFinite(item.endTime) && item.endTime >= item.startTime)
    .map((item) => ({ ...item, word: normalizeWord(item.word) }))
    .filter((item) => item.word);

  if (cleanScript.length === 0) throw new Error('The original script contains no usable lines.');
  if (words.length === 0) throw new Error('The transcript contains no timestamped words. Upload a word-timestamp transcript.');
  if (mediaIds.length < cleanScript.length) {
    throw new Error(`There are ${cleanScript.length} script lines but only ${mediaIds.length} scene media files. Upload at least one media asset per script line.`);
  }

  const transcriptWords = words.map((item) => item.word);
  const lines: VoiceSyncLine[] = [];
  const warnings: string[] = [];
  let cursor = 0;

  cleanScript.forEach((text, lineIndex) => {
    const scriptWords = tokenize(text);
    if (scriptWords.length === 0) return;

    const remainingLines = cleanScript.length - lineIndex - 1;
    const latestStart = transcriptWords.length - Math.max(1, remainingLines + 1);
    let bestStart = cursor;
    let bestScore = -1;

    for (let start = cursor; start <= latestStart; start++) {
      const score = lineScore(scriptWords, transcriptWords, start);
      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
      }
      if (bestScore >= 0.985) break;
    }

    const nextCursor = lineIndex === cleanScript.length - 1
      ? words.length
      : (() => {
          const searchFrom = Math.max(bestStart + Math.max(1, scriptWords.length - 2), bestStart + 1);
          const nextScriptWords = tokenize(cleanScript[lineIndex + 1] ?? '');
          let nextBest = Math.min(words.length - 1, searchFrom);
          let nextScore = -1;
          for (let start = searchFrom; start < words.length; start++) {
            const score = lineScore(nextScriptWords, transcriptWords, start);
            if (score > nextScore) {
              nextScore = score;
              nextBest = start;
            }
            if (nextScore >= 0.985) break;
          }
          return Math.max(bestStart + 1, nextBest);
        })();

    const startTime = words[bestStart]?.startTime ?? 0;
    const nextStartTime = words[Math.min(nextCursor, words.length - 1)]?.startTime;
    const endTime = lineIndex === cleanScript.length - 1
      ? Math.max(startTime, words[words.length - 1]?.endTime ?? startTime)
      : Math.max(startTime + 1 / 1000, nextStartTime ?? startTime);

    const confidence = Math.max(0, Math.min(1, bestScore));
    if (confidence < 0.72) {
      warnings.push(`Scene ${lineIndex + 1} has a low transcript match confidence (${Math.round(confidence * 100)}%). Review this line before rendering.`);
    }
    if (nextCursor <= bestStart) {
      throw new Error(`Unable to keep transcript order at script line ${lineIndex + 1}. The transcript and script appear inconsistent.`);
    }

    lines.push({
      sceneId: `scene${lineIndex + 1}`,
      text,
      startTime,
      endTime,
      confidence,
    });
    cursor = nextCursor;
  });

  if (lines.length !== cleanScript.length) {
    throw new Error(`Only ${lines.length} of ${cleanScript.length} script lines could be aligned.`);
  }

  const segments: ScriptSegment[] = lines.map((line, index) => ({
    sceneId: line.sceneId,
    mediaId: mediaIds[index]!,
    startTime: line.startTime,
    endTime: line.endTime,
    text: line.text,
  }));

  const confidence = lines.reduce((sum, line) => sum + line.confidence, 0) / Math.max(1, lines.length);
  if (confidence < 0.85) {
    warnings.push(`Overall script/transcript confidence is ${Math.round(confidence * 100)}%. The timeline was created, but review the flagged lines before rendering.`);
  }

  return { segments, lines, confidence, warnings };
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
    const result = raw.map((item) => {
      const value = item as Record<string, unknown>;
      return {
        word: String(value.word ?? value.text ?? ''),
        startTime: Number(value.startTime ?? value.start ?? value.start_sec ?? 0),
        endTime: Number(value.endTime ?? value.end ?? value.end_sec ?? value.startTime ?? value.start ?? 0),
      };
    });
    if (result.length === 0) throw new Error('Transcript JSON contains no words.');
    return result;
  }

  // Supports common line formats such as:
  // [00:01.230 --> 00:01.600] hello
  // 00:01.230\t00:01.600\thello
  // 1.230 1.600 hello
  const result: TranscriptWord[] = [];
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/(?:\[)?(\d{1,2}):(\d{2})(?:[.:](\d{3}))?(?:\s*[-–>]+\s*(\d{1,2}):(\d{2})(?:[.:](\d{3}))?)?[\]\s\t]+(.+)/);
    if (match) {
      const start = Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? '0'}`);
      const end = match[5]
        ? Number(match[5]) * 60 + Number(match[6]) + Number(`0.${match[7] ?? '0'}`)
        : start;
      const text = match[8].trim();
      const parts = text.split(/\s+/).filter(Boolean);
      const duration = Math.max(0, end - start);
      parts.forEach((word, index) => {
        const partStart = start + duration * (index / Math.max(1, parts.length));
        const partEnd = start + duration * ((index + 1) / Math.max(1, parts.length));
        result.push({ word, startTime: partStart, endTime: partEnd });
      });
      continue;
    }

    const simple = line.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (simple) {
      const start = Number(simple[1]);
      const end = Number(simple[2]);
      const parts = simple[3].trim().split(/\s+/).filter(Boolean);
      const duration = Math.max(0, end - start);
      parts.forEach((word, index) => result.push({
        word,
        startTime: start + duration * (index / Math.max(1, parts.length)),
        endTime: start + duration * ((index + 1) / Math.max(1, parts.length)),
      }));
    }
  }

  if (result.length === 0) {
    throw new Error('Could not find timestamps in transcript. Plain text alone cannot determine exact scene timing; upload word-level timestamps or a timestamped transcript.');
  }
  return result;
}
