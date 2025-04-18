import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {DB} from '@/config/firebase'; // Corrected import name
import type {RecurringExpenseDefinition} from '@/types/recurringExpense';

const RECURRING_EXPENSES_COLLECTION = 'recurringExpenses';

export const UserRecurringExpenses = {
  // Add a new recurring expense definition
  async addRecurringExpense(
    userId: string,
    expenseData: Omit<RecurringExpenseDefinition, 'id' | 'userId'>
  ): Promise<string> {
    try {
      const userDocRef = doc(DB, 'users', userId); // Use DB
      const recurringExpensesColRef = collection(
        userDocRef,
        RECURRING_EXPENSES_COLLECTION
      );
      const docRef = await addDoc(recurringExpensesColRef, {
        ...expenseData,
        userId: userId, // Ensure userId is stored
      });
      console.log('Recurring expense definition added with ID: ', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding recurring expense definition: ', error);
      throw new Error('Failed to add recurring expense definition.');
    }
  },

  // Get all active recurring expense definitions for a user
  async getActiveRecurringExpenses(
    userId: string
  ): Promise<RecurringExpenseDefinition[]> {
    try {
      const userDocRef = doc(DB, 'users', userId); // Use DB
      const recurringExpensesColRef = collection(
        userDocRef,
        RECURRING_EXPENSES_COLLECTION
      );
      const q = query(recurringExpensesColRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      const expenses: RecurringExpenseDefinition[] = [];
      querySnapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...(doc.data() as Omit<RecurringExpenseDefinition, 'id'>),
        });
      });
      return expenses;
    } catch (error) {
      console.error('Error getting active recurring expenses: ', error);
      throw new Error('Failed to retrieve active recurring expenses.');
    }
  },

  // Update a recurring expense definition (e.g., update nextOccurrence or isActive)
  async updateRecurringExpense(
    userId: string,
    expenseId: string,
    updateData: Partial<RecurringExpenseDefinition>
  ): Promise<void> {
    try {
      const expenseDocRef = doc(
        DB, // Use DB
        'users',
        userId,
        RECURRING_EXPENSES_COLLECTION,
        expenseId
      );
      await updateDoc(expenseDocRef, updateData);
      console.log(
        `Recurring expense definition ${expenseId} updated successfully.`
      );
    } catch (error) {
      console.error(
        `Error updating recurring expense definition ${expenseId}: `,
        error
      );
      throw new Error('Failed to update recurring expense definition.');
    }
  },

  // Delete a recurring expense definition (optional, might not be needed initially)
  async deleteRecurringExpense(
    userId: string,
    expenseId: string
  ): Promise<void> {
    try {
      const expenseDocRef = doc(
        DB, // Use DB
        'users',
        userId,
        RECURRING_EXPENSES_COLLECTION,
        expenseId
      );
      await deleteDoc(expenseDocRef);
      console.log(
        `Recurring expense definition ${expenseId} deleted successfully.`
      );
    } catch (error) {
      console.error(
        `Error deleting recurring expense definition ${expenseId}: `,
        error
      );
      throw new Error('Failed to delete recurring expense definition.');
    }
  },
};
