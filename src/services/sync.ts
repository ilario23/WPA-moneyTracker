import {doc, getDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import {createCacheService} from './cache';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import type {Transaction} from '@/types/transaction';

const TOKENS_COLLECTION = 'tokens';

export class SyncService {
  private cache;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.cache = createCacheService(userId);
  }

  async syncCategories() {
    // Get remote token
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, 'categories')
    );
    const remoteToken = tokenDoc.data()?.token;

    // Get local store
    const store = await this.cache.getStore();
    const localToken = store?.tokens.categoriesToken;

    if (!remoteToken || remoteToken !== localToken) {
      // Need to sync
      const categories = await UserCategories.getCategoriesWithType(
        this.userId
      );
      await this.cache.updateCategories(categories, remoteToken);
      return categories;
    }

    // Use cached data
    return store.categories;
  }

  async syncTransactionsYear(year: string) {
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const remoteToken = tokenDoc.data()?.token;

    const store = await this.cache.getStore();
    const localToken = store?.tokens.transactionTokens[year];

    if (!remoteToken || remoteToken !== localToken) {
      const transactions = await UserTransactions.getUserTransactionsByYear(
        this.userId,
        year
      );
      await this.cache.updateTransactions(year, transactions, remoteToken);
      return transactions;
    }

    // Use cached data
    return store.transactions[year] || [];
  }

  async updateTransactionAndCache(transaction: Transaction): Promise<void> {
    const year = new Date(transaction.timestamp).getFullYear().toString();

    // Get current token before operation
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const remoteToken = tokenDoc.data()?.token;
    const store = await this.cache.getStore();
    const localToken = store?.tokens.transactionTokens[year];

    // If tokens match
    if (remoteToken === localToken) {
      // Update transaction in Firestore
      await UserTransactions.createUserTransaction(this.userId, transaction);

      // Get new token after update
      const updatedTokenDoc = await getDoc(
        doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
      );
      const newToken = updatedTokenDoc.data()?.token;

      // Update local cache directly
      if (store) {
        const yearTransactions = [...(store.transactions[year] || [])];
        yearTransactions.push(transaction);
        await this.cache.updateTransactions(year, yearTransactions, newToken);
      }
    } else {
      // Tokens don't match, do full sync
      await UserTransactions.createUserTransaction(this.userId, transaction);
      await this.syncTransactionsYear(year);
    }
  }
}

export const createSyncService = (userId: string) => new SyncService(userId);
