<template>
  <div class="album-detail">
    <!-- 固定在顶部的导航栏 -->
    <div class="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div class="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <template v-if="!showBatchOperations">
          <router-link to="/albums" class="text-blue-500 hover:text-blue-700">
            <i class="el-icon-arrow-left"></i> 返回相册列表
          </router-link>
          <div class="flex items-center space-x-4">
            <el-button @click="toggleBatchOperations" type="primary" size="small">
              批量操作
            </el-button>
            <el-dropdown @command="handleSort" trigger="click">
              <el-button type="info" size="small">
                {{ currentSortLabel }} <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-for="option in sortOptions" 
                    :key="option.value" 
                    :command="option.value"
                    :class="{ 'text-blue-500': photoStore.sortBy === option.value }"
                  >
                    {{ option.label }}
                    <i v-if="photoStore.sortBy === option.value" 
                       :class="photoStore.sortOrder === 'asc' ? 'el-icon-sort-up' : 'el-icon-sort-down'">
                    </i>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="toggleSortOrder" size="small">
              {{ photoStore.sortOrder === 'asc' ? '升序' : '降序' }}
              <i :class="photoStore.sortOrder === 'asc' ? 'el-icon-sort-up' : 'el-icon-sort-down'"></i>
            </el-button>
          </div>
        </template>
        <template v-else>
          <button @click="toggleBatchOperations" class="text-blue-500">
            取消
          </button>
          <span>已选择({{ selectedPhotos.length }})</span>
          <button @click="selectAll" class="text-blue-500">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </button>
        </template>
      </div>
    </div>

    <!-- 为固定顶部栏添加一个占位符 -->
    <div class="h-16"></div>

    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-8" v-if="!showBatchOperations">
        <h2 class="text-3xl font-bold mb-2">{{ album?.name }}</h2>
        <p class="text-gray-600 mb-2">{{ album?.description }}</p>
        <p class="text-sm text-gray-500">{{ photos.length }} 张照片</p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="mb-4 flex justify-between items-center" v-if="!showBatchOperations">
        <input
          type="file"
          @change="handleFileUpload"
          multiple
          accept="image/*,video/*"
          ref="fileInput"
          class="hidden"
        >
        <button
          @click="openFileSelector"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          上传照片/视频
        </button>
      </div>
      
      <!-- 照片网格 -->
      <div class="photo-grid mb-16">
        <div 
          v-for="(photo, index) in photoStore.sortedPhotos" 
          :key="photo._id" 
          class="photo-item"
          :data-photo-id="photo._id"
          @touchstart="handleTouchStart($event, photo)"
          @touchmove="handleTouchMove($event)"
          @touchend="handleTouchEnd($event)"
          @touchcancel="handleTouchEnd($event)"
          @click="handlePhotoClick(index, photo)"
        >
          <img 
            :src="getPhotoUrl(photo.thumbnailPath)" 
            :alt="photo.filename" 
            class="photo-image"
            draggable="false"
          >
          <div 
            v-if="showBatchOperations"
            class="select-indicator"
            :class="{ 'selected': selectedPhotos.includes(photo._id) }"
          >
            <el-icon v-if="selectedPhotos.includes(photo._id)" class="text-white" :size="14">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 上传按钮 -->
      <div class="upload-button" @click="openFileSelector" v-if="!showBatchOperations">
        <i class="el-icon-plus"></i>
      </div>

      <!-- 底部编辑栏 -->
      <div class="fixed-bottom-bar" :class="{ 'hidden': isBottomBarHidden || showBatchOperations }">
        <div class="function-bar">
          <el-button @click="editAlbum">编辑相册</el-button>
          <el-button @click="shareAlbum">分享相册</el-button>
          <el-button @click="downloadAlbum">下载相册</el-button>
          <el-button @click="deleteAlbum" type="danger">删除相册</el-button>
        </div>
      </div>

      <!-- 批量操作底部栏 -->
      <div v-if="showBatchOperations" class="fixed-bottom-bar">
        <div class="function-bar">
          <el-button @click="moveSelectedPhotos">转移</el-button>
          <el-button @click="downloadSelectedPhotos">下载</el-button>
          <el-button @click="deleteSelectedPhotos" type="danger">删除</el-button>
        </div>
      </div>

      <!-- 照片查看器 -->
      <PhotoViewer
        v-if="showPhotoViewer"
        v-model:visible="showPhotoViewer"
        :photos="photoStore.sortedPhotos"
        :initialIndex="currentPhotoIndex"
        :albumName="album?.name || ''"
        :albumId="albumId"
        @photoDeleted="handlePhotoDeleted"
        @update:currentIndex="updateCurrentPhotoIndex"
        :preloadCount="3"
      />
    </div>

    <!-- 上传进度提示 -->
    <el-dialog v-model="showUploadProgress" title="上传进度" width="300px">
      <el-progress :percentage="uploadProgress" :format="formatProgress"></el-progress>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadProgress = false" :disabled="uploadProgress < 100">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlbumStore } from '../store/album';
import { usePhotoStore } from '../store/photo';
import useBatchOperations from '../composables/useBatchOperations';
import { usePhotoUpload } from '../composables/usePhotoUpload';
import PhotoViewer from '../components/PhotoViewer.vue';
import { ElMessage, ElMessageBox, ElProgress } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { getPhotoUrl } from '@/utils/photoUtils';  // 修改这行
import axios from 'axios';

// 添加 Photo 接口定义
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

const route = useRoute();
const router = useRouter();
const albumStore = useAlbumStore();
const photoStore = usePhotoStore();

