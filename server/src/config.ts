import path from 'path';

export const PHOTO_STORAGE_PATH = 'G:\\QZonePhoto';
export const UPLOADS_BASE_URL = '/uploads';

export function getPhotoPath(filename: string): string {
  return path.join(PHOTO_STORAGE_PATH, filename);
}

export function getPhotoUrl(filename: string): string {
  return `${UPLOADS_BASE_URL}/${filename}`;
}
