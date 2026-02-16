<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style>
#app {
  min-height: 100vh;
  background: transparent;
  color: var(--text-main);
  transition: background 0.3s ease, color 0.3s ease;
}
</style>
