import {doc, getDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import type {Transaction} from '@/types/transaction';
import {setLoading} from '@/services/utils';
import {createSyncService} from '@/services/sync';

const TOKENS_COLLECTION = 'tokens';

export const UserTransactions = {
  /**
   * Get transactions for a specific year
   */
  getUserTransactionsByYear: async (userId: string, year: string) => {
    setLoading(true);
    try {
      const sync = createSyncService(userId);
      return await sync.syncTransactionsYear(year);
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
      const sync = createSyncService(userId);
      return await sync.createTransaction(transaction);
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
      const sync = createSyncService(userId);
      return await sync.updateTransaction(transaction);
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
      const sync = createSyncService(userId);
      await sync.deleteTransaction(transactionId, year);
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
