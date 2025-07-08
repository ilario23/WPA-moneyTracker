import {DB} from '@/config/firebase';
import {doc, getDoc, setDoc, serverTimestamp} from 'firebase/firestore';
import {UserReminders} from '@/api/database/modules/subcollections/user.reminders';
import type {Reminder} from '@/types/reminder';

export class ReminderSyncService {
  private static getTokenDoc(userId: string) {
    return doc(DB, 'users', userId, 'tokens', 'remindersToken');
  }

  static async getRemindersToken(userId: string): Promise<string | null> {
    try {
      const tokenDoc = await getDoc(this.getTokenDoc(userId));
      if (tokenDoc.exists()) {
        return tokenDoc.data()?.timestamp || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting reminders token:', error);
      return null;
    }
  }

  static async updateRemindersToken(userId: string): Promise<void> {
    try {
      await setDoc(this.getTokenDoc(userId), {
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating reminders token:', error);
      throw error;
    }
  }

  static async getReminders(userId: string, forceRefresh = false): Promise<Reminder[]> {
    try {
      const currentToken = await this.getRemindersToken(userId);
      const cacheToken = localStorage.getItem(`remindersToken_${userId}`);
      
      // If we have a cache token and it matches the server token, and we're not forcing refresh
      if (!forceRefresh && cacheToken && currentToken && cacheToken === currentToken.toString()) {
        const cachedReminders = localStorage.getItem(`reminders_${userId}`);
        if (cachedReminders) {
          return JSON.parse(cachedReminders);
        }
      }

      // Fetch fresh data from server
      const reminders = await UserReminders.getUserReminders(userId);
      
      // Update cache
      localStorage.setItem(`reminders_${userId}`, JSON.stringify(reminders));
      if (currentToken) {
        localStorage.setItem(`remindersToken_${userId}`, currentToken.toString());
      }
      
      return reminders;
    } catch (error) {
      console.error('Error syncing reminders:', error);
      throw error;
    }
  }

  static async addReminder(userId: string, reminderData: any): Promise<string> {
    try {
      const reminderId = await UserReminders.addReminder(userId, reminderData);
      await this.updateRemindersToken(userId);
      
      // Clear cache to force refresh on next fetch
      localStorage.removeItem(`reminders_${userId}`);
      localStorage.removeItem(`remindersToken_${userId}`);
      
      return reminderId;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  static async updateReminder(userId: string, reminderId: string, updateData: any): Promise<void> {
    try {
      await UserReminders.updateReminder(userId, reminderId, updateData);
      await this.updateRemindersToken(userId);
      
      // Clear cache to force refresh on next fetch
      localStorage.removeItem(`reminders_${userId}`);
      localStorage.removeItem(`remindersToken_${userId}`);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  static async deleteReminder(userId: string, reminderId: string): Promise<void> {
    try {
      await UserReminders.deleteReminder(userId, reminderId);
      await this.updateRemindersToken(userId);
      
      // Clear cache to force refresh on next fetch
      localStorage.removeItem(`reminders_${userId}`);
      localStorage.removeItem(`remindersToken_${userId}`);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  static clearCache(userId: string): void {
    localStorage.removeItem(`reminders_${userId}`);
    localStorage.removeItem(`remindersToken_${userId}`);
  }
} 