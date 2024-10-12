<template>
  <div class="home">
    <h1 class="text-3xl font-bold mb-4">欢迎来到相册应用</h1>
    <p class="mb-4">在同一 WiFi 网络下，您可以使用手机访问此应用。</p>
    <p class="mb-6">请使用以下地址在手机浏览器中打开：<br>
      <span v-if="mobileUrl" class="font-mono bg-gray-200 p-1 rounded">{{ mobileUrl }}</span>
      <span v-else class="text-gray-500">正在获取 IP 地址...</span>
    </p>
    <router-link to="/albums" class="btn">查看相册列表</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const mobileUrl = ref('');

onMounted(async () => {
  try {
    console.log('Fetching IP address...');
    const response = await axios.get('/api/network/ip');
    console.log('IP address response:', response.data);
    const ip = response.data.ip;
    const port = window.location.port; // 获取当前页面的端口
    mobileUrl.value = `http://${ip}:${port}`;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    mobileUrl.value = '无法获取 IP 地址，请检查网络连接';
    ElMessage.error('获取 IP 地址失败，请检查网络连接');
  }
});
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}
</style>