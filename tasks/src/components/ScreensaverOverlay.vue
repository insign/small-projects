<template>
  <div v-if="isActive" class="fullscreen transparent-overlay" @click="deactivate" @touchstart.prevent="deactivate"></div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useSettingsStore } from 'src/stores/settings'
import { useScreensaverStore } from 'src/stores/screensaver'

const props = defineProps({
  isActive: Boolean,
})

const emit = defineEmits(['deactivated'])

const settingsStore = useSettingsStore()
const screensaverStore = useScreensaverStore()

let screensaverTimeout: NodeJS.Timeout | null = null
let pixelShiftInterval: NodeJS.Timeout | null = null
let colorShiftInterval: NodeJS.Timeout | null = null

const appElement = ref<HTMLElement | null>(null)

const pixelShift = () => {
  if (!appElement.value) {
    appElement.value = document.getElementById('q-app')
  }
  if (appElement.value) {
    const x = Math.floor(Math.random() * 11) - 5 // -5 to 5
    const y = Math.floor(Math.random() * 11) - 5 // -5 to 5
    appElement.value.style.transition = 'transform 0.5s ease'
    appElement.value.style.transform = `translate(${x}px, ${y}px)`
  }
}

const stop = () => {
  if (screensaverTimeout) clearTimeout(screensaverTimeout)
  if (pixelShiftInterval) clearInterval(pixelShiftInterval)
  if (colorShiftInterval) clearInterval(colorShiftInterval)

  screensaverTimeout = null
  pixelShiftInterval = null
  colorShiftInterval = null

  if (appElement.value) {
    appElement.value.style.transition = 'transform 0.5s ease'
    appElement.value.style.transform = ''
  }
  screensaverStore.resetColors()
}

const start = () => {
  stop() // Ensure any previous timers are cleared

  const durationInSeconds = settingsStore.screensaverDuration
  if (durationInSeconds > 0) {
    screensaverTimeout = setTimeout(() => {
      deactivate()
    }, durationInSeconds * 1000)
  }

  // Shift pixels every 5 seconds
  pixelShiftInterval = setInterval(pixelShift, 5000)
  // Shift colors every 5 seconds
  colorShiftInterval = setInterval(screensaverStore.randomizeColors, 5000)


  // Initial shifts
  setTimeout(pixelShift, 100)
  setTimeout(screensaverStore.randomizeColors, 100)
}

const deactivate = () => {
  stop()
  emit('deactivated')
}

watch(
  () => props.isActive,
  (newVal) => {
    if (newVal) {
      start()
    } else {
      stop()
    }
  }
)

onUnmounted(() => {
  stop()
})
</script>

<style scoped>
.transparent-overlay {
  z-index: 9999;
  /* A very faint background to ensure it captures clicks, but is virtually invisible */
  background: rgba(0, 0, 0, 0.001);
  cursor: pointer;
}
</style>