import {DB} from '@/config/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type {Reminder, ReminderFormData} from '@/types/reminder';

export class UserReminders {
  private static getRemindersCollection(userId: string) {
    return collection(DB, 'users', userId, 'reminders');
  }

  private static getReminderDoc(userId: string, reminderId: string) {
    return doc(DB, 'users', userId, 'reminders', reminderId);
  }

  static async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      const remindersRef = this.getRemindersCollection(userId);
      const q = query(remindersRef, orderBy('dueTime', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reminder[];
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw error;
    }
  }

  static async addReminder(userId: string, reminderData: ReminderFormData): Promise<string> {
    try {
      const remindersRef = this.getRemindersCollection(userId);
      const now = new Date().toISOString();
      
      const reminderToAdd = {
        ...reminderData,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(remindersRef, reminderToAdd);
      return docRef.id;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  static async updateReminder(
    userId: string, 
    reminderId: string, 
    updateData: Partial<ReminderFormData>
  ): Promise<void> {
    try {
      const reminderRef = this.getReminderDoc(userId, reminderId);
      const now = new Date().toISOString();
      
      await updateDoc(reminderRef, {
        ...updateData,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  static async deleteReminder(userId: string, reminderId: string): Promise<void> {
    try {
      const reminderRef = this.getReminderDoc(userId, reminderId);
      await deleteDoc(reminderRef);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  static async getReminderById(userId: string, reminderId: string): Promise<Reminder | null> {
    try {
      const remindersRef = this.getRemindersCollection(userId);
      const q = query(remindersRef, where('__name__', '==', reminderId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Reminder;
    } catch (error) {
      console.error('Error fetching reminder by ID:', error);
      throw error;
    }
  }
} 