import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import type {Transaction} from '@/types/transaction';
import {setLoading} from '@/services/utils';

const COLLECTION = 'transactions';
const TOKENS_COLLECTION = 'tokens';

export const UserTransactions = {
  /**
   * Get transactions for a specific year
   */
  getUserTransactionsByYear: async (userId: string, year: string) => {
    setLoading(true);
    try {
      const snaps = await getDocs(
        collection(DB, 'users', userId, COLLECTION, year, 'transactions')
      );
      return snaps.docs.map((snap) => snap.data() as Transaction);
    } finally {
      setLoading(false);
    }
  },

  /**
   * Create a new transaction
   */
  createUserTransaction: async (userId: string, transaction: Transaction) => {
    setLoading(true);
    try {
      const year = new Date(transaction.timestamp).getFullYear().toString();

      // Save transaction
      await setDoc(
        doc(
          DB,
          'users',
          userId,
          COLLECTION,
          year,
          'transactions',
          transaction.id
        ),
        transaction
      );

      // Update year's token
      const newToken = new Date().toISOString();
      await setDoc(
        doc(DB, 'users', userId, TOKENS_COLLECTION, `transactions_${year}`),
        {token: newToken}
      );

      return transaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      return null;
    } finally {
      setLoading(false);
    }
  },

  /**
   * Update an existing transaction
   */
  updateUserTransaction: async (userId: string, transaction: Transaction) => {
    setLoading(true);
    try {
      const year = new Date(transaction.timestamp).getFullYear().toString();

      // Update transaction
      await setDoc(
        doc(
          DB,
          'users',
          userId,
          COLLECTION,
          year,
          'transactions',
          transaction.id
        ),
        transaction,
        {merge: true}
      );

      // Update year's token
      const newToken = new Date().toISOString();
      await setDoc(
        doc(DB, 'users', userId, TOKENS_COLLECTION, `transactions_${year}`),
        {token: newToken}
      );

      return transaction;
    } catch (err) {
      console.error('Error updating transaction:', err);
      return null;
    } finally {
      setLoading(false);
    }
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (
    userId: string,
    transactionId: string,
    year: string
  ): Promise<void> => {
    setLoading(true);
    try {
      // Elimina direttamente la transazione usando il percorso corretto con l'anno fornito
      const transactionRef = doc(
        DB,
        'users',
        userId,
        COLLECTION,
        year,
        'transactions',
        transactionId
      );
      await deleteDoc(transactionRef);

      // Aggiorna il token dell'anno
      const newToken = new Date().toISOString();
      await setDoc(
        doc(DB, 'users', userId, TOKENS_COLLECTION, `transactions_${year}`),
        {token: newToken}
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },

  /**
   * Get the transaction token for a specific year
   */
  getYearToken: async (
    userId: string,
    year: string
  ): Promise<string | null> => {
    const tokenDoc = await getDoc(
      doc(DB, 'users', userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    return tokenDoc.data()?.token || null;
  },
};
