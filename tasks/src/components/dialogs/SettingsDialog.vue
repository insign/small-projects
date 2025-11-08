<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="isPersistent">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ t('dialogs.settingsTitle') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-md">
        <q-input v-model="localSyncId" :label="t('labels.syncId')" :hint="t('hints.syncId')" autofocus
          :rules="[val => !!val || t('validation.syncIdRequired')]" lazy-rules />
        <q-select v-model="localLanguage" :options="langOptions" :label="t('labels.language')" emit-value map-options />
        <q-select
          v-model="localScreensaverTimeout"
          :options="screensaverTimeoutOptions"
          :label="t('labels.screensaverTimeout')"
          :hint="t('hints.screensaverTimeout')"
          emit-value
          map-options
        />
        <q-select
          v-model="localScreensaverDuration"
          :options="screensaverDurationOptions"
          :label="t('labels.screensaverDuration')"
          emit-value
          map-options
        />
        <div class="text-center">
          <div class="text-caption text-grey">{{ t('labels.darkMode') }}</div>
          <q-btn-toggle v-model="localDarkMode" toggle-color="primary" :options="[
            { label: t('labels.light'), value: 'light' },
            { label: t('labels.auto'), value: 'auto' },
            { label: t('labels.dark'), value: 'dark' },
          ]" />
        </div>
        <q-toggle v-model="localRequireFullscreen" :label="t('labels.requireFullscreen')" />
        <q-toggle v-model="localScreensaverConfetti" :label="t('labels.screensaverConfetti')" />
        <div>
          <q-slider v-model="localFontSize" label :label-value="`${localFontSize}rem`" :min="0.5" :max="2" :step="0.1"
            class="q-mt-lg" />
          <div class="text-caption text-grey text-center q-mt-sm">{{ t('labels.fontSize') }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-if="!isPersistent" color="primary" flat :label="t('buttons.close')" @click="onDialogCancel" />
        <q-btn color="primary" :label="t('buttons.save')" @click="onSaveClick" :disable="!localSyncId" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from 'src/stores/settings'

defineProps({
  isPersistent: {
    type: Boolean,
    default: false,
  },
})

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const settingsStore = useSettingsStore()

const localSyncId = ref(settingsStore.syncId)
const localFontSize = ref(settingsStore.fontSize)
const localLanguage = ref(settingsStore.language)
const localDarkMode = ref(settingsStore.darkMode)
const localScreensaverTimeout = ref(settingsStore.screensaverTimeout)
const localScreensaverDuration = ref(settingsStore.screensaverDuration)
const localRequireFullscreen = ref(settingsStore.requireFullscreen)
const localScreensaverConfetti = ref(settingsStore.screensaverConfetti)

const langOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

const screensaverTimeoutOptions = computed(() => [
  { label: t('labels.disabled'), value: 0 },
  ...[2, 5, 10, 20, 30, 40, 60].map(m => ({ label: t('labels.minutesUnit', { count: m }), value: m }))
])

const screensaverDurationOptions = computed(() => [
  { label: t('labels.untilInteraction'), value: 0 },
  ...[15, 30].map(s => ({ label: t('labels.secondsUnit', { count: s }), value: s })),
  ...[1, 2, 5].map(m => ({ label: t('labels.minutesUnit', { count: m }), value: m * 60 }))
])

const onSaveClick = () => {
  if (localSyncId.value) {
    settingsStore.setSyncId(localSyncId.value)
    settingsStore.setFontSize(localFontSize.value)
    settingsStore.setLanguage(localLanguage.value)
    settingsStore.setDarkMode(localDarkMode.value)
    settingsStore.setScreensaverTimeout(localScreensaverTimeout.value)
    settingsStore.setScreensaverDuration(localScreensaverDuration.value)
    settingsStore.setRequireFullscreen(localRequireFullscreen.value)
    settingsStore.setScreensaverConfetti(localScreensaverConfetti.value)
    onDialogOK()
  }
}
</script>