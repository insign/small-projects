import { ref, computed } from 'vue'
import { date as qDate } from 'quasar'

// State is defined in the module scope, making it a singleton.
const today = ref(new Date())

// All other date refs are computed from 'today'.
const yesterday = computed(() => qDate.subtractFromDate(today.value, { days: 1 }))
const tomorrow = computed(() => qDate.addToDate(today.value, { days: 1 }))

const todayStr = computed(() => qDate.formatDate(today.value, 'YYYY-MM-DD'))
const yesterdayStr = computed(() => qDate.formatDate(yesterday.value, 'YYYY-MM-DD'))
const tomorrowStr = computed(() => qDate.formatDate(tomorrow.value, 'YYYY-MM-DD'))

let timer: NodeJS.Timeout | null = null
let rolloverCallback: (() => void) | null = null

const checkForDateChange = () => {
  const now = new Date()
  if (!qDate.isSameDate(today.value, now, 'day')) {
    console.log('[DateManager] Midnight passed. Updating date.')
    today.value = now
    rolloverCallback?.()
  }
}

// Export a composable that returns the reactive properties.
export function useDateManager() {
  return {
    today,
    yesterday,
    tomorrow,
    todayStr,
    yesterdayStr,
    tomorrowStr,
  }
}

// Export lifecycle functions to be called from a component with a lifecycle (App.vue).
export function initializeDateManager(onRollover: () => void) {
  if (timer) return
  console.log('[DateManager] Initializing date manager timer.')
  rolloverCallback = onRollover
  checkForDateChange()
  timer = setInterval(checkForDateChange, 60000)
}

export function cleanupDateManager() {
  if (timer) {
    console.log('[DateManager] Cleaning up date manager timer.')
    clearInterval(timer)
    timer = null
    rolloverCallback = null
  }
}