import {doc, getDoc, setDoc, deleteDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import {createCacheService} from './cache';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import type {Transaction} from '@/types/transaction';

const TOKENS_COLLECTION = 'tokens';
const COLLECTION = 'transactions';

export class SyncService {
  private cache;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.cache = createCacheService();
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
    // 1. Prima controllo se ho dati in cache e il token locale
    const store = await this.cache.getStore();
    const localToken = store?.tokens.transactionTokens[year];

    // Se non ho token locale, devo per forza sincronizzare con Firebase
    if (!localToken) {
      return await this.syncFromFirebase(year);
    }

    // 2. Solo se ho un token locale, controllo quello remoto
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const remoteToken = tokenDoc.data()?.token;

    // 3. Se i token corrispondono, uso i dati in cache
    if (remoteToken === localToken) {
      return store.transactions[year] || [];
    }

    // 4. Se i token sono diversi, sincronizzo con Firebase
    return await this.syncFromFirebase(year);
  }

  // Metodo helper per la sincronizzazione con Firebase
  private async syncFromFirebase(year: string) {
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year
    );

    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const remoteToken = tokenDoc.data()?.token;

    await this.cache.updateTransactions(transactions, year, remoteToken);
    return transactions;
  }

  async updateTransactionAndCache(transaction: Transaction): Promise<void> {
    const year = new Date(transaction.timestamp).getFullYear().toString();

    // Update transaction in Firestore
    await UserTransactions.createUserTransaction(this.userId, transaction);

    // Get updated transactions and token
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year
    );
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const token = tokenDoc.data()?.token;

    // Update cache
    await this.cache.updateTransactions(transactions, year, token);
  }

  async deleteTransactionAndCache(
    transaction: Transaction,
    year: string
  ): Promise<void> {
    // Delete from Firebase
    await UserTransactions.deleteTransaction(this.userId, transaction.id, year);

    // Get updated transactions and token
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year
    );
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, `transactions_${year}`)
    );
    const token = tokenDoc.data()?.token;

    // Update cache
    await this.cache.updateTransactions(transactions, year, token);
  }

  async createTransaction(
    transaction: Transaction
  ): Promise<Transaction | null> {
    const year = new Date(transaction.timestamp).getFullYear().toString();

    try {
      // Save to Firebase
      await setDoc(
        doc(
          DB,
          'users',
          this.userId,
          COLLECTION,
          year,
          'transactions',
          transaction.id
        ),
        transaction
      );

      // Update token
      const newToken = new Date().toISOString();
      await setDoc(
        doc(
          DB,
          'users',
          this.userId,
          TOKENS_COLLECTION,
          `transactions_${year}`
        ),
        {token: newToken}
      );

      // Get updated transactions and update cache
      const transactions = await UserTransactions.getUserTransactionsByYear(
        this.userId,
        year
      );
      await this.cache.updateTransactions(transactions, year, newToken);

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  async updateTransaction(
    transaction: Transaction
  ): Promise<Transaction | null> {
    const year = new Date(transaction.timestamp).getFullYear().toString();

    try {
      // Update in Firebase
      await setDoc(
        doc(
          DB,
          'users',
          this.userId,
          COLLECTION,
          year,
          'transactions',
          transaction.id
        ),
        transaction,
        {merge: true}
      );

      // Update token
      const newToken = new Date().toISOString();
      await setDoc(
        doc(
          DB,
          'users',
          this.userId,
          TOKENS_COLLECTION,
          `transactions_${year}`
        ),
        {token: newToken}
      );

      // Get updated transactions and update cache
      const transactions = await UserTransactions.getUserTransactionsByYear(
        this.userId,
        year
      );
      await this.cache.updateTransactions(transactions, year, newToken);

      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }

  async deleteTransaction(transactionId: string, year: string): Promise<void> {
    try {
      // Delete from Firebase
      await deleteDoc(
        doc(
          DB,
          'users',
          this.userId,
          COLLECTION,
          year,
          'transactions',
          transactionId
        )
      );

      // Update token
      const newToken = new Date().toISOString();
      await setDoc(
        doc(
          DB,
          'users',
          this.userId,
          TOKENS_COLLECTION,
          `transactions_${year}`
        ),
        {token: newToken}
      );

      // Get updated transactions and update cache
      const transactions = await UserTransactions.getUserTransactionsByYear(
        this.userId,
        year
      );
      await this.cache.updateTransactions(transactions, year, newToken);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

export const createSyncService = (userId: string) => new SyncService(userId);
