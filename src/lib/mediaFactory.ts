import type { MediaAsset } from '@/types';
import { getMediaDimensions } from '@/lib/mediaUtils';

export function generateId(): string {
  return `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createMediaAsset(file: File): Promise<MediaAsset> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  const url = URL.createObjectURL(file);
  const dims = await getMediaDimensions(file, isImage ? 'image' : 'video');

  return {
    id: generateId(),
    name: file.name,
    kind: isImage ? 'image' : 'video',
    url,
    durationSec: dims.duration,
    width: dims.width,
    height: dims.height,
    file,
  };
}
