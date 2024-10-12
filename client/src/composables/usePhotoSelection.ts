import { ref, Ref, computed } from 'vue';

// 定义 Photo 接口
interface Photo {
  _id: string;
  // 其他属性...
}

export function usePhotoSelection(photos: Ref<Photo[]>, showBatchOperations: Ref<boolean>) {
  const selectedPhotosRef = ref<string[]>([]);
  const currentlySelectingPhotos = ref<string[]>([]);
  let touchStartIndex = -1;
  const isSelecting = ref(false);
  let startSelected = false;

  const togglePhotoSelection = (photoId: string) => {
    const index = selectedPhotosRef.value.indexOf(photoId);
    if (index === -1) {
      selectedPhotosRef.value.push(photoId);
    } else {
      selectedPhotosRef.value.splice(index, 1);
    }
  };

  const handleTouchStart = (event: TouchEvent, photo: Photo) => {
    touchStartIndex = photos.value.findIndex(p => p._id === photo._id);
    startSelected = selectedPhotosRef.value.includes(photo._id);
    currentlySelectingPhotos.value = [photo._id];
    isSelecting.value = false;
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const photoElement = element?.closest('.photo-item');
    if (photoElement) {
      const currentIndex = Array.from(photoElement.parentElement!.children).indexOf(photoElement);
      updateSelection(currentIndex);
    }
  };

  const handleTouchEnd = () => {
    if (isSelecting.value && currentlySelectingPhotos.value.length > 0) {
      currentlySelectingPhotos.value.forEach(photoId => {
        if (startSelected) {
          selectedPhotosRef.value = selectedPhotosRef.value.filter(id => id !== photoId);
        } else if (!selectedPhotosRef.value.includes(photoId)) {
          selectedPhotosRef.value.push(photoId);
        }
      });
    } else if (!isSelecting.value) {
      const photoId = currentlySelectingPhotos.value[0];
      togglePhotoSelection(photoId);
    }
    currentlySelectingPhotos.value = [];
    isSelecting.value = false;
    touchStartIndex = -1;
  };

  const updateSelection = (currentIndex: number) => {
    isSelecting.value = true;
    const minIndex = Math.min(touchStartIndex, currentIndex);
    const maxIndex = Math.max(touchStartIndex, currentIndex);
    
    currentlySelectingPhotos.value = photos.value
      .slice(minIndex, maxIndex + 1)
      .map(p => p._id);
  };

  const displaySelectedPhotos = computed(() => {
    if (isSelecting.value) {
      return startSelected
        ? selectedPhotosRef.value.filter(id => !currentlySelectingPhotos.value.includes(id))
        : [...new Set([...selectedPhotosRef.value, ...currentlySelectingPhotos.value])];
    }
    return selectedPhotosRef.value;
  });

  const clearSelectedPhotos = () => {
    selectedPhotosRef.value = [];
  };

  const setSelectedPhotos = (photoIds: string[]) => {
    selectedPhotosRef.value = photoIds;
  };

  return {
    selectedPhotos: displaySelectedPhotos,
    setSelectedPhotos,
    clearSelectedPhotos,
    isSelecting,
    togglePhotoSelection,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}