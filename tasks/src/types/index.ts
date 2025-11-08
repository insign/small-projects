export type TaskType = 'daily' | 'once' | 'weekly';

export type Shift = 'none' | 'morning' | 'afternoon' | 'night';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  daysOfWeek?: number[]; // 0 for Sunday, 1 for Monday, etc.
  checkedDates: Record<string, boolean | 'not-done'>; // YYYY-MM-DD -> true (done) / 'not-done' / undefined (pending)
  order: number;
  createdAt: number;
  shift?: Shift; // Optional shift for task prioritization
}

export type DayHeaderFormat = 'none' | 'weekday' | 'weekday-number';

export interface Settings {
  syncId: string | null;
  fontSize: number; // in rem
  language: string;
  darkMode: 'light' | 'auto' | 'dark';
  screensaverTimeout: number; // in minutes, 0 to disable
  screensaverDuration: number; // in seconds, 0 for 'until interaction'
  requireFullscreen: boolean; // require fullscreen for task operations
  screensaverConfetti: boolean; // enable confetti animation in screensaver
  checkboxSize: number; // in pixels
  taskRowHeight: number; // in pixels
  dayHeaderFormat: DayHeaderFormat; // format for day headers
}
