export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Music';
  if (mimeType.includes('pdf')) return 'FileText';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Sheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
  if (mimeType.includes('font')) return 'Type';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'Archive';
  if (mimeType.startsWith('text/')) return 'FileCode';
  return 'File';
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf'
  );
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function getAcceptedMimeTypes(): string {
  return [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.*',
    'application/vnd.ms-*',
    'text/*',
    'font/*',
    'application/zip',
    'application/gzip',
    'application/json',
  ].join(',');
}

export function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Images';
  if (mimeType.startsWith('video/')) return 'Videos';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text'))
    return 'Documents';
  if (mimeType.includes('font')) return 'Fonts';
  if (mimeType.includes('zip') || mimeType.includes('tar')) return 'Archives';
  return 'Other';
}
