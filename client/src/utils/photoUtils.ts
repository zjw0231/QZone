import axios from 'axios';

export function getPhotoUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${axios.defaults.baseURL}${cleanPath}`;
}

export default { getPhotoUrl };
