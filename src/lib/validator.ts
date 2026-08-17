import type { ScriptSegment, MediaAsset, ValidationResult } from '@/types';

function resolveMedia(
  mediaId: string,
  mediaMap: Map<string, MediaAsset>,
  nameMap: Map<string, MediaAsset>,
): MediaAsset | undefined {
  if (mediaMap.has(mediaId)) return mediaMap.get(mediaId);
  return nameMap.get(mediaId);
}

export function validateScript(
  segments: ScriptSegment[],
  mediaMap: Map<string, MediaAsset>,
  voiceoverDurationSec: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const gaps: { sceneId: string; gapSec: number }[] = [];
  const overlaps: { sceneId: string; overlapSec: number }[] = [];
  const missingMedia: string[] = [];

  const nameMap = new Map<string, MediaAsset>();
  for (const asset of mediaMap.values()) {
    nameMap.set(asset.name, asset);
  }

  if (segments.length === 0) {
    errors.push('Script file contains no segments.');
  }

  for (const seg of segments) {
    const media = resolveMedia(seg.mediaId, mediaMap, nameMap);
    if (!media) {
      missingMedia.push(seg.mediaId);
      errors.push(
        `Segment "${seg.sceneId}" references media "${seg.mediaId}" which has no matching uploaded asset.`,
      );
    }
    if (seg.endTime <= seg.startTime) {
      errors.push(
        `Segment "${seg.sceneId}" has endTime (${seg.endTime}) <= startTime (${seg.startTime}).`,
      );
    }
    if (seg.startTime < 0) {
      errors.push(`Segment "${seg.sceneId}" has a negative startTime.`);
    }
  }

  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
  let lastEnd = 0;
  for (const seg of sorted) {
    const gap = seg.startTime - lastEnd;
    if (gap > 0.05) {
      gaps.push({ sceneId: seg.sceneId, gapSec: gap });
      warnings.push(
        `Gap of ${gap.toFixed(2)}s before scene "${seg.sceneId}" (between ${lastEnd.toFixed(2)}s and ${seg.startTime.toFixed(2)}s).`,
      );
    } else if (gap < -0.05) {
      overlaps.push({ sceneId: seg.sceneId, overlapSec: -gap });
      warnings.push(
        `Overlap of ${(-gap).toFixed(2)}s at scene "${seg.sceneId}" (starts at ${seg.startTime.toFixed(2)}s but previous scene ends at ${lastEnd.toFixed(2)}s).`,
      );
    }
    lastEnd = Math.max(lastEnd, seg.endTime);
  }

  const scriptDurationSec = sorted.length > 0
    ? sorted[sorted.length - 1].endTime
    : 0;

  if (voiceoverDurationSec > 0) {
    const diff = Math.abs(scriptDurationSec - voiceoverDurationSec);
    if (diff > 1.0) {
      warnings.push(
        `Script total duration (${scriptDurationSec.toFixed(2)}s) differs from measured voiceover duration (${voiceoverDurationSec.toFixed(2)}s) by ${diff.toFixed(2)}s.`,
      );
    }
    // JSON timestamps are the authoritative visual timeline. A browser/media
    // duration that is shorter than the final timestamp must not invalidate the
    // whole timeline, otherwise the last scenes can never be rendered.
    if (scriptDurationSec > voiceoverDurationSec + 0.5) {
      warnings.push(
        `Measured voiceover duration is shorter than the script timestamps. The timeline will use the script endpoint (${scriptDurationSec.toFixed(2)}s) to preserve every scene and voiceover line.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    voiceoverDurationSec,
    scriptDurationSec,
    gaps,
    overlaps,
    missingMedia,
  };
}

export function parseScriptFile(content: string): ScriptSegment[] {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseJsonScript(trimmed);
  }
  return parseSrtScript(trimmed);
}

function parseJsonScript(content: string): ScriptSegment[] {
  const parsed = JSON.parse(content);

  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const wrapperKey = ['clips', 'scenes', 'segments', 'tracks', 'items'].find(
      (k) => Array.isArray(obj[k]),
    );
    arr = wrapperKey ? (obj[wrapperKey] as unknown[]) : [parsed];
  } else {
    arr = [parsed];
  }

  console.log('[AutoCut] Parsed script JSON:', JSON.stringify(arr, null, 2));

  return (arr as Record<string, unknown>[]).map((item, i) => ({
    sceneId: String(item.sceneId ?? `scene${i + 1}`),
    mediaId: String(item.mediaId ?? ''),
    startTime: Number(item.startTime ?? 0),
    endTime: Number(item.endTime ?? 0),
    text: item.text ? String(item.text) : undefined,
    callout: item.callout ? String(item.callout) : undefined,
    location: item.location ? String(item.location) : undefined,
    date: item.date ? String(item.date) : undefined,
    quote: item.quote ? String(item.quote) : undefined,
    lowerThird: item.lowerThird
      ? {
          name: String((item.lowerThird as Record<string, unknown>).name ?? ''),
          role: (item.lowerThird as Record<string, unknown>).role
            ? String((item.lowerThird as Record<string, unknown>).role)
            : undefined,
        }
      : undefined,
  }));
}

function parseSrtScript(content: string): ScriptSegment[] {
  const blocks = content.split(/\n\s*\n/).filter(Boolean);
  const segments: ScriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines[1];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/,
    );
    if (!match) continue;

    const startSec =
      parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseInt(match[3]) +
      parseInt(match[4]) / 1000;
    const endSec =
      parseInt(match[5]) * 3600 +
      parseInt(match[6]) * 60 +
      parseInt(match[7]) +
      parseInt(match[8]) / 1000;

    const textLines = lines.slice(2);
    const fullText = textLines.join('\n').trim();
    const mediaMatch = fullText.match(/\[media:\s*([^\]]+)\]/);
    const mediaId = mediaMatch ? mediaMatch[1].trim() : '';
    const text = fullText.replace(/\[media:\s*[^\]]+\]/, '').trim() || undefined;

    segments.push({
      sceneId: `scene${segments.length + 1}`,
      mediaId,
      startTime: startSec,
      endTime: endSec,
      text,
    });
  }

  return segments;
}
