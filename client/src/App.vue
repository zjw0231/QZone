<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <transition :name="getTransitionName(route)">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { RouteLocationNormalizedLoaded } from 'vue-router';

function getTransitionName(route: RouteLocationNormalizedLoaded): string {
  return (route.meta.transition as string) || 'slide-left';
}
</script>

<style scoped>
/* 使用Tailwind CSS进行样式设计 */
</style>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}
</style>