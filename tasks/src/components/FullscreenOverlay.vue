<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/stores/settings'

const $q = useQuasar()
const settingsStore = useSettingsStore()

function requestFullscreen() {
  if ($q.fullscreen.isActive) return
  void $q.fullscreen.request()
}

function clickHandler() {
  if (!document.fullscreenElement && settingsStore.requireFullscreen) {
    requestFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('click', clickHandler, { capture: true })
})

onUnmounted(() => {
  document.removeEventListener('click', clickHandler, { capture: true })
})
</script>