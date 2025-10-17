import { defineStore } from 'pinia'
import { LocalStorage, date as qDate, uid } from 'quasar'
import { ref, computed } from 'vue'
import type { Task, TaskType } from 'src/types'
import { useSettingsStore } from './settings'
import { useDateManager } from 'src/composables/useDateManager'

const TASKS_KEY_SUFFIX = '_tasks'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const version = ref(0)

  const getTasksKey = () => {
    const settingsStore = useSettingsStore()
    const syncId = settingsStore.syncId
    if (!syncId) return null
    return `${syncId}${TASKS_KEY_SUFFIX}`
  }

  const getVersionKey = () => {
    const settingsStore = useSettingsStore()
    const syncId = settingsStore.syncId
    if (!syncId) return null
    return `${syncId}_tasks_version`
  }

  function saveTasks(incrementVersion = false) {
    const key = getTasksKey()
    if (!key) return
    LocalStorage.set(key, tasks.value)
    if (incrementVersion) {
      setVersion(version.value + 1)
    }
  }

  function loadTasks() {
    const key = getTasksKey()
    if (key && LocalStorage.has(key)) {
      tasks.value = LocalStorage.getItem<Task[]>(key) || []
    } else {
      tasks.value = []
    }
    loadVersion()
  }

  function loadVersion() {
    const key = getVersionKey()
    version.value = (key ? LocalStorage.getItem<number>(key) : 0) || 0
  }

  function setVersion(newVersion: number) {
    version.value = newVersion
    const key = getVersionKey()
    if (key) {
      LocalStorage.set(key, newVersion)
    }
  }

  function addTask(taskData: { title: string; type: TaskType; daysOfWeek?: number[] | number }) {
    console.log('[TasksStore] addTask received:', JSON.parse(JSON.stringify(taskData)))
    const newOrder =
      tasks.value.length > 0 ? Math.max(...tasks.value.map((t) => t.order)) + 1 : 0
    const newTask: Task = {
      id: uid(),
      title: taskData.title,
      type: taskData.type,
      checkedDates: {},
      order: newOrder,
      createdAt: Date.now(),
    }
    if (taskData.type === 'weekly') {
      // Ensure daysOfWeek is always an array
      if (Array.isArray(taskData.daysOfWeek)) {
        newTask.daysOfWeek = taskData.daysOfWeek
      } else if (taskData.daysOfWeek !== undefined && taskData.daysOfWeek !== null) {
        // This part handles if a single number is passed
        newTask.daysOfWeek = [taskData.daysOfWeek]
      } else {
        newTask.daysOfWeek = []
      }
    }
    tasks.value.push(newTask)
    console.log('[TasksStore] New task added:', JSON.parse(JSON.stringify(newTask)))
    saveTasks(true)
  }

  function updateTask(updatedTask: Partial<Task> & { id: string }) {
    console.log('[TasksStore] updateTask received:', JSON.parse(JSON.stringify(updatedTask)))
    const task = tasks.value.find((t) => t.id === updatedTask.id)
    if (task) {
      // Explicitly handle daysOfWeek before assigning the rest
      const { daysOfWeek, ...restOfUpdate } = updatedTask
      Object.assign(task, restOfUpdate)

      if (task.type !== 'weekly') {
        delete task.daysOfWeek
      } else {
        if (daysOfWeek !== undefined) {
          task.daysOfWeek = Array.isArray(daysOfWeek) ? daysOfWeek : [daysOfWeek].flat()
        } else if (!Array.isArray(task.daysOfWeek)) {
          // Ensure it's an array if it exists but isn't one
          task.daysOfWeek = []
        }
      }
      console.log('[TasksStore] Task updated:', JSON.parse(JSON.stringify(task)))
      saveTasks(true)
    }
  }

  function deleteTask(taskId: string) {
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
    saveTasks(true)
  }

  function updateTaskOrder(newOrderedTasks: Task[]) {
    const orderMap = new Map(newOrderedTasks.map((t, index) => [t.id, index]))
    tasks.value.forEach((task) => {
      if (orderMap.has(task.id)) {
        task.order = orderMap.get(task.id)!
      }
    })
    saveTasks(true)
  }

  function handleDateRollover() {
    const anteOntem = qDate.subtractFromDate(new Date(), { days: 2 })
    const anteOntemStr = qDate.formatDate(anteOntem, 'YYYY-MM-DD')

    const tasksToKeep: Task[] = []
    let changed = false

    for (const task of tasks.value) {
      if (task.type === 'once' && task.checkedDates[anteOntemStr] === true) {
        changed = true
        continue // Skip, effectively deleting it
      }

      if (task.checkedDates[anteOntemStr] !== undefined) {
        delete task.checkedDates[anteOntemStr]
        changed = true
      }

      tasksToKeep.push(task)
    }

    if (changed) {
      tasks.value = tasksToKeep
      saveTasks(true)
    }
  }

  const recurringTasks = computed(() => {
    const { yesterday, today, tomorrow } = useDateManager()
    return tasks.value.filter(task => {
      if (task.type !== 'weekly' || !Array.isArray(task.daysOfWeek)) {
        return false
      }
      const yesterdayDay = yesterday.value.getDay()
      const todayDay = today.value.getDay()
      const tomorrowDay = tomorrow.value.getDay()
      const visibleDays = [yesterdayDay, todayDay, tomorrowDay]

      // A task is recurring if it has days of the week defined and ALL of them are not visible today, yesterday or tomorrow
      return task.daysOfWeek.every(day => !visibleDays.includes(day))
    })
  })

  return {
    tasks,
    version,
    loadTasks,
    saveTasks,
    setVersion,
    addTask,
    updateTask,
    deleteTask,
    updateTaskOrder,
    handleDateRollover,
    recurringTasks,
  }
})