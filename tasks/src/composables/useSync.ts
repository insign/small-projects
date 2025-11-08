import { useQuasar } from 'quasar';
import { useSettingsStore } from 'src/stores/settings';
import { useTasksStore } from 'src/stores/tasks';
import { useApi } from './useApi';
import type { Settings, Task } from 'src/types';

export function useSync() {
  const $q = useQuasar();
  const settingsStore = useSettingsStore();
  const tasksStore = useTasksStore();
  const { getVersion, getData, putData } = useApi();

  let syncTimer: NodeJS.Timeout | null = null;

  const sync = async (showNotification = false) => {
    if (!settingsStore.syncId) {
      console.log('Sync skipped: No syncId set.');
      return;
    }

    console.log('Starting sync...');
    $q.loadingBar.start();

    try {
      // --- Sync Settings ---
      const settingsId = `${settingsStore.syncId}_settings`;
      const remoteSettingsVersion = await getVersion(settingsId);

      if (remoteSettingsVersion > settingsStore.version) {
        console.log('Remote settings are newer. Fetching...');
        const remoteData = await getData(settingsId);
        if (remoteData) {
          const newSettings = remoteData.json as Settings;
          settingsStore.setAllSettingsFromRemote(newSettings);
          settingsStore.setVersion(remoteData.version);
        }
      } else if (settingsStore.version > remoteSettingsVersion) {
        console.log('Local settings are newer. Pushing...');
        const dataToPush: Settings = {
          syncId: settingsStore.syncId,
          fontSize: settingsStore.fontSize,
          language: settingsStore.language,
          darkMode: settingsStore.darkMode,
          screensaverTimeout: settingsStore.screensaverTimeout,
          screensaverDuration: settingsStore.screensaverDuration,
          requireFullscreen: settingsStore.requireFullscreen,
          screensaverConfetti: settingsStore.screensaverConfetti,
          checkboxSize: settingsStore.checkboxSize,
          taskRowHeight: settingsStore.taskRowHeight,
          dayHeaderFormat: settingsStore.dayHeaderFormat,
          showTomorrow: settingsStore.showTomorrow,
        };
        const response = await putData(settingsId, dataToPush);
        settingsStore.setVersion(response.version);
      }

      // --- Sync Tasks ---
      const tasksId = `${settingsStore.syncId}_tasks`;
      const remoteTasksVersion = await getVersion(tasksId);

      if (remoteTasksVersion > tasksStore.version) {
        console.log('Remote tasks are newer. Fetching...');
        const remoteData = await getData(tasksId);
        if (remoteData) {
          tasksStore.tasks = remoteData.json as Task[];
          tasksStore.saveTasks(); // Persist to local storage
          tasksStore.setVersion(remoteData.version);
        }
      } else if (tasksStore.version > remoteTasksVersion) {
        console.log('Local tasks are newer. Pushing...');
        const response = await putData(tasksId, tasksStore.tasks);
        tasksStore.setVersion(response.version);
      }

      if (showNotification) {
        $q.notify({
          type: 'positive',
          message: 'Sync complete',
          timeout: 1500,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      $q.notify({ type: 'negative', message: 'Sync failed' });
    } finally {
      $q.loadingBar.stop();
    }
  };

  const startSyncInterval = () => {
    if (syncTimer) {
      clearInterval(syncTimer);
    }
    // Initial sync, then every 60 seconds
    setTimeout(() => {
      void sync(false);
    }, 1000); // Initial sync after 1s
    syncTimer = setInterval(() => {
      void sync(false);
    }, 60000);
  };

  const stopSyncInterval = () => {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };

  return {
    sync,
    startSyncInterval,
    stopSyncInterval,
  };
}
