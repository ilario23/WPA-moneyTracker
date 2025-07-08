import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import type {Reminder, ReminderFormData} from '@/types/reminder';
import {ReminderSyncService} from '@/services/reminderSync';

export const useRemindersStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([]);
  const lastSyncTime = ref<number | null>(null);
  const isLoading = ref(false);

  // Computed properties
  const futureReminders = computed(() => {
    const now = new Date();
    return reminders.value.filter(reminder => 
      new Date(reminder.dueTime) > now
    ).sort((a, b) => 
      new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
    );
  });

  const remindersByDate = computed(() => {
    const grouped: Record<string, Reminder[]> = {};
    reminders.value.forEach(reminder => {
      const dateKey = new Date(reminder.dueTime).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(reminder);
    });
    return grouped;
  });

  // Actions
  const fetchReminders = async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && lastSyncTime.value && Date.now() - lastSyncTime.value < 30000) {
      // Cache is fresh (less than 30 seconds old)
      return;
    }

    try {
      isLoading.value = true;
      const fetchedReminders = await ReminderSyncService.getReminders(userId, forceRefresh);
      reminders.value = fetchedReminders;
      lastSyncTime.value = Date.now();
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const addReminder = async (userId: string, reminderData: ReminderFormData) => {
    try {
      const reminderId = await ReminderSyncService.addReminder(userId, reminderData);
      const newReminder: Reminder = {
        id: reminderId,
        ...reminderData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reminders.value.push(newReminder);
      return reminderId;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (
    userId: string, 
    reminderId: string, 
    updateData: Partial<ReminderFormData>
  ) => {
    try {
      await ReminderSyncService.updateReminder(userId, reminderId, updateData);
      const index = reminders.value.findIndex(r => r.id === reminderId);
      if (index !== -1) {
        reminders.value[index] = {
          ...reminders.value[index],
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (userId: string, reminderId: string) => {
    try {
      await ReminderSyncService.deleteReminder(userId, reminderId);
      reminders.value = reminders.value.filter(r => r.id !== reminderId);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  const getRemindersForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return remindersByDate.value[dateKey] || [];
  };

  const clearCache = () => {
    reminders.value = [];
    lastSyncTime.value = null;
  };

  return {
    // State
    reminders,
    lastSyncTime,
    isLoading,
    
    // Computed
    futureReminders,
    remindersByDate,
    
    // Actions
    fetchReminders,
    addReminder,
    updateReminder,
    deleteReminder,
    getRemindersForDate,
    clearCache,
  };
}); 