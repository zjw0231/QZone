<template>
  <div class="photo-editor">
    <Cropper
      v-if="showCropper"
      :src="photoUrl"
      @change="onChange"
      :stencil-props="{
        aspectRatio: 1
      }"
    />
    <div v-else>
      <img :src="editedPhotoUrl" :style="filterStyle" />
      <div class="filter-controls">
        <label>
          亮度:
          <input type="range" v-model="filters.brightness" min="0" max="200" step="1" />
        </label>
        <label>
          对比度:
          <input type="range" v-model="filters.contrast" min="0" max="200" step="1" />
        </label>
        <label>
          饱和度:
          <input type="range" v-model="filters.saturate" min="0" max="200" step="1" />
        </label>
      </div>
    </div>
    <div class="editor-controls">
      <button @click="toggleCropper">{{ showCropper ? '应用裁剪' : '裁剪' }}</button>
      <button @click="saveChanges">保存更改</button>
      <button @click="cancelEdit">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

// 移除 defineOptions，因为它不是必需的

const props = defineProps<{
  photoUrl: string;
}>();

const emit = defineEmits<{
  (e: 'save', editedUrl: string): void;
  (e: 'cancel'): void;
}>();

const showCropper = ref(false);
const croppedImage = ref<string | null>(null);
const filters = ref({
  brightness: 100,
  contrast: 100,
  saturate: 100,
});

const editedPhotoUrl = computed(() => croppedImage.value || props.photoUrl);

const filterStyle = computed(() => ({
  filter: `brightness(${filters.value.brightness}%) contrast(${filters.value.contrast}%) saturate(${filters.value.saturate}%)`,
}));

function onChange({ canvas }: { canvas: HTMLCanvasElement }) {
  croppedImage.value = canvas.toDataURL();
}

function toggleCropper() {
  showCropper.value = !showCropper.value;
}

function saveChanges() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx!.filter = filterStyle.value.filter;
    ctx!.drawImage(img, 0, 0, img.width, img.height);
    emit('save', canvas.toDataURL());
  };
  img.src = editedPhotoUrl.value;
}

function cancelEdit() {
  emit('cancel');
}

// 添加以下行来显式定义默认导出
defineExpose({});
</script>

<style scoped>
.photo-editor {
  max-width: 600px;
  margin: 0 auto;
}

.filter-controls, .editor-controls {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
}
</style>