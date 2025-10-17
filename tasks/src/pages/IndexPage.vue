<template>
  <q-page class="q-pa-sm">
    <!-- Headers -->
    <div class="row no-wrap q-gutter-x-sm">
      <div class="col text-weight-medium text-center" :style="headerStyle">{{ t('labels.title') }}</div>
      <div v-for="day in days" :key="day.key" class="col-2 text-weight-medium text-center day-column"
        :style="headerStyle">
        {{ day.header }}
      </div>
    </div>
    <q-separator class="q-mb-sm" />

    <!-- Unchecked Tasks -->
    <draggable v-model="uncheckedTasks" item-key="id" group="tasks" class="task-list" drag-class="drag-active"
      @end="onDragEnd" :delay="150" delay-on-touch-only>
      <template #item="{ element: task, index }">
        <div :class="{ 'task-row--even': index % 2 === 0 }">
          <div class="row no-wrap q-gutter-x-sm task-row">
            <div class="col">
              <q-slide-item :ref="(el) => setSlideItemRef(el as QSlideItem | null, task)" @left="() => onLeft(task)"
                @right="() => onRight(task)" :aria-label="t('labels.taskActions')">
                <template #left><q-icon name="edit" /></template>
                <template #right><q-icon name="delete" /></template>
                <q-item class="q-pa-xs">
                  <q-item-section :style="{ fontSize: `${settingsStore.fontSize}rem` }">
                    {{ task.title }}
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </div>
            <div v-for="day in days" :key="day.key" class="col-2 day-column"
              :class="{ 'today-column': day.key === 'today' }">
              <q-item class="flex-center">
                <q-checkbox v-if="isCheckboxVisible(task, day)" :model-value="!!task.checkedDates[day.dateStr]"
                  @update:model-value="(val) => onCheckChange(task.id, day.dateStr, val)" :size="checkboxSize"
                  color="green" />
              </q-item>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Checked Tasks (Not Draggable) -->
    <div v-for="(task, index) in checkedTasks" :key="task.id" class="task-list checked-list"
      :class="{ 'task-row--even': (uncheckedTasks.length + index) % 2 === 0 }">
      <div class="row no-wrap q-gutter-x-sm task-row">
        <div class="col">
          <q-slide-item :ref="(el) => setSlideItemRef(el as QSlideItem | null, task)" @left="() => onLeft(task)"
            @right="() => onRight(task)" :aria-label="t('labels.taskActions')">
            <template #left><q-icon name="edit" /></template>
            <template #right><q-icon name="delete" /></template>
            <q-item class="text-grey-7 q-pa-xs">
              <q-item-section :style="{ fontSize: `${settingsStore.fontSize}rem` }">{{
                task.title
              }}</q-item-section>
            </q-item>
          </q-slide-item>
        </div>
        <div v-for="day in days" :key="day.key" class="col-2 day-column">
          <q-item class="flex-center">
            <q-checkbox v-if="isCheckboxVisible(task, day)" :model-value="!!task.checkedDates[day.dateStr]"
              color="green" @update:model-value="(val) => onCheckChange(task.id, day.dateStr, val)"
              :size="checkboxSize" />
          </q-item>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import { useQuasar, type QSlideItem, date as qDate } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from 'src/stores/tasks'
import { useSettingsStore } from 'src/stores/settings'
import { useDateManager } from 'src/composables/useDateManager'
import type { Task } from 'src/types'
import TaskDialog from 'src/components/dialogs/TaskDialog.vue'

const $q = useQuasar()
const { t } = useI18n()
const tasksStore = useTasksStore()
const settingsStore = useSettingsStore()
const { today, yesterday, tomorrow, todayStr, yesterdayStr, tomorrowStr } = useDateManager()

const checkboxSize = computed(() => `${settingsStore.fontSize * 3.5}rem`)
const headerStyle = computed(() => ({
  fontSize: `${settingsStore.fontSize * 0.7}rem`,
}))

const slideItemRefs = ref(new Map<string, QSlideItem>())
const setSlideItemRef = (el: QSlideItem | null, task: Task) => {
  if (el) {
    slideItemRefs.value.set(task.id, el)
  }
}

