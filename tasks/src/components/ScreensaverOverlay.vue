<template>
  <div v-if="isActive" class="fullscreen transparent-overlay" @click="deactivate" @touchstart.prevent="deactivate">
    <div v-if="showConfetti" class="confetti-container">
      <div v-for="confetti in confettiPieces" :key="confetti.id" :style="getConfettiStyle(confetti)" class="confetti-piece"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
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
let confettiInterval: NodeJS.Timeout | null = null

const appElement = ref<HTMLElement | null>(null)

// Confetti configuration
const showConfetti = computed(() => settingsStore.screensaverConfetti)
const confettiPieces = ref<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([])

const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']

// Generate new confetti pieces
const generateConfetti = () => {
  if (!showConfetti.value) return

  const newConfetti = Array.from({ length: 50 }, (_, i) => {
    const randomColor = confettiColors[Math.floor(Math.random() * confettiColors.length)]
    return {
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -10,
      delay: Math.random() * 2,
      color: randomColor || '#FF6B6B' // Fallback color if undefined
    }
  })

  confettiPieces.value = [...confettiPieces.value, ...newConfetti]

  // Remove old confetti pieces after 10 seconds
  setTimeout(() => {
    confettiPieces.value = confettiPieces.value.filter(c => !newConfetti.find(nc => nc.id === c.id))
  }, 10000)
}

const getConfettiStyle = (confetti: { x: number; y: number; delay: number; color: string }) => {
  return {
    left: `${confetti.x}%`,
    top: `${confetti.y}%`,
    backgroundColor: confetti.color,
    animationDelay: `${confetti.delay}s`,
  }
}

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
  if (confettiInterval) clearInterval(confettiInterval)

  screensaverTimeout = null
  pixelShiftInterval = null
  colorShiftInterval = null
  confettiInterval = null

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

  // Generate confetti every 3 seconds if enabled
  if (showConfetti.value) {
    confettiInterval = setInterval(generateConfetti, 3000)
    // Initial confetti burst
    generateConfetti()
  }

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
  z-index: 99999;
  /* A very faint background to ensure it captures clicks, but is virtually invisible */
  background: rgba(0, 0, 0, 0.001);
  cursor: pointer;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 100000;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: confetti-fall 10s linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}
</style>