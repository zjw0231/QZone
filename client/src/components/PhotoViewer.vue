<template>
  <el-dialog 
    :modelValue="visible" 
    @update:modelValue="$emit('update:visible', $event)"
    fullscreen 
    custom-class="photo-viewer-dialog"
    :show-close="false"
  >
    <div class="photo-viewer" @click="close">
      <!-- 顶部导航栏 -->
      <div class="top-bar">
        <div class="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
          <button @click.stop="close" class="text-white hover:text-gray-300">
            <i class="el-icon-arrow-left"></i> 返回
          </button>
          <span class="font-semibold text-white">{{ currentIndex + 1 }}/{{ photos.length }}</span>
          <div class="w-8"></div> <!-- 占位，保持标题居中 -->
        </div>
      </div>

      <!-- 照片容器 -->
      <div 
        class="photo-container"
        @touchstart.stop="handleTouchStart"
        @touchmove.stop="handleTouchMove"
        @touchend.stop="handleTouchEnd"
      >
        <div class="photo-wrapper" :style="photoWrapperStyle">
          <div v-for="(photo, index) in visiblePhotos" :key="photo._id" class="photo-item">
            <img 
              :src="getPhotoUrl(photo.path)" 
              :alt="photo.filename" 
              class="viewed-photo" 
              :style="getImageStyle(index)"
              @load="onImageLoad($event, index)"
              @error="onImageError($event, index)"
            >
          </div>
        </div>
      </div>

      <!-- 底部控制栏 -->
      <div class="bottom-bar" @click.stop>
        <div class="function-bar">
          <el-button @click="zoomIn">放大</el-button>
          <el-button @click="zoomOut">缩小</el-button>
          <el-button @click="resetZoom">重置</el-button>
          <el-button @click="rotateImage">旋转</el-button>
          <el-button @click="toggleMoreOptions">更多操作</el-button>
          <el-button @click="handleDownloadPhoto">下载原图</el-button>
        </div>
      </div>

      <!-- 更多操作弹出层 -->
      <el-drawer
        v-model="showMoreOptions"
        direction="btt"
        size="auto"
        custom-class="more-options-drawer"
      >
        <div class="more-options-content">
          <el-button @click="setAsCover">设为封面</el-button>
          <el-button @click="moveToAlbum">移动到相册</el-button>
          <el-button @click="editPhoto">编辑照片</el-button>
          <el-button @click="deletePhoto" type="danger">删除照片</el-button>
          <el-button @click="renamePhoto">重命名照片</el-button>
          <el-button @click="togglePhotoInfo">查看照片信息</el-button>
        </div>
      </el-drawer>

      <!-- 照片信息弹出框 -->
      <el-dialog
        v-model="showPhotoInfo"
        title="照片信息"
        width="30%"
        append-to-body
      >
        <p><strong>文件名:</strong> {{ currentPhoto.filename }}</p>
        <p><strong>上传时间:</strong> {{ formatDate(currentPhoto.createdAt) }}</p>
        <p><strong>描述:</strong> {{ currentPhoto.description || '无' }}</p>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editDescription">
              {{ currentPhoto.description ? '编辑描述' : '添加描述' }}
            </el-button>
            <el-button @click="showPhotoInfo = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 照片描辑弹出框 -->
      <el-dialog
        v-model="showDescriptionEdit"
        title="编辑照片描述"
        width="30%"
        append-to-body
      >
        <el-input
          v-model="editingDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入照片描述"
        ></el-input>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelEditDescription">取消</el-button>
            <el-button type="primary" @click="saveDescription">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { usePhotoStore } from '../store/photo';
import { useAlbumStore } from '../store/album';
import { usePhotoViewer } from '../composables/usePhotoViewer';
import axios from 'axios';
import { getPhotoUrl } from '../utils/photoUtils';

interface Photo {
  _id: string;
  filename: string;
  path: string;
  thumbnailPath: string;
  album: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  visible: boolean;
  photos: Photo[];
  initialIndex: number;
  albumName: string;
  albumId: string;
  preloadCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:currentIndex', value: number): void;
  (e: 'photoDeleted', photoId: string): void;
}>();

const photoStore = usePhotoStore();
const albumStore = useAlbumStore();

const showControls = ref(true);
const showPhotoInfo = ref(false);
const showDescriptionEdit = ref(false);
const zoomLevel = ref(1);
const rotation = ref(0);
const editingDescription = ref('');

const showMoreOptions = ref(false);

const {
  currentIndex,
  visiblePhotos,
  photoWrapperStyle,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  goToPreviousPhoto,
  goToNextPhoto,
  downloadPhoto,
  preloadImages,
} = usePhotoViewer({
  photos: props.photos,
  initialIndex: props.initialIndex,
  preloadCount: props.preloadCount,
});

const loadedImages = ref<Set<number>>(new Set());
const fullSizeLoadedImages = ref<Set<number>>(new Set());
const failedImages = ref<Set<number>>(new Set());

const touchStartX = ref(0);
const touchMoveX = ref(0);
const sliderOffset = ref(0);
const isDragging = ref(false);
const animationFrame = ref<number | null>(null);

