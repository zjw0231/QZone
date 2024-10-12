<template>
  <div class="albums p-4 bg-blue-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">我的相册</h2>
      <div class="mb-4 flex justify-between items-center">
        <button @click="showCreateAlbumModal = true" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
          创建相册
        </button>
        <div class="flex items-center space-x-4">
          <select v-model="sortBy" @change="sortAlbums" class="p-2 border rounded">
            <option value="name">按名称排序</option>
            <option value="date">按创建日期排序</option>
            <option value="photoCount">按照片数量排序</option>
          </select>
          <input v-model="searchQuery" @input="searchAlbums" placeholder="搜索相册" class="p-2 border rounded">
        </div>
      </div>
      
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <router-link 
          v-for="album in filteredAlbums" 
          :key="album._id" 
          :to="`/albums/${album._id}`"
          class="album-card"
        >
          <div class="album-cover">
            <img v-if="album.coverImage" :src="getAlbumCoverUrl(album.coverImage)" :alt="album.name" class="w-full h-full object-cover">
            <img v-else-if="album.firstPhoto" :src="getAlbumCoverUrl(album.firstPhoto)" :alt="album.name" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
              <span class="text-4xl text-gray-400">📷</span>
            </div>
            <span class="photo-count">{{ album.photoCount || 0 }}</span>
          </div>
          <h3 class="album-name">{{ album.name }}</h3>
        </router-link>
      </div>
    </div>
    
    <!-- 创建相册模态框 -->
    <el-dialog v-model="showCreateAlbumModal" title="创建新相册" width="30%">
      <el-form @submit.prevent="createAlbum">
        <el-form-item label="相册名称">
          <el-input v-model="newAlbumName" required></el-input>
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input type="textarea" v-model="newAlbumDescription"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createAlbum">创建</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAlbumStore } from '../store/album';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus';
import axios from 'axios';

const albumStore = useAlbumStore();
const showCreateAlbumModal = ref(false);
const newAlbumName = ref('');
const newAlbumDescription = ref('');
const sortBy = ref('date');
const searchQuery = ref('');

const { albums } = storeToRefs(albumStore);

onMounted(async () => {
  try {
    console.log('开始获取相册列表...');
    await albumStore.fetchAlbums();
    console.log('获取到的相册列表:', albumStore.albums);
    if (albumStore.albums.length === 0) {
      console.log('相册列表为空');
    }
  } catch (error) {
    console.error('获取相册列表失败:', error);
    ElMessage.error('获取相册列表失败，请稍后重试');
  }
});

const getAlbumCoverUrl = computed(() => {
  return (path: string) => {
    if (!path) return '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${axios.defaults.baseURL}${cleanPath}`;
  };
});

const filteredAlbums = computed(() => {
  let result = albums.value;
  if (searchQuery.value) {
    result = result.filter(album => 
      album.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      album.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  return result.sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy.value === 'photoCount') {
      return (b.photoCount || 0) - (a.photoCount || 0);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
});

function sortAlbums() {
  // 排序逻辑已经在 computed 属性中实现
}

function searchAlbums() {
  // 搜索逻辑已经在 computed 属性中实现
}

async function createAlbum() {
  try {
    if (!newAlbumName.value) {
      ElMessage.warning('请输入相册名称');
      return;
    }
    await albumStore.createAlbum(newAlbumName.value, newAlbumDescription.value);
    showCreateAlbumModal.value = false;
    newAlbumName.value = '';
    newAlbumDescription.value = '';
    ElMessage.success('相册创建成功');
    await albumStore.fetchAlbums();
  } catch (error) {
    console.error('创建相册失败:', error);
    ElMessage.error('创建相册失败，请稍后重试');
  }
}
</script>

<style scoped>
.album-card {
  display: block;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.album-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.album-cover {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 这会创建一个正方形的容器 */
}

.album-cover img,
.album-cover div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.8);
  color: black;
  padding: 2px 4px;
  font-size: 0.7rem;
  border-radius: 2px;
}

.album-name {
  padding: 4px;
  text-align: center;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>