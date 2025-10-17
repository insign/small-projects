import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { ref, watch } from 'vue'
import type { Settings } from 'src/types'
import { type MessageLanguages } from 'src/boot/i18n'

const SETTINGS_KEY_SUFFIX = '_settings'
const LAST_SYNC_ID_KEY = 'lastSyncId'

export const useSettingsStore = defineStore('settings', () => {
  const syncId = ref<string | null>(null)
  const fontSize = ref<number>(1) // default 1rem
  const language = ref<MessageLanguages>('pt-BR')
  const version = ref(0)

  const getSettingsKey = () => (syncId.value ? `${syncId.value}${SETTINGS_KEY_SUFFIX}` : null)
  const getVersionKey = () => (syncId.value ? `${syncId.value}_settings_version` : null)

  function saveSettings(incrementVersion = false) {
    const key = getSettingsKey()
    if (!key) return

    const settings: Settings = {
      syncId: syncId.value!,
      fontSize: fontSize.value,
      language: language.value,
    }
    LocalStorage.set(key, settings)

    if (incrementVersion) {
      setVersion(version.value + 1)
      console.log(`[SettingsStore] Settings saved. Version incremented to: ${version.value}`)
    }
  }

  function loadSettings(id: string) {
    syncId.value = id
    const key = getSettingsKey()
    if (key && LocalStorage.has(key)) {
      const storedSettings = LocalStorage.getItem<Settings>(key)
      fontSize.value = storedSettings?.fontSize || 1
      language.value = (storedSettings?.language as MessageLanguages) || 'pt-BR'
    } else {
      fontSize.value = 1
      language.value = 'pt-BR'
    }
    loadVersion()
  }

  function loadInitialId() {
    const lastId = LocalStorage.getItem<string>(LAST_SYNC_ID_KEY)
    if (lastId) {
      loadSettings(lastId)
    }
  }

  function setSyncId(id: string | null) {
    if (id && id !== syncId.value) {
      syncId.value = id
      LocalStorage.set(LAST_SYNC_ID_KEY, id)
      loadSettings(id)
      saveSettings(true) // Save and increment version for new ID
    } else if (id === null) {
      syncId.value = null
      LocalStorage.remove(LAST_SYNC_ID_KEY)
    }
  }

  function setFontSize(size: number) {
    if (size > 0 && size !== fontSize.value) {
      fontSize.value = size
      saveSettings(true)
    }
  }

  function setLanguage(lang: MessageLanguages) {
    if (lang !== language.value) {
      console.log(`[SettingsStore] Setting language from "${language.value}" to "${lang}"`)
      language.value = lang
      saveSettings(true)
    }
  }

  function loadVersion() {
    const key = getVersionKey()
    version.value = (key ? LocalStorage.getItem<number>(key) : 0) || 0
  }

  function setVersion(newVersion: number) {
    version.value = newVersion
    const key = getVersionKey()
    if (key) {
      LocalStorage.set(key, newVersion)
    }
  }

  watch(
    fontSize,
    (newSize) => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${newSize}rem`
      }
    },
    { immediate: true }
  )

  return {
    syncId,
    fontSize,
    language,
    version,
    setVersion,
    loadSettings,
    saveSettings,
    setSyncId,
    setFontSize,
    setLanguage,
    loadInitialId,
  }
})