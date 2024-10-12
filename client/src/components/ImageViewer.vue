<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const imageUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)

const fullImageUrl = computed(() => {
  if (!imageUrl.value) return ''
  if (imageUrl.value.startsWith('http')) return imageUrl.value
  return `${axios.defaults.baseURL}${imageUrl.value.startsWith('/') ? '' : '/'}${imageUrl.value}`
})

onMounted(() => {
  imageUrl.value = route.params.imageUrl as string
  console.log('图片 URL:', fullImageUrl.value)
})

const handleImageLoad = () => {
  isLoading.value = false
}

const handleImageError = () => {
  isLoading.value = false
  hasError.value = true
  console.error('图片加载失败:', fullImageUrl.value)
}
</script>

<template>
  <div class="image-viewer">
    <p>当前图片 URL: {{ fullImageUrl }}</p>
    <img 
      :src="fullImageUrl" 
      alt="查看的图片" 
      class="max-w-full h-auto"
      @load="handleImageLoad"
      @error="handleImageError"
      v-show="!isLoading && !hasError"
    />
    <div v-if="isLoading" class="text-gray-500">
      正在加载图片...
    </div>
    <div v-if="hasError" class="text-red-500">
      图片加载失败，请检查图片链接是否正确。
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
}

img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}
</style>