const albumId = route.params.id as string;
const { currentAlbum: album } = storeToRefs(albumStore);
const { photos } = storeToRefs(photoStore);

const showPhotoViewer = ref(false);
const currentPhotoIndex = ref(0);
const showBatchOperations = ref(false);
const isBottomBarHidden = ref(false);
const currentSortMethod = ref('custom');
const sortOrder = ref('desc');

const { 
  selectedPhotos, 
  setSelectedPhotos,
  clearSelectedPhotos,
  isSelecting,
  togglePhotoSelection,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd
} = useBatchOperations(computed(() => photoStore.sortedPhotos), showBatchOperations);

const { isUploading, uploadProgress, uploadPhotos } = usePhotoUpload(albumId);
const showUploadProgress = ref(false);

const lastScrollPosition = ref(0);

onMounted(async () => {
  await albumStore.fetchAlbum(albumId);
  await photoStore.fetchPhotos(albumId);
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// 添加排序选项
const sortOptions = [
  { label: '个性化排序', value: 'custom' },
  { label: '文件名排序', value: 'filename' },
  { label: '拍摄时间排序', value: 'takenAt' },
  { label: '修改时间排序', value: 'modifiedAt' },
  { label: '上传时间排序', value: 'uploadedAt' },
];

const currentSortLabel = computed(() => {
  const currentOption = sortOptions.find(option => option.value === photoStore.sortBy);
  return currentOption ? currentOption.label : '排序';
});

function handleSort(command: string) {
  photoStore.setSortBy(command as 'filename' | 'takenAt' | 'modifiedAt' | 'uploadedAt' | 'custom');
}

function toggleSortOrder() {
  photoStore.toggleSortOrder();
}

function handleScroll() {
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  isBottomBarHidden.value = currentScrollPosition > lastScrollPosition.value;
  lastScrollPosition.value = currentScrollPosition;
}

function updateCurrentPhotoIndex(newIndex: number) {
  currentPhotoIndex.value = newIndex;
}

async function handleFileUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files) {
    showUploadProgress.value = true;
    uploadProgress.value = 0;
    try {
      console.log('Starting file upload...', files);
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        console.log(`Appending file ${index}:`, file.name, file.type, file.size);
        formData.append('photos', file);
      });
      console.log('FormData created:', formData);
      await photoStore.uploadPhotos(albumId, formData, (progress) => {
        uploadProgress.value = progress;
        console.log('Upload progress:', progress);
      });
      console.log('File upload completed successfully');
      ElMessage.success('上传成功');
      await photoStore.fetchPhotos(albumId);
    } catch (error) {
      console.error('上传失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('错误响应:', error.response?.data);
        console.error('错误状态:', error.response?.status);
      }
      ElMessage.error('上传失败，请重试');
    } finally {
      showUploadProgress.value = false;
    }
  } else {
    console.log('No files selected');
  }
}

function openFileSelector() {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  fileInput?.click();
}

function toggleBatchOperations() {
  showBatchOperations.value = !showBatchOperations.value;
  if (!showBatchOperations.value) {
    clearSelectedPhotos();
  }
}

function editAlbum() {
  router.push({ name: 'EditAlbum', params: { id: albumId } });
}

function shareAlbum() {
  console.log('分享相册');
}

function downloadAlbum() {
  console.log('下载相册');
}

function deleteAlbum() {
  console.log('删除相册');
}

function handlePhotoDeleted(photoId: string) {
  photos.value = photos.value.filter(photo => photo._id !== photoId);
}

// 实现移动选中照片的逻辑
function moveSelectedPhotos() {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择要移动的照片');
    return;
  }
  router.push({
    name: 'MovePhotos',
    params: { id: albumId },
    query: { photos: selectedPhotos.value }
  });
}

// 实现下载选中照片的逻辑
async function downloadSelectedPhotos() {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择要下载的照片');
    return;
  }
  try {
    await photoStore.downloadPhotos(selectedPhotos.value);
    ElMessage.success('照片下载成功');
  } catch (error) {
    console.error('下载照片失败:', error);
    ElMessage.error('下载照片失败，请重试');
  }
}

// 实现删除选中照片的逻辑
async function deleteSelectedPhotos() {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择要删除的照片');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedPhotos.value.length} 张照片吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    console.log('Deleting selected photos:', selectedPhotos.value);
    const result = await photoStore.deletePhotos(selectedPhotos.value);
    console.log('Delete result:', result);
    ElMessage.success(`成功删除 ${result.deletedCount} 张照片`);
    clearSelectedPhotos();
    await photoStore.fetchPhotos(albumId);
  } catch (error) {
    console.error('删除照片失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
    }
    ElMessage.error('删除照片失败，请重试');
  }
}

// 添加这个计算属性
const isAllSelected = computed(() => {
  return selectedPhotos.value.length === photoStore.sortedPhotos.length;
});

// 添加这个方法
function selectAll() {
  if (isAllSelected.value) {
    clearSelectedPhotos();
  } else {
    setSelectedPhotos(photoStore.sortedPhotos.map(photo => photo._id));
  }
}

function handlePhotoClick(index: number, photo: Photo) {
  if (showBatchOperations.value) {
    togglePhotoSelection(photo._id);
  } else {
    currentPhotoIndex.value = photoStore.sortedPhotos.findIndex(p => p._id === photo._id);
    showPhotoViewer.value = true;
  }
}

function formatProgress(percentage: number): string {
  if (percentage === 100) {
    return '上传完成，正处理...';
  }
  return `${percentage}%`;
}

// ... 其他必要的方法
</script>

<style lang="scss">
@import '../styles/albumDetail.scss';
</style>