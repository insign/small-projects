<template>
  <q-page class="q-pa-sm">
    <!-- Headers -->
    <div v-if="settingsStore.dayHeaderFormat !== 'none'" class="row no-wrap q-gutter-x-xs">
      <div class="col text-weight-medium text-center" :style="headerStyle">&nbsp;</div>
      <div
        v-for="day in days"
        :key="day.key"
        class="col-1 text-weight-medium text-center day-column q-mb-sm"
        :style="headerStyle"
      >
        {{ day.header }}
      </div>
    </div>

    <!-- Unchecked Tasks -->
    <draggable
      v-model="uncheckedTasks"
      item-key="id"
      group="tasks"
      class="task-list"
      drag-class="drag-active"
      @end="onDragEnd"
      :delay="150"
      delay-on-touch-only
    >
      <template #item="{ element: task, index }">
        <div
          :class="{
            'task-row--even': index % 2 === 0,
            'not-done-yesterday': isNotDoneYesterday(task),
          }"
        >
          <div class="row no-wrap q-gutter-x-xs task-row" :style="{ height: taskRowHeight }">
            <div class="col">
              <q-item
                class="q-pa-xs"
                @dblclick="onDoubleClickEdit(task)"
                clickable
                :style="{
                  backgroundColor: getShiftBackgroundColor(task)
                    || (isNotDoneYesterday(task)
                      ? $q.dark.isActive ? 'rgba(255, 0, 0, 0.25)' : 'rgba(255, 0, 0, 0.15)'
                      : (index % 2 === 0
                        ? $q.dark.isActive ? '#1e1e1e' : '#f5f5f5'
                        : 'transparent'
                      )
                    )
                }"
              >
                <q-item-section :style="{ fontSize: `${settingsStore.fontSize}rem` }">
                  {{ getTaskTitleWithEmoji(task) }}
                </q-item-section>
              </q-item>
            </div>
            <div
              v-for="day in allDays"
              :key="day.key"
              class="col-1 day-column"
              :class="{
                'today-column': day.key === 'today',
                'long-pressing': longPressingRow === `${task.id}-${day.dateStr}`,
              }"
            >
              <q-item class="flex-center">
                <q-checkbox
                  v-if="isCheckboxVisible(task, day)"
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
                  @touchcancel="cancelLongPress"
                />
              </q-item>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Checked Tasks (Not Draggable) -->
    <div
      v-for="(task, index) in checkedTasks"
      :key="task.id"
      class="task-list checked-list"
      :class="{
        'task-row--even': (uncheckedTasks.length + index) % 2 === 0,
        'not-done-yesterday': isNotDoneYesterday(task),
      }"
    >
      <div class="row no-wrap q-gutter-x-xs task-row" :style="{ height: taskRowHeight }">
        <div class="col">
          <q-item
            class="text-grey-7 q-pa-xs"
            @dblclick="onDoubleClickEdit(task)"
            clickable
            :style="{
              backgroundColor: getShiftBackgroundColor(task)
                || (isNotDoneYesterday(task)
                  ? $q.dark.isActive ? 'rgba(255, 0, 0, 0.25)' : 'rgba(255, 0, 0, 0.15)'
                  : ((uncheckedTasks.length + index) % 2 === 0
                    ? $q.dark.isActive ? '#1e1e1e' : '#f5f5f5'
                    : 'transparent'
                  )
                )
            }"
          >
            <q-item-section :style="{ fontSize: `${settingsStore.fontSize}rem` }">
              {{ getTaskTitleWithEmoji(task) }}
            </q-item-section>
          </q-item>
        </div>
        <div
          v-for="day in allDays"
          :key="day.key"
          class="col-1 day-column"
          :class="{ 'long-pressing': longPressingRow === `${task.id}-${day.dateStr}` }"
        >
          <q-item class="flex-center">
            <q-checkbox
              v-if="isCheckboxVisible(task, day)"
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
              @touchcancel="cancelLongPress"
            />
          </q-item>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import draggable from 'vuedraggable';
import { useQuasar, date as qDate } from 'quasar';
import { useTasksStore } from 'src/stores/tasks';
import { useSettingsStore } from 'src/stores/settings';
import { useDateManager } from 'src/composables/useDateManager';
import type { Task } from 'src/types';
import TaskDialog from 'src/components/dialogs/TaskDialog.vue';

const $q = useQuasar();
const tasksStore = useTasksStore();
const settingsStore = useSettingsStore();
const { today, yesterday, tomorrow, todayStr, yesterdayStr, tomorrowStr } = useDateManager();

