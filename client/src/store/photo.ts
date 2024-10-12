import { defineStore } from 'pinia';
import axios from 'axios';
import { getPhotoUrl } from '../utils/photoUtils';

interface Photo {
  _id: string;
  filename: string;
  path: string;
  thumbnailPath: string; // 新增字段
  album: string;
  tags: string[];
  description?: string; // 添加这行，使用可选属性
  takenAt?: string;
  modifiedAt?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    photos: [] as Photo[],
    sortBy: 'uploadedAt' as 'filename' | 'takenAt' | 'modifiedAt' | 'uploadedAt' | 'custom',
    sortOrder: 'desc' as 'asc' | 'desc',
  }),
  getters: {
    sortedPhotos(): Photo[] {
      if (this.sortBy === 'custom') {
        return this.sortOrder === 'asc' ? [...this.photos].reverse() : this.photos;
      }
      return [...this.photos].sort((a, b) => {
        let aValue: string | number, bValue: string | number;
        switch (this.sortBy) {
          case 'filename':
            aValue = a.filename.toLowerCase();
            bValue = b.filename.toLowerCase();
            break;
          case 'takenAt':
            aValue = a.takenAt ? new Date(a.takenAt).getTime() : 0;
            bValue = b.takenAt ? new Date(b.takenAt).getTime() : 0;
            break;
          case 'modifiedAt':
            aValue = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
            bValue = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
            break;
          case 'uploadedAt':
          default:
            aValue = new Date(a.uploadedAt).getTime();
            bValue = new Date(b.uploadedAt).getTime();
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return this.sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
          return this.sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        }
      });
    },
  },
  actions: {
    async fetchPhotos(albumId: string) {
      try {
        console.log('Fetching photos for album:', albumId);
        const response = await axios.get<Photo[]>(`/api/photos/${albumId}`);
        console.log('Fetched photos:', response.data);
        this.photos = response.data;
      } catch (error) {
        console.error('Fetch photos failed:', error);
        throw error;
      }
    },
    async uploadPhotos(albumId: string, formData: FormData, onProgress?: (progress: number) => void) {
      try {
        console.log('Uploading photos to album:', albumId);
        const response = await axios.post<Photo[]>(`/api/photos/${albumId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log('Upload progress:', percentCompleted);
              onProgress && onProgress(percentCompleted);
            }
          },
        });
        console.log('Upload response:', response.data);
        this.photos.unshift(...response.data.map(photo => ({
          ...photo,
          path: getPhotoUrl(photo.path),
          thumbnailPath: getPhotoUrl(photo.thumbnailPath)
        })));
        return response.data;
      } catch (error) {
        console.error('Upload photos failed:', error);
        throw error;
      }
    },
    async deletePhoto(photoId: string) {
      try {
        await axios.delete(`/api/photos/${photoId}`);
        this.photos = this.photos.filter(photo => photo._id !== photoId);
      } catch (error) {
        console.error('Delete photo failed:', error);
        throw error;
      }
    },
    async addTag(photoId: string, tag: string) {
      try {
        const response = await axios.post(`/api/photos/${photoId}/tags`, { tag });
        const updatedPhoto = response.data;
        const index = this.photos.findIndex(p => p._id === photoId);
        if (index !== -1) {
          this.photos[index] = updatedPhoto;
        }
      } catch (error) {
        console.error('Add tag failed:', error);
        throw error;
      }
    },
    async removeTag(photoId: string, tag: string) {
      try {
        const response = await axios.delete(`/api/photos/${photoId}/tags/${tag}`);
        const updatedPhoto = response.data;
        const index = this.photos.findIndex(p => p._id === photoId);
        if (index !== -1) {
          this.photos[index] = updatedPhoto;
        }
      } catch (error) {
        console.error('Remove tag failed:', error);
        throw error;
      }
    },
    async updatePhoto(photoId: string, editedImageData: string) {
      try {
        const response = await axios.put(`/api/photos/${photoId}`, { editedImageData });
        const updatedPhoto = response.data;
        const index = this.photos.findIndex(p => p._id === photoId);
        if (index !== -1) {
          this.photos[index] = updatedPhoto;
        }
      } catch (error) {
        console.error('Update photo failed:', error);
        throw error;
      }
    },
    async renamePhoto(photoId: string, newFilename: string) {
      try {
        const response = await axios.put(`/api/photos/${photoId}/rename`, { filename: newFilename });
        const updatedPhoto = response.data;
        const index = this.photos.findIndex(p => p._id === photoId);
        if (index !== -1) {
          this.photos[index] = updatedPhoto;
        }
      } catch (error) {
        console.error('Rename photo failed:', error);
        throw error;
      }
    },
    async movePhotos(photoIds: string[], targetAlbumId: string) {
      try {
        const response = await axios.post('/api/photos/move', {
          photoIds,
          targetAlbumId
        });
        
        // 从当前相册中移除已移动的照片
        this.photos = this.photos.filter(photo => !photoIds.includes(photo._id));
        
        return {
          success: true,
          movedCount: response.data.movedCount,
          message: response.data.message
        };
      } catch (error: any) {
        console.error('移动照片失败:', error);
        return {
          success: false,
          movedCount: 0,
          message: error.response?.data?.message || '移动照片失败'
        };
      }
    },
    async updatePhotoDescription(photoId: string, description: string) {
      try {
        const response = await axios.put(`/api/photos/${photoId}/description`, { description });
        const updatedPhoto = response.data;
        const index = this.photos.findIndex(p => p._id === photoId);
        if (index !== -1) {
          this.photos[index] = updatedPhoto;
        }
      } catch (error) {
        console.error('Update photo description failed:', error);
        throw error;
      }
    },
    async downloadPhotos(photoIds: string[]) {
      try {
        const response = await axios.post('/api/photos/download', { photoIds }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'photos.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download photos failed:', error);
        throw error;
      }
    },
    async deletePhotos(photoIds: string[]) {
      try {
        console.log('Deleting photos:', photoIds);
        const response = await axios.post('/api/photos/delete', { photoIds });
        console.log('Delete response:', response.data);
        this.photos = this.photos.filter(photo => !photoIds.includes(photo._id));
        return response.data;
      } catch (error) {
        console.error('Delete photos failed:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
        }
        throw error;
      }
    },
    setSortBy(sortBy: 'filename' | 'takenAt' | 'modifiedAt' | 'uploadedAt' | 'custom') {
      if (this.sortBy !== sortBy) {
        this.sortBy = sortBy;
        // 当改变排序方式时,重置排序顺序为降序
        this.sortOrder = 'desc';
      } else {
        // 如果点击相同的排序方式,则切换排序顺序
        this.toggleSortOrder();
      }
    },
    setSortOrder(sortOrder: 'asc' | 'desc') {
      this.sortOrder = sortOrder;
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },
  },
});

// 导出 store 类型
export type PhotoStore = ReturnType<typeof usePhotoStore>;
