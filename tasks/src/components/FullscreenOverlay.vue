<template>
  <div v-if="shouldShowOverlay" class="fullscreen-overlay" @click.stop>
    <div class="fullscreen-content">
      <q-icon name="fullscreen" size="64px" color="primary" class="q-mb-lg" />
      <h4 class="q-mb-md text-center">
        {{ $t('fullscreen.overlay.message') }}
      </h4>
      <q-btn
        color="primary"
        size="lg"
        :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
        :label="$t('fullscreen.overlay.enterButton')"
        @click="toggleFullscreen"
        class="q-pa-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/stores/settings'

const $q = useQuasar()
const settingsStore = useSettingsStore()

const isFullscreen = ref(false)

const updateFullscreenStatus = () => {
  isFullscreen.value = document.fullscreenElement !== null
}

// Show overlay only if fullscreen is required AND not in fullscreen
const shouldShowOverlay = computed(() => {
  return settingsStore.requireFullscreen && !isFullscreen.value
})

const toggleFullscreen = async () => {
  try {
    const docEl = document.documentElement
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen()
      updateFullscreenStatus()
    }
  } catch (err) {
    console.error('Error attempting to enable fullscreen:', err)
  }
}

onMounted(() => {
  updateFullscreenStatus()

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', updateFullscreenStatus)
  document.addEventListener('webkitfullscreenchange', updateFullscreenStatus)
  document.addEventListener('mozfullscreenchange', updateFullscreenStatus)
  document.addEventListener('MSFullscreenChange', updateFullscreenStatus)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenStatus)
  document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus)
  document.removeEventListener('mozfullscreenchange', updateFullscreenStatus)
  document.removeEventListener('MSFullscreenChange', updateFullscreenStatus)
})
</script>

<style scoped>
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.fullscreen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  max-width: 500px;
  text-align: center;
}

.fullscreen-content h4 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.4;
  color: white;
}

.fullscreen-content .q-icon {
  opacity: 0.9;
}

.fullscreen-content .q-btn {
  min-width: 250px;
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
}
</style>
