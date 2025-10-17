export type TaskType = 'daily' | 'once' | 'weekly'

export interface Task {
  id: string
  title: string
  type: TaskType
  daysOfWeek?: number[] // 0 for Sunday, 1 for Monday, etc.
  checkedDates: Record<string, boolean> // YYYY-MM-DD -> true/false
  order: number
  createdAt: number
}

export interface Settings {
  syncId: string | null
  fontSize: number // in rem
  language: string
  darkMode: 'light' | 'auto' | 'dark'
}