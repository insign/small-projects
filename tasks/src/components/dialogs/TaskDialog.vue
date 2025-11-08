<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 400px">
      <q-form @submit="onSaveClick">
        <q-card-section>
          <div class="text-h6">
            {{ isEditing ? t('dialogs.editTaskTitle') : t('dialogs.addTaskTitle') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-input
            v-model="title"
            :label="t('labels.title')"
            autofocus
            :rules="[(val) => !!val || t('validation.titleRequired')]"
            lazy-rules
          />
          <q-select
            v-model="type"
            :options="taskTypeOptions"
            :label="t('labels.type')"
            emit-value
            map-options
          />
          <div>
            <div class="text-caption q-mb-sm">{{ t('labels.shift') }}</div>
            <div class="q-gutter-sm">
              <q-item tag="label" v-ripple>
                <q-item-section avatar>
                  <q-radio v-model="shift" val="none" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('labels.shifts.none') }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple>
                <q-item-section avatar>
                  <q-radio v-model="shift" val="morning" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('labels.shifts.morning') }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple>
                <q-item-section avatar>
                  <q-radio v-model="shift" val="afternoon" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('labels.shifts.afternoon') }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple>
                <q-item-section avatar>
                  <q-radio v-model="shift" val="night" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('labels.shifts.night') }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </div>
          <div v-if="type === 'weekly'">
            <div class="text-caption q-mb-sm">{{ t('labels.daysOfWeek') }}</div>
            <!-- Replaced QBtnToggle with a group of individual QBtn components -->
            <div class="q-gutter-sm">
              <q-btn
                v-for="day in dayOptions"
                :key="day.value"
                push
                glossy
                :color="daysOfWeek.includes(day.value) ? 'primary' : 'white'"
                :text-color="daysOfWeek.includes(day.value) ? 'white' : 'primary'"
                :label="day.label"
                @click="toggleDay(day.value)"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="isEditing"
            flat
            color="negative"
            :label="t('buttons.delete')"
            @click="onDeleteClick"
          />
          <q-btn flat :label="t('buttons.cancel')" @click="onDialogCancel" />
          <q-btn color="primary" :label="t('buttons.save')" type="submit" :disable="!title" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from 'src/stores/tasks';
import type { Task, TaskType, Shift } from 'src/types';

const props = defineProps({
  task: {
    type: Object as () => Task | null,
    default: null,
  },
});

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const tasksStore = useTasksStore();

const isEditing = !!props.task;

const title = ref(props.task?.title || '');
const type = ref<TaskType>(props.task?.type || 'daily');
const shift = ref<Shift>(props.task?.shift || 'none');

// Robust initialization: ensures daysOfWeek is always an array.
const getInitialDays = () => {
  const taskDays = props.task?.daysOfWeek;
  if (props.task?.type !== 'weekly' || taskDays === undefined || taskDays === null) {
    return [];
  }
  // Coerce to array if it's not, handling corrupted data (e.g., a single number).
  return Array.isArray(taskDays) ? taskDays : [taskDays];
};
const daysOfWeek = ref(getInitialDays());

const taskTypeOptions = computed(() => [
  { label: t('labels.taskTypes.daily'), value: 'daily' },
  { label: t('labels.taskTypes.once'), value: 'once' },
  { label: t('labels.taskTypes.weekly'), value: 'weekly' },
]);

const dayOptions = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

const toggleDay = (dayValue: number) => {
  const index = daysOfWeek.value.indexOf(dayValue);
  if (index === -1) {
    daysOfWeek.value.push(dayValue);
  } else {
    daysOfWeek.value.splice(index, 1);
  }
  console.log(
    'daysOfWeek updated in TaskDialog:',
    daysOfWeek.value,
    '(is array:',
    Array.isArray(daysOfWeek.value),
    ')',
  );
};

const onSaveClick = () => {
  const taskData: { title: string; type: TaskType; daysOfWeek?: number[]; shift?: Shift } = {
    title: title.value,
    type: type.value,
  };

  // Only add shift if it's not 'none'
  if (shift.value !== 'none') {
    taskData.shift = shift.value;
  }

  if (type.value === 'weekly') {
    taskData.daysOfWeek = daysOfWeek.value.sort((a, b) => a - b); // Sort for consistency
  }

  if (isEditing && props.task) {
    tasksStore.updateTask({ id: props.task.id, ...taskData });
  } else {
    tasksStore.addTask(taskData);
  }
  onDialogOK();
};

const onDeleteClick = () => {
  if (props.task) {
    tasksStore.deleteTask(props.task.id);
    onDialogOK();
  }
};
</script>
