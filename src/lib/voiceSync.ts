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

function cheapSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  if (a.startsWith(b) || b.startsWith(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  return 0;
}

function scoreCandidate(scriptWords: string[], transcriptWords: string[], start: number): number {
  const sample = Math.min(scriptWords.length, 14);
  if (start + sample > transcriptWords.length) return -1;

  let score = 0;
  let scriptIndex = 0;
  let transcriptIndex = start;
  let skips = 0;
  const maxSkips = Math.max(2, Math.ceil(sample * 0.2));

  while (scriptIndex < sample && transcriptIndex < transcriptWords.length) {
    const similarity = cheapSimilarity(scriptWords[scriptIndex]!, transcriptWords[transcriptIndex]!);
    if (similarity >= 0.75) {
      score += similarity;
      scriptIndex++;
      transcriptIndex++;
      continue;
    }

    if (skips < maxSkips && transcriptIndex + 1 < transcriptWords.length) {
      const nextSimilarity = cheapSimilarity(scriptWords[scriptIndex]!, transcriptWords[transcriptIndex + 1]!);
      if (nextSimilarity > similarity) {
        skips++;
        transcriptIndex++;
        continue;
      }
    }

    scriptIndex++;
    transcriptIndex++;
  }

  const matched = score / Math.max(1, sample);
  const coverage = scriptIndex / Math.max(1, sample);
  return matched * 0.75 + coverage * 0.25 - skips * 0.025;
}

function findBestLineStart(
  scriptWords: string[],
  transcriptWords: string[],
  cursor: number,
  maxStart: number,
): { start: number; score: number } {
  const first = scriptWords[0]!;
  const second = scriptWords[1];
  let best = { start: cursor, score: -1 };

  // This deliberately avoids the previous O(start × length × word × Levenshtein)
  // search. Auto Sync must remain responsive even for 100+ scene documentaries.
  for (let start = cursor; start <= maxStart; start++) {
    const firstScore = cheapSimilarity(first, transcriptWords[start]!);
    if (firstScore < 0.75) continue;

    // Strong exact anchors win immediately. Three consecutive words are much
    // safer than matching a common word such as "the" or "and".
    if (
      second &&
      start + 1 < transcriptWords.length &&
      cheapSimilarity(second, transcriptWords[start + 1]!) === 1
    ) {
      const third = scriptWords[2];
      if (!third || (start + 2 < transcriptWords.length && cheapSimilarity(third, transcriptWords[start + 2]!) === 1)) {
        return { start, score: 1 };
      }
    }

    const score = scoreCandidate(scriptWords, transcriptWords, start);
    if (score > best.score) best = { start, score };
  }

  return best;
}

export async function alignScriptToTranscript(
  scriptLines: string[],
  transcript: TranscriptWord[],
  mediaIds: string[],
  onProgress?: (current: number, total: number) => void,
): Promise<VoiceSyncResult> {
  const cleanScript = scriptLines.map((text) => text.trim()).filter(Boolean);
  const words = transcript
    .filter((item) => Number.isFinite(item.startTime) && Number.isFinite(item.endTime) && item.endTime >= item.startTime)
    .map((item) => ({ ...item, word: normalizeWord(item.word) }))
    .filter((item) => item.word)
    .sort((a, b) => a.startTime - b.startTime);

  if (!cleanScript.length) throw new Error('The original script contains no usable lines.');
  if (!words.length) throw new Error('The transcript contains no timestamped words. Upload a word-timestamp transcript.');
  if (mediaIds.length < cleanScript.length) throw new Error(`There are ${cleanScript.length} script lines but only ${mediaIds.length} scene media files.`);

  const transcriptWords = words.map((item) => item.word);
  const starts: { start: number; score: number }[] = [];
  let cursor = 0;
  const warnings: string[] = [];

  for (let i = 0; i < cleanScript.length; i++) {
    const scriptWords = tokenize(cleanScript[i]!);
    if (!scriptWords.length) throw new Error(`Original script scene ${i + 1} is empty.`);

    const remainingLines = cleanScript.length - i - 1;
    const maxStart = transcriptWords.length - Math.max(1, remainingLines + 1);
    const match = findBestLineStart(scriptWords, transcriptWords, cursor, Math.max(cursor, maxStart));

    if (match.start < cursor || match.start >= transcriptWords.length || match.score < 0) {
      throw new Error(`Unable to align script scene ${i + 1}. The transcript may be missing narration around this scene.`);
    }

    if (match.score < 0.72) {
      warnings.push(`Scene ${i + 1} has a low transcript match confidence (${Math.round(match.score * 100)}%). Review this scene before rendering.`);
    }

    starts.push(match);
    cursor = match.start + 1;
    onProgress?.(i + 1, cleanScript.length);

    // Yield to the browser after every scene so React can paint the progress bar
    // and the tab never becomes "Page Unresponsive" during a large sync job.
    if (i < cleanScript.length - 1) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  const lines: VoiceSyncLine[] = starts.map((match, index) => {
    const next = starts[index + 1];
    const startTime = Math.max(0, words[match.start]!.startTime);
    const endTime = next
      ? Math.max(startTime + 0.001, words[next.start]!.startTime)
      : Math.max(startTime + 0.001, words[words.length - 1]!.endTime);
    return { sceneId: `scene${index + 1}`, text: cleanScript[index]!, startTime, endTime, confidence: match.score };
  });

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

function tryParseJson(content: string): unknown | null {
  try { return JSON.parse(content) as unknown; } catch { return null; }
}

function cleanTextLine(line: string): string {
  return line
    .replace(/^[\uFEFF\s]+|[\s]+$/g, '')
    .replace(/^(?:scene\s*)?\d+\s*[:.)-]\s*/i, '')
    .replace(/^[-*]\s+/, '')
    .trim();
}

function fallbackArrayLines(content: string): string[] {
  return content
    .replace(/^\s*\[\s*/s, '')
    .replace(/\s*\]\s*$/s, '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[,]+|[,]+$/g, '').trim())
    .map((line) => line.replace(/^['"]|['"]$/g, '').trim())
    .map(cleanTextLine)
    .filter(Boolean);
}

export function parseOriginalScript(content: string): string[] {
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (!trimmed) throw new Error('Original script file is empty.');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = tryParseJson(trimmed);
    if (parsed !== null) {
      const raw = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).scenes ?? (parsed as Record<string, unknown>).segments ?? (parsed as Record<string, unknown>).lines ?? []) : [];
      if (!Array.isArray(raw)) throw new Error('Script JSON must contain a scenes, segments, lines, or array structure.');
      const lines = raw.map((item) => typeof item === 'string' ? item : String((item as Record<string, unknown>).text ?? '')).map(cleanTextLine).filter(Boolean);
      if (!lines.length) throw new Error('Script JSON contains no usable scene lines.');
      return lines;
    }
    const recovered = fallbackArrayLines(trimmed);
    if (recovered.length) return recovered;
    throw new Error('The Original Script looks like JSON but is not valid JSON. Use one scene per line or valid JSON array/object format.');
  }
  const lines = trimmed.split(/\r?\n/).map(cleanTextLine).filter(Boolean);
  if (!lines.length) throw new Error('Original script contains no usable lines.');
  return lines;
}

export function parseSceneOrder(content: string): string[] {
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (!trimmed) throw new Error('Scene order file is empty.');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = tryParseJson(trimmed);
    if (parsed !== null) {
      const raw = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).scenes ?? (parsed as Record<string, unknown>).order ?? (parsed as Record<string, unknown>).media ?? []) : [];
      if (!Array.isArray(raw)) throw new Error('Scene order JSON must contain a scenes, order, media, or array structure.');
      return raw.map((item) => typeof item === 'string' ? item : String((item as Record<string, unknown>).mediaId ?? (item as Record<string, unknown>).file ?? (item as Record<string, unknown>).filename ?? '')).map(cleanTextLine).filter(Boolean);
    }
    const recovered = fallbackArrayLines(trimmed);
    if (recovered.length) return recovered;
    throw new Error('The Scene Order file looks like JSON but is not valid JSON. Use one filename per line or valid JSON format.');
  }
  return trimmed.split(/\r?\n/).map(cleanTextLine).filter(Boolean);
}

function parseSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  const secondsMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*s$/i);
  if (secondsMatch) return Number(secondsMatch[1]);
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseTimestampedTranscript(content: string): TranscriptWord[] {
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (!trimmed) throw new Error('Transcript file is empty.');
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    let parsed: unknown;
    try { parsed = JSON.parse(trimmed) as unknown; }
    catch (error) { throw new Error(`Word Timestamp Transcript contains invalid JSON: ${(error as Error).message}`); }
    const raw = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object'
      ? ((parsed as Record<string, unknown>).words ?? (parsed as Record<string, unknown>).transcript ?? []) : [];
    if (!Array.isArray(raw)) throw new Error('Transcript JSON must contain a words array.');
    const result: TranscriptWord[] = [];
    for (const item of raw) {
      const value = item as Record<string, unknown>;
      const start = parseSeconds(value.startOffset ?? value.startTime ?? value.start ?? value.start_sec);
      const end = parseSeconds(value.endOffset ?? value.endTime ?? value.end ?? value.end_sec);
      const word = String(value.word ?? value.text ?? '').trim();
      if (!word || start === null || end === null || start < 0 || end < start) continue;
      result.push({ word, startTime: start, endTime: end });
    }
    if (!result.length) throw new Error('Transcript JSON contains no valid timestamped words. Expected word + startOffset/endOffset or startTime/endTime.');
    const hasMeaningfulTimeRange = result.some((word) => word.endTime > 0) && result[result.length - 1]!.endTime > result[0]!.startTime;
    if (!hasMeaningfulTimeRange) throw new Error('Transcript timestamps appear to be collapsed to zero. Check startOffset/endOffset values.');
    return result.sort((a, b) => a.startTime - b.startTime);
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
