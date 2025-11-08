<template>
  <router-view />
  <ScreensaverOverlay :is-active="isScreensaverActive" @deactivated="onScreensaverDeactivated" />
  <FullscreenOverlay v-if="settingsStore.requireFullscreen" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from 'src/stores/settings'
import { useTasksStore } from 'src/stores/tasks'
import { useSync } from 'src/composables/useSync'
import { initializeDateManager, cleanupDateManager } from 'src/composables/useDateManager'
import { useInactivityTimer } from 'src/composables/useInactivityTimer'
import { useAutoUpdate } from 'src/composables/useAutoUpdate'
import SettingsDialog from 'src/components/dialogs/SettingsDialog.vue'
import ScreensaverOverlay from 'src/components/ScreensaverOverlay.vue'
import FullscreenOverlay from 'src/components/FullscreenOverlay.vue'
import { type MessageLanguages } from 'src/boot/i18n'

const $q = useQuasar()
const { locale } = useI18n()
const settingsStore = useSettingsStore()
const tasksStore = useTasksStore()
const { startSyncInterval, stopSyncInterval } = useSync()
const { isInactive, resetTimer } = useInactivityTimer()

// Auto-update: verifica nova versão a cada 5 minutos
useAutoUpdate(5)

const isScreensaverActive = ref(false)

watch(isInactive, (inactive) => {
  if (inactive) {
    isScreensaverActive.value = true
  }
})

const onScreensaverDeactivated = () => {
  isScreensaverActive.value = false
  resetTimer()
}


// Vite-specific feature to handle dynamic imports from node_modules
const langList = import.meta.glob('../node_modules/quasar/lang/*.js')
type LangModule = { default: typeof $q.lang }

// Watch for language changes in the store and update i18n and Quasar lang
watch(
  () => settingsStore.language,
  async (newLang: MessageLanguages) => {
    console.log(`[App.vue] Language changed to: ${newLang}`)
    locale.value = newLang

    // Dynamically import and set Quasar language pack
    const langIso = newLang === 'pt-BR' ? 'pt-BR' : 'en-US'
    const path = `../node_modules/quasar/lang/${langIso}.js`
    const importer = langList[path]

    if (importer) {
      try {
        const langModule = (await importer()) as LangModule
        $q.lang.set(langModule.default)
        console.log(`[App.vue] Quasar language pack set to: ${langIso}`)
      } catch (e) {
        console.error('Failed to set Quasar language pack', e)
      }
    } else {
      console.error(`Could not find language pack for path: ${path}`)
    }
  },
  { immediate: true }
)

// Watch for dark mode changes in the store and update Quasar's dark mode
watch(
  () => settingsStore.darkMode,
  (mode) => {
    $q.dark.set(mode === 'auto' ? 'auto' : mode === 'dark')
  },
  { immediate: true }
)

onMounted(() => {
  initializeDateManager(() => tasksStore.handleDateRollover())

  settingsStore.loadInitialId()
  if (settingsStore.syncId) {
    tasksStore.loadTasks()
    startSyncInterval()
  } else {
    // If no syncId is configured, force the settings dialog
    $q.dialog({
      component: SettingsDialog,
      componentProps: {
        isPersistent: true,
      },
    }).onOk(() => {
      // After setting the ID, load tasks and start syncing
      if (settingsStore.syncId) {
        tasksStore.loadTasks()
        startSyncInterval()
      }
    })
  }
})

onUnmounted(() => {
  cleanupDateManager()
  stopSyncInterval()
})
</script>