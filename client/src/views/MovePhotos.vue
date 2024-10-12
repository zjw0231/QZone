<template>
  <div class="move-photos min-h-screen bg-gray-100">
    <!-- 固定在顶部的导航栏 -->
    <div class="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div class="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <button @click="goBack" class="text-blue-500 hover:text-blue-700">
          <i class="el-icon-arrow-left"></i> 返回
        </button>
        <span class="font-semibold">移动到</span>
        <div class="w-8"></div> <!-- 占位，保持标题居中 -->
      </div>
    </div>

    <!-- 为固定顶部栏添加一个占位符 -->
    <div class="h-12"></div>

    <div class="max-w-6xl mx-auto px-4 pt-4">
      <!-- 新建相册按钮 -->
      <el-button @click="showCreateAlbumModal = true" type="primary" class="w-full mb-4">
        <i class="el-icon-plus"></i> 新建相册
      </el-button>

      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索相册"
        prefix-icon="el-icon-search"
        clearable
        class="mb-4"
      />

      <!-- 相册列表 -->
      <ul class="album-list grid grid-cols-2 gap-4">
        <li v-for="album in filteredAlbums" :key="album._id" class="mb-2">
          <el-button @click="moveToAlbum(album._id)" class="w-full h-full text-left p-0 overflow-hidden">
            <div class="relative aspect-square">
              <img 
                :src="getAlbumCoverUrl(album.coverImage || album.firstPhoto)"
                :alt="album.name"
                class="w-full h-full object-cover"
              >
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <div class="font-semibold truncate">{{ album.name }}</div>
                <div class="text-sm">{{ album.photoCount }}张照片</div>
              </div>
            </div>
          </el-button>
        </li>
      </ul>
    </div>

    <!-- 新建相册对话框 -->
    <el-dialog v-model="showCreateAlbumModal" title="新建相册" width="90%" custom-class="create-album-dialog">
      <el-form @submit.prevent="createAlbum">
        <el-form-item label="相册名称">
          <el-input v-model="newAlbumName" required></el-input>
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input type="textarea" v-model="newAlbumDescription"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">创建</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAlbumStore } from '../store/album';
import { usePhotoStore } from '../store/photo';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const albumStore = useAlbumStore();
const photoStore = usePhotoStore();

const searchQuery = ref('');
const showCreateAlbumModal = ref(false);
const newAlbumName = ref('');
const newAlbumDescription = ref('');

const sourceAlbumId = route.params.id as string;
const selectedPhotoIds = (route.query.photos as string[]) || [];

onMounted(async () => {
  await albumStore.fetchAlbums();
});

const filteredAlbums = computed(() => {
  return albumStore.albums.filter(album => 
    album._id !== sourceAlbumId && 
    album.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function goBack() {
  router.push(`/albums/${sourceAlbumId}`);
}

async function moveToAlbum(targetAlbumId: string) {
  try {
    await ElMessageBox.confirm(`确定要将选中的 ${selectedPhotoIds.length} 张照片移动到此相册吗？`, '确认移动', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const result = await photoStore.movePhotos(selectedPhotoIds, targetAlbumId);
    if (result.success) {
      ElMessage.success(`成功移动 ${result.movedCount} 张照片到新相册`);
      router.push(`/albums/${sourceAlbumId}`);
    } else {
      throw new Error(result.message);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`移动照片失败: ${error.message}`);
    }
  }
}

async function createAlbum() {
  try {
    const newAlbum = await albumStore.createAlbum(newAlbumName.value, newAlbumDescription.value);
    showCreateAlbumModal.value = false;
    newAlbumName.value = '';
    newAlbumDescription.value = '';
    ElMessage.success('相册创建成功');
    await moveToAlbum(newAlbum._id);
  } catch (error: any) {
    ElMessage.error(`创建相册失败: ${error.message}`);
  }
}

function getAlbumCoverUrl(path: string | undefined): string {
  if (!path) return ''; // 返回一个默认的图片 URL 或空字符串
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${axios.defaults.baseURL}${cleanPath}`;
}
</script>

<style scoped>
.album-list {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.create-album-dialog {
  margin-top: 20vh;
}

@media (min-width: 640px) {
  .create-album-dialog {
    width: 400px !important;
  }
}
</style>