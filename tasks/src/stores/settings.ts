import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { ref, watch } from 'vue';
import type { Settings, DayHeaderFormat } from 'src/types';
import { type MessageLanguages } from 'src/boot/i18n';

const SETTINGS_KEY_SUFFIX = '_settings';
const LAST_SYNC_ID_KEY = 'lastSyncId';

export const useSettingsStore = defineStore('settings', () => {
  const syncId = ref<string | null>(null);
  const fontSize = ref<number>(1); // default 1rem
  const language = ref<MessageLanguages>('pt-BR');
  const darkMode = ref<'light' | 'auto' | 'dark'>('auto');
  const screensaverTimeout = ref<number>(0); // 0 means disabled
  const screensaverDuration = ref<number>(60); // in seconds, 0 for 'until interaction'
  const requireFullscreen = ref<boolean>(true); // require fullscreen for task operations
  const screensaverConfetti = ref<boolean>(true); // enable confetti animation in screensaver
  const checkboxSize = ref<number>(24); // in pixels
  const taskRowHeight = ref<number>(30); // in pixels
  const dayHeaderFormat = ref<DayHeaderFormat>('weekday'); // default to weekday only
  const showTomorrow = ref<boolean>(true); // whether to show tomorrow column
  const version = ref(0);

  const getSettingsKey = () => (syncId.value ? `${syncId.value}${SETTINGS_KEY_SUFFIX}` : null);
  const getVersionKey = () => (syncId.value ? `${syncId.value}_settings_version` : null);

  function saveSettings(incrementVersion = false) {
    const key = getSettingsKey();
    if (!key) return;

    const settings: Settings = {
      syncId: syncId.value!,
      fontSize: fontSize.value,
      language: language.value,
      darkMode: darkMode.value,
      screensaverTimeout: screensaverTimeout.value,
      screensaverDuration: screensaverDuration.value,
      requireFullscreen: requireFullscreen.value,
      screensaverConfetti: screensaverConfetti.value,
      checkboxSize: checkboxSize.value,
      taskRowHeight: taskRowHeight.value,
      dayHeaderFormat: dayHeaderFormat.value,
      showTomorrow: showTomorrow.value,
    };
    LocalStorage.set(key, settings);

    if (incrementVersion) {
      setVersion(version.value + 1);
      console.log(`[SettingsStore] Settings saved. Version incremented to: ${version.value}`);
    }
  }

  function loadSettings(id: string) {
    syncId.value = id;
    const key = getSettingsKey();
    if (key && LocalStorage.has(key)) {
      const storedSettings = LocalStorage.getItem<Settings>(key);
      fontSize.value = storedSettings?.fontSize || 1;
      language.value = (storedSettings?.language as MessageLanguages) || 'pt-BR';
      darkMode.value = storedSettings?.darkMode || 'auto';
      screensaverTimeout.value = storedSettings?.screensaverTimeout || 0;
      screensaverDuration.value = storedSettings?.screensaverDuration ?? 60;
      requireFullscreen.value = storedSettings?.requireFullscreen ?? true;
      screensaverConfetti.value = storedSettings?.screensaverConfetti ?? true;
      checkboxSize.value = storedSettings?.checkboxSize || 24;
      taskRowHeight.value = storedSettings?.taskRowHeight || 30;
      dayHeaderFormat.value = storedSettings?.dayHeaderFormat || 'weekday';
      showTomorrow.value = storedSettings?.showTomorrow ?? true;
    } else {
      fontSize.value = 1;
      language.value = 'pt-BR';
      darkMode.value = 'auto';
      screensaverTimeout.value = 0;
      screensaverDuration.value = 60;
      requireFullscreen.value = true;
      screensaverConfetti.value = true;
      checkboxSize.value = 24;
      taskRowHeight.value = 30;
      dayHeaderFormat.value = 'weekday';
      showTomorrow.value = true;
    }
    loadVersion();
  }

  function loadInitialId() {
    const lastId = LocalStorage.getItem<string>(LAST_SYNC_ID_KEY);
    if (lastId) {
      loadSettings(lastId);
    }
  }

  function setSyncId(id: string | null) {
    if (id && id !== syncId.value) {
      syncId.value = id;
      LocalStorage.set(LAST_SYNC_ID_KEY, id);
      loadSettings(id);
      saveSettings(true); // Save and increment version for new ID
    } else if (id === null) {
      syncId.value = null;
      LocalStorage.remove(LAST_SYNC_ID_KEY);
    }
  }

  function setFontSize(size: number) {
    if (size > 0 && size !== fontSize.value) {
      fontSize.value = size;
      saveSettings(true);
    }
  }

  function setLanguage(lang: MessageLanguages) {
    if (lang !== language.value) {
      console.log(`[SettingsStore] Setting language from "${language.value}" to "${lang}"`);
      language.value = lang;
      saveSettings(true);
    }
  }

  function setDarkMode(mode: 'light' | 'auto' | 'dark') {
    if (mode !== darkMode.value) {
      darkMode.value = mode;
      saveSettings(true);
    }
  }

  function setScreensaverTimeout(minutes: number) {
    if (minutes !== screensaverTimeout.value) {
      screensaverTimeout.value = minutes;
      saveSettings(true);
    }
  }

  function setScreensaverDuration(seconds: number) {
    if (seconds !== screensaverDuration.value) {
      screensaverDuration.value = seconds;
      saveSettings(true);
    }
  }

  function setRequireFullscreen(require: boolean) {
    if (require !== requireFullscreen.value) {
      requireFullscreen.value = require;
      saveSettings(true);
    }
  }

  function setScreensaverConfetti(enable: boolean) {
    if (enable !== screensaverConfetti.value) {
      screensaverConfetti.value = enable;
      saveSettings(true);
    }
  }

  function setCheckboxSize(size: number) {
    if (size > 0 && size !== checkboxSize.value) {
      checkboxSize.value = size;
      saveSettings(true);
    }
  }

  function setTaskRowHeight(height: number) {
    if (height > 0 && height !== taskRowHeight.value) {
      taskRowHeight.value = height;
      saveSettings(true);
    }
  }

  function setDayHeaderFormat(format: DayHeaderFormat) {
    if (format !== dayHeaderFormat.value) {
      dayHeaderFormat.value = format;
      saveSettings(true);
    }
  }

  function setShowTomorrow(show: boolean) {
    if (show !== showTomorrow.value) {
      showTomorrow.value = show;
      saveSettings(true);
    }
  }

  function setAllSettingsFromRemote(newSettings: Partial<Settings>) {
    let changed = false;
    if (newSettings.fontSize !== undefined && newSettings.fontSize !== fontSize.value) {
      fontSize.value = newSettings.fontSize;
      changed = true;
    }
    if (newSettings.language !== undefined && newSettings.language !== language.value) {
      language.value = newSettings.language as MessageLanguages;
      changed = true;
    }
    if (newSettings.darkMode !== undefined && newSettings.darkMode !== darkMode.value) {
      darkMode.value = newSettings.darkMode;
      changed = true;
    }
    if (
      newSettings.screensaverTimeout !== undefined &&
      newSettings.screensaverTimeout !== screensaverTimeout.value
    ) {
      screensaverTimeout.value = newSettings.screensaverTimeout;
      changed = true;
    }
    if (
      newSettings.screensaverDuration !== undefined &&
      newSettings.screensaverDuration !== screensaverDuration.value
    ) {
      screensaverDuration.value = newSettings.screensaverDuration;
      changed = true;
    }
    if (
      newSettings.requireFullscreen !== undefined &&
      newSettings.requireFullscreen !== requireFullscreen.value
    ) {
      requireFullscreen.value = newSettings.requireFullscreen;
      changed = true;
    }
    if (
      newSettings.screensaverConfetti !== undefined &&
      newSettings.screensaverConfetti !== screensaverConfetti.value
    ) {
      screensaverConfetti.value = newSettings.screensaverConfetti;
      changed = true;
    }
    if (newSettings.checkboxSize !== undefined && newSettings.checkboxSize !== checkboxSize.value) {
      checkboxSize.value = newSettings.checkboxSize;
      changed = true;
    }
    if (
      newSettings.taskRowHeight !== undefined &&
      newSettings.taskRowHeight !== taskRowHeight.value
    ) {
      taskRowHeight.value = newSettings.taskRowHeight;
      changed = true;
    }
    if (
      newSettings.dayHeaderFormat !== undefined &&
      newSettings.dayHeaderFormat !== dayHeaderFormat.value
    ) {
      dayHeaderFormat.value = newSettings.dayHeaderFormat;
      changed = true;
    }
    if (newSettings.showTomorrow !== undefined && newSettings.showTomorrow !== showTomorrow.value) {
      showTomorrow.value = newSettings.showTomorrow;
      changed = true;
    }

    if (changed) {
      saveSettings(false); // Save all changes at once, don't increment version
    }
  }

  function loadVersion() {
    const key = getVersionKey();
    version.value = (key ? LocalStorage.getItem<number>(key) : 0) || 0;
  }

  function setVersion(newVersion: number) {
    version.value = newVersion;
    const key = getVersionKey();
    if (key) {
      LocalStorage.set(key, newVersion);
    }
  }

  watch(
    fontSize,
    (newSize) => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${newSize}rem`;
      }
    },
    { immediate: true },
  );

  return {
    syncId,
    fontSize,
    language,
    darkMode,
    screensaverTimeout,
    screensaverDuration,
    requireFullscreen,
    screensaverConfetti,
    checkboxSize,
    taskRowHeight,
    dayHeaderFormat,
    showTomorrow,
    version,
    setVersion,
    loadSettings,
    saveSettings,
    setSyncId,
    setFontSize,
    setLanguage,
    setDarkMode,
    setScreensaverTimeout,
    setScreensaverDuration,
    setRequireFullscreen,
    setScreensaverConfetti,
    setCheckboxSize,
    setTaskRowHeight,
    setDayHeaderFormat,
    setShowTomorrow,
    loadInitialId,
    setAllSettingsFromRemote,
  };
});
