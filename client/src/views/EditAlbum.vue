<template>
  <div class="edit-album p-4 bg-gray-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">编辑相册</h2>
      
      <el-form @submit.prevent="saveAlbum">
        <el-form-item label="相册名称">
          <el-input v-model="albumName" required></el-input>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input type="textarea" v-model="albumDescription"></el-input>
        </el-form-item>
        
        <el-form-item label="更换封面">
          <div class="flex items-center">
            <img :src="coverImageUrl" alt="封面" class="w-20 h-20 object-cover mr-4">
            <el-button @click="changeCover">更换封面</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="权限">
          <el-radio-group v-model="albumPermission">
            <el-radio label="public">公开</el-radio>
            <el-radio label="private">私密</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" native-type="submit">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
      
      <el-button class="mt-4 w-full" type="danger" @click="confirmDeleteAlbum">删除相册</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAlbumStore } from '../store/album';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const albumStore = useAlbumStore();

const albumName = ref('');
const albumDescription = ref('');
const coverImageUrl = ref('');
const albumPermission = ref('public');

onMounted(async () => {
  const albumId = route.params.id as string;
  const album = await albumStore.fetchAlbum(albumId);
  if (album) {
    albumName.value = album.name;
    albumDescription.value = album.description || '';
    coverImageUrl.value = album.coverImage || '';
    albumPermission.value = album.isPublic ? 'public' : 'private';
  }
});

async function saveAlbum() {
  try {
    const albumId = route.params.id as string;
    await albumStore.updateAlbum(albumId, {
      name: albumName.value,
      description: albumDescription.value,
      isPublic: albumPermission.value === 'public'
    });
    ElMessage.success('相册更新成功');
    router.push({ name: 'AlbumDetail', params: { id: albumId } });
  } catch (error) {
    console.error('更新相册失败:', error);
    ElMessage.error('更新相册失败，请重试');
  }
}

function cancelEdit() {
  router.back();
}

function changeCover() {
  // 实现更换封面的逻辑
  console.log('更换封面');
}

async function confirmDeleteAlbum() {
  try {
    await ElMessageBox.confirm('确定要删除这个相册吗？此操作不可逆。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const albumId = route.params.id as string;
    await albumStore.deleteAlbum(albumId);
    ElMessage.success('相册删除成功');
    router.push({ name: 'Albums' });
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除相册失败:', error);
      ElMessage.error('删除相册失败，请重试');
    }
  }
}
</script>