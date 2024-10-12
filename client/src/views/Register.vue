<template>
  <div class="register">
    <h2 class="text-2xl font-bold mb-4">注册</h2>
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="username" class="block mb-1">用户名</label>
        <input
          type="text"
          id="username"
          v-model="username"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label for="email" class="block mb-1">邮箱</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label for="password" class="block mb-1">密码</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label for="confirmPassword" class="block mb-1">确认密码</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        :disabled="isLoading"
      >
        {{ isLoading ? '注册中...' : '注册' }}
      </button>
    </form>
    <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const isLoading = ref(false);

async function handleRegister() {
  error.value = '';
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }
  
  isLoading.value = true;
  try {
    await authStore.register(username.value, email.value, password.value);
    router.push('/login');
  } catch (err: any) {
    console.error('Registration error:', err);
    error.value = err.message || '注册失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
}
</script>