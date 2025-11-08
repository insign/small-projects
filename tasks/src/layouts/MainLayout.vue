<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar :class="`bg-${screensaverStore.toolbarColor}`">
        <q-toolbar-title :class="`text-${screensaverStore.buttonColor}`">
          {{ t('tasksTitle') }}
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          icon="sync"
          @click="() => sync(true)"
          :aria-label="t('buttons.sync')"
          :color="screensaverStore.buttonColor"
        />
        <q-btn
          flat
          dense
          round
          icon="add"
          @click="() => openTaskDialog(null)"
          :aria-label="t('buttons.addTask')"
          :color="screensaverStore.buttonColor"
        />
        <q-btn
          flat
          dense
          round
          icon="event_repeat"
          @click="openRecurringDialog"
          :aria-label="t('buttons.recurringTasks')"
          :color="screensaverStore.buttonColor"
        >
          <q-badge v-if="recurringTaskCount > 0" color="red" floating>{{
            recurringTaskCount
          }}</q-badge>
        </q-btn>
        <q-btn
          flat
          dense
          round
          icon="settings"
          @click="openSettingsDialog"
          :aria-label="t('buttons.settings')"
          :color="screensaverStore.buttonColor"
        />
        <q-btn
          flat
          dense
          round
          :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
          @click="$q.fullscreen.toggle()"
          :aria-label="t('buttons.toggleFullscreen')"
          :color="screensaverStore.buttonColor"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from 'src/stores/settings';
import { useTasksStore } from 'src/stores/tasks';
import { useSync } from 'src/composables/useSync';
import { useScreensaverStore } from 'src/stores/screensaver';
import SettingsDialog from 'src/components/dialogs/SettingsDialog.vue';
import TaskDialog from 'src/components/dialogs/TaskDialog.vue';
import RecurringDialog from 'src/components/dialogs/RecurringDialog.vue';
import { computed } from 'vue';
import type { Task } from 'src/types';

const $q = useQuasar();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const tasksStore = useTasksStore();
const screensaverStore = useScreensaverStore();
const { sync } = useSync();

const recurringTaskCount = computed(() => tasksStore.recurringTasks.length);

const openSettingsDialog = () => {
  $q.dialog({
    component: SettingsDialog,
  }).onOk(() => {
    // Potentially trigger a sync or reload if syncId changed
    if (settingsStore.syncId) {
      tasksStore.loadTasks();
      void sync(true);
    }
  });
};

const openTaskDialog = (task: Task | null) => {
  $q.dialog({
    component: TaskDialog,
    componentProps: { task },
  });
};

const openRecurringDialog = () => {
  $q.dialog({
    component: RecurringDialog,
  });
};
</script>
