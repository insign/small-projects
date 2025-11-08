import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useSettingsStore } from 'src/stores/settings';

export function useInactivityTimer() {
  const isInactive = ref(false);
  let inactivityTimer: NodeJS.Timeout | null = null;
  const settingsStore = useSettingsStore();

  const resetTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // If the user becomes active again, reset the inactive state
    if (isInactive.value) {
      isInactive.value = false;
    }

    const timeoutMinutes = settingsStore.screensaverTimeout;
    if (timeoutMinutes > 0) {
      inactivityTimer = setTimeout(
        () => {
          isInactive.value = true;
        },
        timeoutMinutes * 60 * 1000,
      );
    }
  };

  const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'];

  const addListeners = () => {
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
  };

  const removeListeners = () => {
    events.forEach((event) => window.removeEventListener(event, resetTimer));
  };

  onMounted(() => {
    addListeners();
    resetTimer();
  });

  onUnmounted(() => {
    removeListeners();
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  });

  // Watch for changes in the settings and reset the timer
  watch(() => settingsStore.screensaverTimeout, resetTimer);

  return {
    isInactive,
    resetTimer,
  };
}