const isTaskVisibleForToday = (task: Task): boolean => {
  if (task.type === 'once') {
    const checkedDays = Object.keys(task.checkedDates).filter((d) => task.checkedDates[d])
    if (checkedDays.length === 0) return true
    return checkedDays.some((d) => d === todayStr.value || d === yesterdayStr.value)
  }
  if (task.type === 'daily') return true
  if (task.type === 'weekly' && Array.isArray(task.daysOfWeek) && task.daysOfWeek.length > 0) {
    const yesterdayDay = new Date(yesterdayStr.value.replace(/-/g, '/')).getDay()
    const todayDay = new Date(todayStr.value.replace(/-/g, '/')).getDay()
    const tomorrowDay = new Date(tomorrowStr.value.replace(/-/g, '/')).getDay()
    return (
      task.daysOfWeek.includes(yesterdayDay) ||
      task.daysOfWeek.includes(todayDay) ||
      task.daysOfWeek.includes(tomorrowDay)
    )
  }
  return false
}

const visibleTasks = computed(() => tasksStore.tasks.filter(isTaskVisibleForToday))

const uncheckedTasks = computed({
  get: () =>
    visibleTasks.value
      .filter((t) => t.checkedDates[todayStr.value] !== true)
      .sort((a, b) => a.order - b.order),
  set: (newOrder) => {
    tasksStore.updateTaskOrder(newOrder)
  },
})

const checkedTasks = computed(() =>
  visibleTasks.value
    .filter((t) => t.checkedDates[todayStr.value] === true)
    .sort((a, b) => a.order - b.order)
)

const days = computed(() => [
  { key: 'yesterday', header: qDate.formatDate(yesterday.value, 'ddd/DD'), dateStr: yesterdayStr.value },
  { key: 'today', header: qDate.formatDate(today.value, 'ddd/DD'), dateStr: todayStr.value },
  { key: 'tomorrow', header: qDate.formatDate(tomorrow.value, 'ddd/DD'), dateStr: tomorrowStr.value },
])

const isCheckboxVisible = (task: Task, day: { key: string; dateStr: string }): boolean => {
  if (task.type === 'once') {
    return day.key === 'today' || !!task.checkedDates[day.dateStr]
  }
  if (task.type === 'weekly' && Array.isArray(task.daysOfWeek)) {
    // Correctly handle timezone by parsing date string parts
    // new Date('YYYY-MM-DD') is parsed as UTC midnight, which can cause off-by-one day errors in some timezones.
    // Using replace to handle Safari compatibility with date strings.
    const dayOfWeek = new Date(day.dateStr.replace(/-/g, '/')).getDay()
    return task.daysOfWeek.includes(dayOfWeek)
  }
  return task.type === 'daily'
}

const onCheckChange = (taskId: string, dateStr: string, value: boolean) => {
  const task = tasksStore.tasks.find((t) => t.id === taskId)
  if (task) {
    if (value) {
      task.checkedDates[dateStr] = true
    } else {
      delete task.checkedDates[dateStr]
    }
    tasksStore.saveTasks(true)
  }
}

const onDragEnd = () => {
  // v-model handles the reordering, and the computed setter updates the store
}

const onLeft = (task: Task) => {
  $q.dialog({
    component: TaskDialog,
    componentProps: { task },
  }).onDismiss(() => {
    slideItemRefs.value.get(task.id)?.reset()
  })
}

const onRight = (task: Task) => {
  // We reset the slide item immediately so the user sees it go back to normal
  slideItemRefs.value.get(task.id)?.reset()
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

<style lang="scss" scoped>
.task-list {
  min-height: 50px;
}

.task-row,
.task-row-title {
  min-width: 30px;
  height: 50px;
  display: flex;
  align-items: center;
}

.task-row--even,
.task-row--even .q-slide-item {
  background-color: $grey-3;
}

.body--dark {
  .task-row {
    background-color: black;

    .q-slide-item {
      background-color: black;
    }
  }

  .task-row--even {
    .q-slide-item {
      background-color: $grey-10;
    }
  }
}

.drag-active,
.drag-active .q-slide-item {
  background-color: $blue-5;
  opacity: 0.7;
  cursor: grabbing;
}

.day-column {
  min-width: 60px;
}

.today-column .q-checkbox * {
  color: $blue-5;
}
</style>