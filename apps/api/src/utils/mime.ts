const MIME_CATEGORIES: Record<string, string[]> = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'image/tiff',
    'image/bmp',
    'image/x-icon',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ],
  audio: [
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/aac',
    'audio/flac',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/html',
    'text/markdown',
    'application/json',
    'application/xml',
  ],
  font: [
    'font/woff',
    'font/woff2',
    'font/ttf',
    'font/otf',
    'application/font-woff',
    'application/font-woff2',
  ],
  archive: [
    'application/zip',
    'application/gzip',
    'application/x-tar',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
  ],
};

export function getMimeCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(MIME_CATEGORIES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'other';
}

export function isImage(mimeType: string): boolean {
  return getMimeCategory(mimeType) === 'image';
}

export function isTransformable(mimeType: string): boolean {
  const transformable = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif'];
  return transformable.includes(mimeType);
}

export function isVideo(mimeType: string): boolean {
  return getMimeCategory(mimeType) === 'video';
}

export function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
    'image/tiff': '.tiff',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/pdf': '.pdf',
    'application/json': '.json',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'font/woff2': '.woff2',
    'font/woff': '.woff',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'application/zip': '.zip',
  };
  return map[mimeType] || '';
}

export const ALLOWED_MIME_TYPES = Object.values(MIME_CATEGORIES).flat();
