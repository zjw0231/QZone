import { ref, computed } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

interface Photo {
  _id: string;
  filename: string;
  path: string;
  // ... 其他属性
}

export function usePhotoViewer(props: {
  photos: Photo[];
  initialIndex: number;
  preloadCount: number;
}) {
  const currentIndex = ref(props.initialIndex);
  const touchStartX = ref(0);
  const touchMoveX = ref(0);
  const sliderOffset = ref(0);
  const isDragging = ref(false);
  const animationFrame = ref<number | null>(null);

  const visiblePhotos = computed(() => props.photos);

  const photoWrapperStyle = computed(() => ({
    display: 'flex',
    transform: `translateX(calc(-100% * ${currentIndex.value} + ${sliderOffset.value}px))`,
    transition: isDragging.value ? 'none' : 'transform 0.1s cubic-bezier(0.1, 0, 0.1, 1)',
  }));

  function handleTouchStart(event: TouchEvent) {
    touchStartX.value = event.touches[0].clientX;
    touchMoveX.value = touchStartX.value;
    isDragging.value = true;
    cancelAnimationFrame(animationFrame.value!);
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging.value) return;
    touchMoveX.value = event.touches[0].clientX;
    const diff = touchMoveX.value - touchStartX.value;
    
    animationFrame.value = requestAnimationFrame(() => {
      sliderOffset.value = diff;
    });
  }

  function handleTouchEnd() {
    const diff = touchMoveX.value - touchStartX.value;
    const threshold = window.innerWidth * 0.05;

    isDragging.value = false;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex.value > 0) {
        animateSliderOffset(diff, window.innerWidth, () => goToPreviousPhoto());
      } else if (diff < 0 && currentIndex.value < props.photos.length - 1) {
        animateSliderOffset(diff, -window.innerWidth, () => goToNextPhoto());
      } else {
        animateSliderOffset(diff, 0);
      }
    } else {
      animateSliderOffset(diff, 0);
    }
  }

  function animateSliderOffset(from: number, to: number, callback?: () => void) {
    const start = performance.now();
    const duration = 100;

    function animate(time: number) {
      const timeFraction = (time - start) / duration;
      if (timeFraction >= 1) {
        sliderOffset.value = 0;
        if (callback) {
          callback();
        }
        return;
      }

      const progress = easeOutQuint(timeFraction);
      sliderOffset.value = from + (to - from) * progress;
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5);
  }

  function goToPreviousPhoto() {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      preloadImages();
    }
  }

  function goToNextPhoto() {
    if (currentIndex.value < props.photos.length - 1) {
      currentIndex.value++;
      preloadImages();
    }
  }

  function preloadImages() {
    const preloadStart = Math.max(0, currentIndex.value - props.preloadCount);
    const preloadEnd = Math.min(props.photos.length, currentIndex.value + props.preloadCount + 1);
    
    for (let i = preloadStart; i < preloadEnd; i++) {
      const img = new Image();
      img.src = getPhotoUrl(props.photos[i].path);
    }
  }

  function getPhotoUrl(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${axios.defaults.baseURL}${cleanPath}`;
  }

  async function downloadPhoto(photo: Photo) {
    try {
      const response = await axios.get(`/api/photos/${photo._id}/download`, {
        responseType: 'blob'
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameRegex = /filename\*=UTF-8''([\w%.-]+)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = decodeURIComponent(matches[1]);
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
      
      ElMessage.success('照片下载成功');
    } catch (error) {
      console.error('下载照片失败:', error);
      ElMessage.error('下载照片失败，请重试');
    }
  }

  return {
    currentIndex,
    visiblePhotos,
    photoWrapperStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    goToPreviousPhoto,
    goToNextPhoto,
    getPhotoUrl,
    downloadPhoto,
    preloadImages,
  };
}