const checkboxSize = computed(() => `${settingsStore.checkboxSize}px`);
const headerStyle = computed(() => ({
  fontSize: `${settingsStore.fontSize * 0.7}rem`,
}));
const taskRowHeight = computed(() => `${settingsStore.taskRowHeight}px`);

/**
 * Get current time shift based on the current hour
 * @returns 'morning', 'afternoon', 'night', or null
 */
const getCurrentShift = (): 'morning' | 'afternoon' | 'night' | null => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 13) {
    return 'morning';
  } else if (hour >= 13 && hour < 18) {
    return 'afternoon';
  } else if (hour >= 18 || hour < 2) {
    return 'night';
  }

  return null;
};

/**
 * Get task title with emoji prefix based on shift
 * @param task - The task to check
 * @returns Title with emoji or just title
 */
const getTaskTitleWithEmoji = (task: Task): string => {
  if (!task.shift || task.shift === 'none') {
    return task.title;
  }

  const emojis = {
    morning: '🌅',
    afternoon: '☀️',
    night: '🌙',
  };

  const emoji = emojis[task.shift] || '';
  return emoji ? `${emoji} ${task.title}` : task.title;
};

/**
 * Get background color for task based on shift and current time
 * @param task - The task to check
 * @returns Background color string or null
 */
const getShiftBackgroundColor = (task: Task): string | null => {
  // Check if task has a shift defined
  if (!task.shift || task.shift === 'none') {
    return null;
  }

  // Check if current time matches the task's shift
  const currentShift = getCurrentShift();
  if (currentShift !== task.shift) {
    return null;
  }

  // Get task status for today
  const todayStatus = task.checkedDates[todayStr.value];

  // Only apply color if task is pending (not done and not marked as not-done)
  if (todayStatus === true || todayStatus === 'not-done') {
    return null;
  }

  // Define colors for each shift
  const isDark = $q.dark.isActive;
  const colors = {
    morning: isDark ? '#4A4A2A' : '#FFF9C4', // Light yellow/amber
    afternoon: isDark ? '#5A3A1A' : '#FFB74D', // Orange
    night: isDark ? '#3D2A4A' : '#CE93D8', // Purple
  };

  return colors[task.shift] || null;
};

const isTaskVisibleForToday = (task: Task): boolean => {
  if (task.type === 'once') {
    const checkedDays = Object.keys(task.checkedDates).filter((d) => task.checkedDates[d]);
    if (checkedDays.length === 0) return true;
    return checkedDays.some((d) => d === todayStr.value || d === yesterdayStr.value);
  }
  if (task.type === 'daily') return true;
  if (task.type === 'weekly' && Array.isArray(task.daysOfWeek) && task.daysOfWeek.length > 0) {
    const yesterdayDay = new Date(yesterdayStr.value.replace(/-/g, '/')).getDay();
    const todayDay = new Date(todayStr.value.replace(/-/g, '/')).getDay();
    const tomorrowDay = new Date(tomorrowStr.value.replace(/-/g, '/')).getDay();
    return (
      task.daysOfWeek.includes(yesterdayDay) ||
      task.daysOfWeek.includes(todayDay) ||
      task.daysOfWeek.includes(tomorrowDay)
    );
  }
  return false;
};

const visibleTasks = computed(() => tasksStore.tasks.filter(isTaskVisibleForToday));

const uncheckedTasks = computed({
  get: () =>
    visibleTasks.value
      .filter((t) => {
        const status = t.checkedDates[todayStr.value];
        return status !== true && status !== 'not-done';
      })
      .sort((a, b) => {
        const aPendingYesterday = isNotDoneYesterday(a);
        const bPendingYesterday = isNotDoneYesterday(b);

        // Priorizar tarefas pendentes ontem
        if (aPendingYesterday && !bPendingYesterday) return -1;
        if (!aPendingYesterday && bPendingYesterday) return 1;

        // Função auxiliar para obter a prioridade do turno
        const getShiftPriority = (shift?: string): number => {
          switch (shift) {
            case 'morning':
              return 1;
            case 'afternoon':
              return 2;
            case 'night':
              return 3;
            default:
              return 4; // 'none' ou undefined
          }
        };

        // Ordenar por prioridade do turno
        const aShiftPriority = getShiftPriority(a.shift);
        const bShiftPriority = getShiftPriority(b.shift);
        if (aShiftPriority !== bShiftPriority) {
          return aShiftPriority - bShiftPriority;
        }

        // Se ambos têm a mesma prioridade de turno, ordenar por order
        return a.order - b.order;
      }),
  set: (newOrder) => {
    tasksStore.updateTaskOrder(newOrder);
  },
});

