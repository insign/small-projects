<template>
  <q-page class="q-pa-sm">
    <!-- Headers -->
    <div v-if="settingsStore.dayHeaderFormat !== 'none'" class="row no-wrap q-gutter-x-xs">
      <div class="col text-weight-medium text-center" :style="headerStyle">&nbsp;</div>
      <div v-for="day in days" :key="day.key" class="col-1 text-weight-medium text-center day-column q-mb-sm"
        :style="headerStyle">
        {{ day.header }}
      </div>
    </div>

    <!-- Unchecked Tasks -->
    <draggable v-model="uncheckedTasks" item-key="id" group="tasks" class="task-list" drag-class="drag-active"
      @end="onDragEnd" :delay="150" delay-on-touch-only>
      <template #item="{ element: task, index }">
        <div :class="{ 'task-row--even': index % 2 === 0, 'not-done-yesterday': isNotDoneYesterday(task) }">
          <div class="row no-wrap q-gutter-x-xs task-row" :style="{ height: taskRowHeight }">
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
            <div v-for="day in allDays" :key="day.key" class="col-1 day-column"
              :class="{ 'today-column': day.key === 'today', 'long-pressing': longPressingRow === `${task.id}-${day.dateStr}` }">
              <q-item class="flex-center">
                <q-checkbox v-if="isCheckboxVisible(task, day)"
                  :model-value="getCheckboxValue(task, day.dateStr)"
                  :indeterminate-value="'indeterminate'"
                  :indeterminate-icon="'remove'"
                  @update:model-value="(val) => onCheckChange(task.id, day.dateStr, val as boolean)"
                  :size="checkboxSize"
                  :color="getCheckboxColor(task, day.dateStr)"
                  @mousedown="startLongPress(task.id, day.dateStr)"
                  @mouseup="cancelLongPress"
                  @mouseleave="cancelLongPress"
                  @touchstart="startLongPress(task.id, day.dateStr)"
                  @touchend="cancelLongPress"
                  @touchcancel="cancelLongPress" />
              </q-item>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Checked Tasks (Not Draggable) -->
    <div v-for="(task, index) in checkedTasks" :key="task.id" class="task-list checked-list"
      :class="{ 'task-row--even': (uncheckedTasks.length + index) % 2 === 0, 'not-done-yesterday': isNotDoneYesterday(task) }">
      <div class="row no-wrap q-gutter-x-xs task-row" :style="{ height: taskRowHeight }">
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
        <div v-for="day in allDays" :key="day.key" class="col-1 day-column"
          :class="{ 'long-pressing': longPressingRow === `${task.id}-${day.dateStr}` }">
          <q-item class="flex-center">
            <q-checkbox v-if="isCheckboxVisible(task, day)"
              :model-value="getCheckboxValue(task, day.dateStr)"
              :indeterminate-value="'indeterminate'"
              :indeterminate-icon="'remove'"
              @update:model-value="(val) => onCheckChange(task.id, day.dateStr, val as boolean)"
              :size="checkboxSize"
              :color="getCheckboxColor(task, day.dateStr)"
              @mousedown="startLongPress(task.id, day.dateStr)"
              @mouseup="cancelLongPress"
              @mouseleave="cancelLongPress"
              @touchstart="startLongPress(task.id, day.dateStr)"
              @touchend="cancelLongPress"
              @touchcancel="cancelLongPress" />
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

const checkboxSize = computed(() => `${settingsStore.checkboxSize}px`)
const headerStyle = computed(() => ({
  fontSize: `${settingsStore.fontSize * 0.7}rem`,
}))
const taskRowHeight = computed(() => `${settingsStore.taskRowHeight}px`)

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
      .filter((t) => {
        const status = t.checkedDates[todayStr.value]
        return status !== true && status !== 'not-done'
      })
      .sort((a, b) => {
        const aPendingYesterday = isNotDoneYesterday(a)
        const bPendingYesterday = isNotDoneYesterday(b)

        // Priorizar tarefas pendentes ontem
        if (aPendingYesterday && !bPendingYesterday) return -1
        if (!aPendingYesterday && bPendingYesterday) return 1

        // Se ambas ou nenhuma está pendente ontem, ordenar por order
        return a.order - b.order
      }),
  set: (newOrder) => {
    tasksStore.updateTaskOrder(newOrder)
  },
})

