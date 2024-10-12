import { ref } from 'vue';
import { usePhotoStore } from '../store/photo';
import { useAlbumStore } from '../store/album';
import { ElMessage } from 'element-plus';

export function usePhotoUpload(albumId: string) {
  const photoStore = usePhotoStore();
  const albumStore = useAlbumStore();
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  async function uploadPhotos(files: File[]) {
    if (!files.length) return;

    isUploading.value = true;
    uploadProgress.value = 0;

    try {
      await photoStore.uploadPhotos(albumId, files, (progress) => {
        uploadProgress.value = progress;
      });
      await albumStore.fetchAlbum(albumId);
      await photoStore.fetchPhotos(albumId);
      ElMessage.success('上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    } finally {
      isUploading.value = false;
    }
  }

  return {
    isUploading,
    uploadProgress,
    uploadPhotos,
  };
}