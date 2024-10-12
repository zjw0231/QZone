import { defineStore } from 'pinia';
import axios from 'axios';

interface Album {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  firstPhoto?: string; // 添加这个字段
  photoCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useAlbumStore = defineStore('album', {
  state: () => ({
    albums: [] as Album[],
    currentAlbum: null as Album | null,
  }),
  actions: {
    async fetchAlbums() {
      try {
        console.log('开始从 API 获取相册...');
        const response = await axios.get<Album[]>('/api/albums');
        console.log('API 响应:', response.data);
        this.albums = response.data;
        console.log('Store 中更新后的相册:', this.albums);
      } catch (error) {
        console.error('获取相册失败:', error);
        throw error;
      }
    },
    async createAlbum(name: string, description: string) {
      try {
        const response = await axios.post<Album>('/api/albums', { name, description });
        this.albums.push(response.data);
        return response.data;
      } catch (error) {
        console.error('Create album failed:', error);
        throw error;
      }
    },
    async fetchAlbum(id: string): Promise<Album | null> {
      try {
        const response = await axios.get<Album>(`/api/albums/${id}`);
        this.currentAlbum = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch album failed:', error);
        throw error;
      }
    },
    async updateAlbum(id: string, albumData: { name: string; description: string; isPublic: boolean }) {
      try {
        const response = await axios.put<Album>(`/api/albums/${id}`, albumData);
        this.currentAlbum = response.data;
        const index = this.albums.findIndex(album => album._id === id);
        if (index !== -1) {
          this.albums[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Update album failed:', error);
        throw error;
      }
    },
    async deleteAlbum(id: string) {
      try {
        await axios.delete(`/api/albums/${id}`);
        this.albums = this.albums.filter(album => album._id !== id);
        if (this.currentAlbum && this.currentAlbum._id === id) {
          this.currentAlbum = null;
        }
      } catch (error) {
        console.error('Delete album failed:', error);
        throw error;
      }
    },
    async setCoverImage(albumId: string, photoId: string) {
      try {
        const response = await axios.put<Album>(`/api/albums/${albumId}/cover/${photoId}`);
        this.currentAlbum = response.data;
        const index = this.albums.findIndex(album => album._id === albumId);
        if (index !== -1) {
          this.albums[index] = response.data;
        }
      } catch (error) {
        console.error('Set cover image failed:', error);
        throw error;
      }
    },
    async sortPhotos(albumId: string, photoIds: string[]) {
      try {
        await axios.put(`/api/albums/${albumId}/sort`, { photoIds });
      } catch (error) {
        console.error('Sort photos failed:', error);
        throw error;
      }
    },
  },
});

// 导出 store 类型
export type AlbumStore = ReturnType<typeof useAlbumStore>;