const checkedTasks = computed(() =>
  visibleTasks.value
    .filter((t) => {
      const status = t.checkedDates[todayStr.value]
      return status === true || status === 'not-done'
    })
    .sort((a, b) => a.order - b.order)
)

const allDays = computed(() => [
  { key: 'yesterday', dateStr: yesterdayStr.value },
  { key: 'today', dateStr: todayStr.value },
  { key: 'tomorrow', dateStr: tomorrowStr.value },
])

const days = computed(() => {
  const format = settingsStore.dayHeaderFormat
  if (format === 'none') return []
  const formatStr = format === 'weekday' ? 'ddd' : 'ddd/DD'
  return allDays.value.map(d => ({
    ...d,
    header: d.key === 'yesterday' ? qDate.formatDate(yesterday.value, formatStr) :
            d.key === 'today' ? qDate.formatDate(today.value, formatStr) :
            qDate.formatDate(tomorrow.value, formatStr)
  }))
})

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

// Long press tracking
const longPressTimer = ref<number | null>(null)
const longPressTarget = ref<{ taskId: string; dateStr: string } | null>(null)
const longPressingRow = ref<string | null>(null)
const longPressTriggered = ref(false)

const onCheckChange = (taskId: string, dateStr: string, value: boolean | null) => {
  // Ignore normal click if long press was triggered
  if (value !== null && longPressTriggered.value) {
    longPressTriggered.value = false
    return
  }

  const task = tasksStore.tasks.find((t) => t.id === taskId)
  if (task) {
    // Long press action - toggle between 'not-done' and pending
    if (value === null) {
      if (task.checkedDates[dateStr] === 'not-done') {
        delete task.checkedDates[dateStr]
      } else {
        task.checkedDates[dateStr] = 'not-done'
      }
    }
    // Normal click - toggle between done and pending
    else {
      if (value) {
        task.checkedDates[dateStr] = true
      } else {
        delete task.checkedDates[dateStr]
      }
    }
    tasksStore.saveTasks(true)
  }
}

const startLongPress = (taskId: string, dateStr: string) => {
  longPressTarget.value = { taskId, dateStr }
  longPressingRow.value = `${taskId}-${dateStr}`
  longPressTriggered.value = false

  longPressTimer.value = window.setTimeout(() => {
    if (longPressTarget.value) {
      longPressTriggered.value = true
      onCheckChange(longPressTarget.value.taskId, longPressTarget.value.dateStr, null)
      longPressTarget.value = null
      longPressingRow.value = null
    }
  }, 500)
}

const cancelLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  longPressTarget.value = null
  longPressingRow.value = null
}

const getCheckboxValue = (task: Task, dateStr: string) => {
  const value = task.checkedDates[dateStr]
  if (value === true) return true
  if (value === 'not-done') return 'indeterminate'
  return false
}

const getCheckboxColor = (task: Task, dateStr: string) => {
  const value = task.checkedDates[dateStr]
  if (value === 'not-done') return 'red'
  return 'green'
}

const isNotDoneYesterday = (task: Task) => {
  const yesterdayDay = { key: 'yesterday', dateStr: yesterdayStr.value }
  return (
    isCheckboxVisible(task, yesterdayDay) &&
    task.checkedDates[yesterdayStr.value] === undefined
  )
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
  /* min-height is now set dynamically via style binding */
}

.task-row,
.task-row-title {
  min-width: 30px;
  /* height is now set dynamically via style binding */
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
  min-width: 45px;
  max-width: 60px;
}

.today-column .q-checkbox * {
  color: $blue-5;
}

.long-pressing {
  background-color: rgba(255, 0, 0, 0.2);
  transition: background-color 0.3s ease-in-out;
}

.body--dark .long-pressing {
  background-color: rgba(255, 0, 0, 0.3);
}

.not-done-yesterday {
  background-color: rgba(255, 0, 0, 0.15);
}

.not-done-yesterday .q-slide-item {
  background-color: rgba(255, 0, 0, 0.15);
}

.body--dark .not-done-yesterday {
  background-color: rgba(255, 0, 0, 0.25);
}

.body--dark .not-done-yesterday .q-slide-item {
  background-color: rgba(255, 0, 0, 0.25);
}
</style>