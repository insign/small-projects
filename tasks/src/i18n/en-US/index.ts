// This is just an example,
// so you can safely delete all default props below

export default {
  failed: 'Action failed',
  success: 'Action was successful',
  tasksTitle: 'Tasks',
  buttons: {
    save: 'Save',
    close: 'Close',
    cancel: 'Cancel',
    submit: 'Submit',
    goHome: 'Go Home',
    sync: 'Sync',
    addTask: 'Add Task',
    recurringTasks: 'Recurring Tasks',
    settings: 'Settings',
    toggleFullscreen: 'Toggle Fullscreen',
  },
  labels: {
    syncId: 'Sync ID',
    language: 'Language',
    fontSize: 'Font Size',
    title: 'Title',
    type: 'Type',
    daysOfWeek: 'Select days of the week',
    taskActions: 'Task Actions',
    noSpecificDays: 'No specific days',
    everyDay: 'Every day',
    taskTypes: {
      daily: 'Daily',
      once: 'Once',
      weekly: 'Weekly',
    },
  },
  hints: {
    syncId: 'This ID is used to sync your data across devices.',
  },
  validation: {
    syncIdRequired: 'Sync ID is required',
    titleRequired: 'Title is required',
  },
  dialogs: {
    settingsTitle: 'Settings',
    addTaskTitle: 'Add Task',
    editTaskTitle: 'Edit Task',
    recurringTasksTitle: 'Recurring Tasks',
    confirmTitle: 'Confirm',
  },
  messages: {
    confirmDelete: 'Are you sure you want to delete "{taskTitle}"?',
    taskDeleted: 'Task deleted.',
    noRecurringTasks: 'No recurring tasks to show.',
    notFound: 'Oops. Nothing here...',
  },
}