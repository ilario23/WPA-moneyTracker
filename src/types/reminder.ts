export type ReminderSchedule = '1_DAY' | '2_DAYS' | '1_WEEK' | '1_MONTH';

export interface Reminder {
  id: string;
  name: string;
  dueTime: string; // ISO string
  reminderSchedule: ReminderSchedule[];
  userId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ReminderFormData {
  name: string;
  dueTime: string;
  reminderSchedule: ReminderSchedule[];
}

export interface ReminderNotification {
  reminderId: string;
  reminderName: string;
  dueTime: string;
  notificationTime: string;
  isShown: boolean;
} 