import { showNotify } from 'vant';
import { useRemindersStore } from '@/stores/modules/reminders';
import type { Reminder, ReminderSchedule } from '@/types/reminder';

export class ReminderNotificationService {
  private static checkInterval: NodeJS.Timeout | null = null;

  static startNotificationService(userId: string) {
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkForDueReminders(userId);
    }, 5 * 60 * 1000);

    // Also check immediately when starting
    this.checkForDueReminders(userId);
  }

  static stopNotificationService() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private static async checkForDueReminders(userId: string) {
    try {
      const remindersStore = useRemindersStore();
      await remindersStore.fetchReminders(userId);
      
      const now = new Date();
      const reminders = remindersStore.reminders;

      for (const reminder of reminders) {
        const dueTime = new Date(reminder.dueTime);
        
        // Check if reminder is due within the next 24 hours
        const timeDiff = dueTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff > 0 && hoursDiff <= 24) {
          // Check if we should show notification based on schedule
          const shouldNotify = this.shouldShowNotification(reminder, hoursDiff);
          
          if (shouldNotify) {
            this.showReminderNotification(reminder, hoursDiff);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for due reminders:', error);
    }
  }

  private static shouldShowNotification(reminder: Reminder, hoursDiff: number): boolean {
    const scheduleMap = {
      '1_DAY': 24,
      '2_DAYS': 48,
      '1_WEEK': 168, // 7 * 24
      '1_MONTH': 720, // 30 * 24 (approximate)
    };

    for (const schedule of reminder.reminderSchedule) {
      const scheduleHours = scheduleMap[schedule];
      if (hoursDiff <= scheduleHours && hoursDiff > scheduleHours - 1) {
        return true;
      }
    }

    return false;
  }

  private static showReminderNotification(reminder: Reminder, hoursDiff: number) {
    const timeText = hoursDiff < 1 
      ? 'less than 1 hour' 
      : hoursDiff < 24 
        ? `${Math.round(hoursDiff)} hours` 
        : `${Math.round(hoursDiff / 24)} days`;

    showNotify({
      type: 'warning',
      message: `Reminder: ${reminder.name} is due in ${timeText}`,
      duration: 5000,
    });
  }

  static checkReminderSchedule(_reminder: Reminder, dueTime: Date): ReminderSchedule[] {
    const now = new Date();
    const timeDiff = dueTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    const activeSchedules: ReminderSchedule[] = [];

    if (hoursDiff <= 24 && hoursDiff > 0) {
      activeSchedules.push('1_DAY');
    }
    if (hoursDiff <= 48 && hoursDiff > 0) {
      activeSchedules.push('2_DAYS');
    }
    if (hoursDiff <= 168 && hoursDiff > 0) {
      activeSchedules.push('1_WEEK');
    }
    if (hoursDiff <= 720 && hoursDiff > 0) {
      activeSchedules.push('1_MONTH');
    }

    return activeSchedules;
  }
} 