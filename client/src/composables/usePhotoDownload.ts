import { ref } from 'vue';
import axios from 'axios';

export function usePhotoDownload() {
  const isDownloading = ref(false);
  const error = ref<string | null>(null);

  const downloadPhoto = async (photoId: string) => {
    isDownloading.value = true;
    error.value = null;

    try {
      const response = await axios({
        url: `${axios.defaults.baseURL}/api/photos/${photoId}/download`,
        method: 'GET',  // 确保这里是 GET
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'photo.jpg'; // 默认文件名
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          const fallbackMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (fallbackMatch && fallbackMatch[1]) {
            filename = decodeURIComponent(fallbackMatch[1].replace(/['"]/g, ''));
          }
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('下载照片时出错:', err);
      error.value = '下载照片失败，请重试';
    } finally {
      isDownloading.value = false;
    }
  };

  return {
    downloadPhoto,
    isDownloading,
    error,
  };
}