const getPhotoItemStyle = (index: number) => ({
  flex: '0 0 100%',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const getImageStyle = (index: number) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain' as const,
  opacity: loadedImages.value.has(index) ? 1 : 0,
  transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
  transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg)`,
});

function getThumbnailUrl(photo: Photo) {
  return `${axios.defaults.baseURL}/api/photos/${photo._id}?width=200&quality=60`;
}

function getFullSizeUrl(photo: Photo) {
  return `${axios.defaults.baseURL}/api/photos/${photo._id}?quality=90`;
}

function onImageLoad(event: Event, index: number) {
  loadedImages.value.add(index);
  const img = event.target as HTMLImageElement;
  if (img.src === img.dataset.src) {
    fullSizeLoadedImages.value.add(index);
  } else {
    // 加载高质量图片
    const fullSizeImg = new Image();
    fullSizeImg.src = img.dataset.src || '';
    fullSizeImg.onload = () => {
      img.src = fullSizeImg.src;
      fullSizeLoadedImages.value.add(index);
    };
  }
}

function onImageError(event: Event, index: number) {
  console.error('Image failed to load:', index);
  failedImages.value.add(index);
}

watch(currentIndex, () => {
  preloadImages();
});

onMounted(() => {
  console.log('PhotoViewer mounted. Initial photos:', props.photos);
  preloadImages();
  setCustomViewportHeight();
  window.addEventListener('resize', setCustomViewportHeight);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.src !== img.dataset.src) {
          img.src = img.dataset.src || '';
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });

  const images = document.querySelectorAll('.viewed-photo');
  images.forEach((img) => observer.observe(img));
});

onUnmounted(() => {
  window.removeEventListener('resize', setCustomViewportHeight);
});

watch(() => props.initialIndex, (newIndex) => {
  currentIndex.value = newIndex;
});

const currentPhoto = computed(() => props.photos[currentIndex.value]);

const imageStyle = computed(() => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain' as const,
  transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg)`,
}));

function close() {
  emit('update:visible', false);
}

function toggleControls() {
  showControls.value = !showControls.value;
}

function togglePhotoInfo() {
  showPhotoInfo.value = !showPhotoInfo.value;
}

function resetSlider() {
  sliderOffset.value = 0;
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3);
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.1);
}

function resetZoom() {
  zoomLevel.value = 1;
  rotation.value = 0;
}

function rotateImage() {
  rotation.value = (rotation.value + 90) % 360;
}

function handleZoom(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  zoomLevel.value = Math.max(0.1, Math.min(zoomLevel.value + delta, 3));
}

function editPhoto() {
  // 实现编辑照片逻辑
}

function setAsCover() {
  albumStore.setCoverImage(props.albumId, currentPhoto.value._id);
  ElMessage.success('已置为封面');
}

function moveToAlbum() {
  // 现移动到相册的逻辑
  // 这可能要打开一个新的对话框来选择目标相册
  console.log('移动到相册功能待实现');
}

async function deletePhoto() {
  try {
    await ElMessageBox.confirm('确定要删除这张照片吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await photoStore.deletePhoto(currentPhoto.value._id);
    emit('photoDeleted', currentPhoto.value._id);
    ElMessage.success('照片删除成功');
    if (props.photos.length === 1) {
      close();
    } else {
      goToNextPhoto();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除照片失败');
    }
  }
}

function renamePhoto() {
  // 实现重命名照片逻辑
}

function editDescription() {
  editingDescription.value = currentPhoto.value.description || '';
  showDescriptionEdit.value = true;
}

async function saveDescription() {
  try {
    await photoStore.updatePhotoDescription(currentPhoto.value._id, editingDescription.value);
    showDescriptionEdit.value = false;
    ElMessage.success('描述更新成功');
  } catch (error) {
    ElMessage.error('更新描述失败');
  }
}

function cancelEditDescription() {
  showDescriptionEdit.value = false;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

function toggleMoreOptions() {
  showMoreOptions.value = !showMoreOptions.value;
}

// 添加这个函数来设自定义视口高度
function setCustomViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// 更新 downloadPhoto 函数
function handleDownloadPhoto() {
  downloadPhoto(currentPhoto.value);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PhotoViewer',
});
</script>

<style scoped lang="scss">
.photo-viewer-dialog {
  background: rgba(0, 0, 0, 0.9);
  :deep(.el-dialog__body) {
    padding: 0;
    margin: 0;
    overflow: hidden;
    height: 100vh; /* 回退方案 */
    height: calc(var(--vh, 1vh) * 100);
    width: 100vw;
  }
  :deep(.el-dialog__header) {
    display: none;
  }
}

.photo-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: #000;
  height: 100vh; /* 回退方案 */
  height: calc(var(--vh, 1vh) * 100);
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.photo-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: pan-y;
}

.photo-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  will-change: transform;
}

.photo-item {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.viewed-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform, opacity;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  font-size: 2rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 40;
}

.left-button {
  left: 1rem;
}

.right-button {
  right: 1rem;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  z-index: 50;
}

.function-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.more-options-drawer {
  :deep(.el-drawer__body) {
    padding: 20px;
  }
}

.more-options-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.5rem;
  background-color: rgba(0, 0, 0, 0.5);
}

.viewed-photo.loading {
  filter: blur(10px);
  transition: filter 0.3s;
}
</style>