const checkedTasks = computed(() =>
  visibleTasks.value
    .filter((t) => {
      const status = t.checkedDates[todayStr.value];
      return status === true || status === 'not-done';
    })
    .sort((a, b) => a.order - b.order),
);

const allDays = computed(() => [
  { key: 'yesterday', dateStr: yesterdayStr.value },
  { key: 'today', dateStr: todayStr.value },
  { key: 'tomorrow', dateStr: tomorrowStr.value },
]);

const days = computed(() => {
  const format = settingsStore.dayHeaderFormat;
  if (format === 'none') return [];
  const formatStr = format === 'weekday' ? 'ddd' : 'ddd/DD';
  return allDays.value.map((d) => ({
    ...d,
    header:
      d.key === 'yesterday'
        ? qDate.formatDate(yesterday.value, formatStr)
        : d.key === 'today'
          ? qDate.formatDate(today.value, formatStr)
          : qDate.formatDate(tomorrow.value, formatStr),
  }));
});

const isCheckboxVisible = (task: Task, day: { key: string; dateStr: string }): boolean => {
  if (task.type === 'once') {
    return day.key === 'today' || !!task.checkedDates[day.dateStr];
  }
  if (task.type === 'weekly' && Array.isArray(task.daysOfWeek)) {
    // Correctly handle timezone by parsing date string parts
    // new Date('YYYY-MM-DD') is parsed as UTC midnight, which can cause off-by-one day errors in some timezones.
    // Using replace to handle Safari compatibility with date strings.
    const dayOfWeek = new Date(day.dateStr.replace(/-/g, '/')).getDay();
    return task.daysOfWeek.includes(dayOfWeek);
  }
  return task.type === 'daily';
};

// Long press tracking
const longPressTimer = ref<number | null>(null);
const longPressTarget = ref<{ taskId: string; dateStr: string } | null>(null);
const longPressingRow = ref<string | null>(null);
const longPressTriggered = ref(false);

const onCheckChange = (taskId: string, dateStr: string, value: boolean | null) => {
  // Ignore normal click if long press was triggered
  if (value !== null && longPressTriggered.value) {
    longPressTriggered.value = false;
    return;
  }

  const task = tasksStore.tasks.find((t) => t.id === taskId);
  if (task) {
    // Long press action - toggle between 'not-done' and pending
    if (value === null) {
      if (task.checkedDates[dateStr] === 'not-done') {
        delete task.checkedDates[dateStr];
      } else {
        task.checkedDates[dateStr] = 'not-done';
      }
    }
    // Normal click - toggle between done and pending
    else {
      if (value) {
        task.checkedDates[dateStr] = true;
      } else {
        delete task.checkedDates[dateStr];
      }
    }
    tasksStore.saveTasks(true);
  }
};

const startLongPress = (taskId: string, dateStr: string) => {
  longPressTarget.value = { taskId, dateStr };
  longPressingRow.value = `${taskId}-${dateStr}`;
  longPressTriggered.value = false;

  longPressTimer.value = window.setTimeout(() => {
    if (longPressTarget.value) {
      longPressTriggered.value = true;
      onCheckChange(longPressTarget.value.taskId, longPressTarget.value.dateStr, null);
      longPressTarget.value = null;
      longPressingRow.value = null;
    }
  }, 500);
};

const cancelLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  longPressTarget.value = null;
  longPressingRow.value = null;
};

const getCheckboxValue = (task: Task, dateStr: string) => {
  const value = task.checkedDates[dateStr];
  if (value === true) return true;
  if (value === 'not-done') return 'indeterminate';
  return false;
};

const getCheckboxColor = (task: Task, dateStr: string) => {
  const value = task.checkedDates[dateStr];
  if (value === 'not-done') return 'red';
  return 'green';
};

const isNotDoneYesterday = (task: Task) => {
  const yesterdayDay = { key: 'yesterday', dateStr: yesterdayStr.value };
  return (
    isCheckboxVisible(task, yesterdayDay) && task.checkedDates[yesterdayStr.value] === undefined
  );
};

const onDragEnd = () => {
  // v-model handles the reordering, and the computed setter updates the store
};

const onDoubleClickEdit = (task: Task) => {
  $q.dialog({
    component: TaskDialog,
    componentProps: { task },
  });
};
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

/* The wrapper div that contains each task row */
.task-list > div > div,
.task-list.checked-list > div {
  /* This is the div with task-row--even and not-done-yesterday classes */
  width: 100%;
  padding: 0;
}

.drag-active {
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

.body--dark .not-done-yesterday {
  background-color: rgba(255, 0, 0, 0.25);
}
</style>
