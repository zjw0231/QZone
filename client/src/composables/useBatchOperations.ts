import { ref, Ref } from 'vue';
import { usePhotoSelection } from './usePhotoSelection';

interface Photo {
  _id: string;
  // 其他属性...
}

export function useBatchOperations(photos: Ref<Photo[]>, showBatchOperations: Ref<boolean>) {
  const {
    selectedPhotos,
    setSelectedPhotos,
    clearSelectedPhotos,
    isSelecting,
    togglePhotoSelection,
    handleTouchStart: onTouchStart,
    handleTouchMove: onTouchMove,
    handleTouchEnd: onTouchEnd
  } = usePhotoSelection(photos, showBatchOperations);

  const initialMoveDirection = ref<'horizontal' | 'vertical' | null>(null);
  const touchStartX = ref(0);
  const touchStartY = ref(0);
  const autoScrollSpeed = ref(0);
  const autoScrollRAF = ref<number | null>(null);

  function handleTouchStart(event: TouchEvent, photo: Photo) {
    if (showBatchOperations.value) {
      touchStartX.value = event.touches[0].clientX;
      touchStartY.value = event.touches[0].clientY;
      initialMoveDirection.value = null;
      onTouchStart(event, photo);
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (showBatchOperations.value) {
      if (initialMoveDirection.value === null) {
        const deltaX = Math.abs(event.touches[0].clientX - touchStartX.value);
        const deltaY = Math.abs(event.touches[0].clientY - touchStartY.value);
        
        if (deltaX > 10 || deltaY > 10) {
          initialMoveDirection.value = deltaX > deltaY ? 'horizontal' : 'vertical';
        }
      }

      if (initialMoveDirection.value === 'horizontal') {
        event.preventDefault(); // 防止页面滚动
        onTouchMove(event);
        handleAutoScroll(event);
      } else if (initialMoveDirection.value === 'vertical') {
        handleAutoScroll(event);
      }
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (showBatchOperations.value) {
      if (initialMoveDirection.value === 'horizontal') {
        onTouchEnd();
      }
    }
    stopAutoScroll();
    initialMoveDirection.value = null;
  }

  function handleAutoScroll(event: TouchEvent) {
    const touch = event.touches[0];
    const scrollThreshold = 150;
    const maxScrollSpeed = 10;

    const scrollContainer = document.querySelector('.album-detail');
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const distanceFromTop = touch.clientY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - touch.clientY;

    if (distanceFromTop < scrollThreshold) {
      autoScrollSpeed.value = -((scrollThreshold - distanceFromTop) / scrollThreshold) * maxScrollSpeed;
    } else if (distanceFromBottom < scrollThreshold) {
      autoScrollSpeed.value = ((scrollThreshold - distanceFromBottom) / scrollThreshold) * maxScrollSpeed;
    } else {
      autoScrollSpeed.value = 0;
    }

    if (autoScrollSpeed.value !== 0 && autoScrollRAF.value === null) {
      autoScrollRAF.value = requestAnimationFrame(performAutoScroll);
    }
  }

  function performAutoScroll() {
    const scrollContainer = document.querySelector('.album-detail');
    if (scrollContainer && autoScrollSpeed.value !== 0) {
      scrollContainer.scrollTop += autoScrollSpeed.value;
      autoScrollRAF.value = requestAnimationFrame(performAutoScroll);
    } else {
      stopAutoScroll();
    }
  }

  function stopAutoScroll() {
    if (autoScrollRAF.value !== null) {
      cancelAnimationFrame(autoScrollRAF.value);
      autoScrollRAF.value = null;
    }
    autoScrollSpeed.value = 0;
  }

  return {
    selectedPhotos,
    setSelectedPhotos,
    clearSelectedPhotos,
    isSelecting,
    togglePhotoSelection,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

// 确保文件作为模块导出
export default useBatchOperations;