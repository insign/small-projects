<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 500px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">{{ t('dialogs.recurringTasksTitle') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list separator>
          <q-item v-if="tasksStore.recurringTasks.length === 0">
            <q-item-section class="text-grey">{{ t('messages.noRecurringTasks') }}</q-item-section>
          </q-item>
          <q-slide-item
            v-for="task in tasksStore.recurringTasks"
            :key="task.id"
            @left="onLeft(task)"
            @right="onRight(task)"
          >
            <template v-slot:left>
              <q-icon name="edit" />
            </template>
            <template v-slot:right>
              <q-icon name="delete" />
            </template>
            <q-item>
              <q-item-section>
                <q-item-label>{{ task.title }}</q-item-label>
                <q-item-label caption>{{ getDaysLabel(task.daysOfWeek) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-slide-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" flat :label="t('buttons.close')" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from 'src/stores/tasks'
import type { Task } from 'src/types'
import TaskDialog from './TaskDialog.vue'

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])

const $q = useQuasar()
const { t } = useI18n()
const tasksStore = useTasksStore()

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const getDaysLabel = (days?: number[]) => {
  if (!days || days.length === 0) return t('labels.noSpecificDays')
  if (days.length === 7) return t('labels.everyDay')
  return days.map(d => dayLabels[d]).join(', ')
}

const onLeft = (task: Task) => {
  $q.dialog({
    component: TaskDialog,
    componentProps: { task },
  })
}

const onRight = (task: Task) => {
  $q.dialog({
    title: t('dialogs.confirmTitle'),
    message: t('messages.confirmDelete', { taskTitle: task.title }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    tasksStore.deleteTask(task.id)
    $q.notify({
      type: 'positive',
      message: t('messages.taskDeleted'),
      timeout: 1500,
      position: 'top',
    })
  })
}
</script>