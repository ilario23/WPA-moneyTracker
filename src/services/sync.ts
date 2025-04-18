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
    try {
      // 1. Prima controllo la cache locale
      const store = await this.cache.getStore();
      const localToken = store?.tokens.categoriesToken;

      // Se non ho dati in cache, sincronizza da Firebase
      if (!store?.categories || !localToken) {
        return await this.syncCategoriesFromFirebase();
      }

      // 2.In questa modialtà dò per scontato che se ho un token locale, ho anche i dati corretti
      // 3. Quindi uso la cache

      console.log('Using cached categories');
      return store.categories;
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw error;
    }
  }

  // create a function to sync categories from firebase
  async syncResetCategories() {
    try {
      // 1. Prima controllo la cache locale
      const store = await this.cache.getStore();
      const localToken = store?.tokens.categoriesToken;

      // Se non ho dati in cache, sincronizza da Firebase
      if (!store?.categories || !localToken) {
        return await this.syncCategoriesFromFirebase();
      }

      // 2. Controllo il token remoto solo se ho un token locale
      const tokenDoc = await getDoc(
        doc(DB, 'users', this.userId, TOKENS_COLLECTION, 'categories')
      );
      const remoteToken = tokenDoc.data()?.token;

      // 3. Se i token corrispondono, usa la cache
      if (remoteToken === localToken) {
        console.log('Using cached categories');
        return store.categories;
      }

      // 4. Se i token sono diversi, sincronizza da Firebase
      return await this.syncCategoriesFromFirebase();
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw error;
    }
  }

  public async syncCategoriesFromFirebase() {
    console.log('Syncing categories from Firebase');
    const tokenDoc = await getDoc(
      doc(DB, 'users', this.userId, TOKENS_COLLECTION, 'categories')
    );
    let remoteToken = tokenDoc.data()?.token;
    if (!remoteToken) {
      console.info('No remote token found for categories');
      // in this case i need to create the token
      remoteToken = new Date().toISOString();
      try {
        await setDoc(
          doc(DB, 'users', this.userId, TOKENS_COLLECTION, 'categories'),
          {token: remoteToken}
        );
        console.log('Transaction saved to Firebase');
      } catch (e) {
        console.error('Error writing to Firestore', e);
      }
      console.info('Created new remote token for categories');
    }

    const categories = await UserCategories.getFirebaseCategories(this.userId);
    await this.cache.updateCategories(
      categories,
      remoteToken || new Date().toISOString()
    );
    return categories;
  }

  async syncTransactionsYear(year: string) {
    // 1. Prima controllo se ho dati in cache e il token locale
    const store = await this.cache.getStore();
    // Safely access nested properties
    const localToken = store?.tokens?.transactionTokens?.[year];

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
    console.log('Syncing from Firebase for year:', year);
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year,
      true // skipSync = true per evitare il loop
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

    // Ottieni tutte le transazioni per quell'anno dalla cache
    const store = await this.cache.getStore();
    const yearTransactions = store.transactions[year] || [];

    // Aggiorna o aggiungi la transazione
    const idx = yearTransactions.findIndex((t) => t.id === transaction.id);
    if (idx !== -1) {
      yearTransactions[idx] = transaction;
    } else {
      yearTransactions.push(transaction);
    }

    // Aggiorna la cache locale
    await this.cache.updateTransactions(yearTransactions, year);

    // Update transaction in Firestore
    try {
      console.log('Saving transaction to Firestore:', transaction);
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
      console.log('Transaction saved to Firestore:', transaction);
    } catch (e) {
      console.error('Error writing to Firestore', e);
    }

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

    // Validate required data
    if (!this.userId || !transaction.id || !year) {
      console.error('❌ Missing required data:', {
        userId: this.userId,
        transactionId: transaction.id,
        year,
      });
      throw new Error('Missing required data for transaction creation');
    }

    try {
      // Create the correct document reference
      const transactionRef = doc(
        DB,
        'users',
        this.userId,
        COLLECTION,
        year,
        'transactions',
        transaction.id
      );
      // Write the transaction with all required fields
      const transactionData = {
        ...transaction,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write directly to the correct path
      await setDoc(transactionRef, transactionData);

      // Verify the write
      const verifyDoc = await getDoc(transactionRef);
      if (!verifyDoc.exists()) {
        throw new Error('Transaction was not written successfully');
      }
    } catch (e) {
      console.error('❌ Error writing transaction:', e);
      throw e;
    }

    try {
      // Update token
      const tokenRef = doc(
        DB,
        'users',
        this.userId,
        TOKENS_COLLECTION,
        `transactions_${year}`
      );
      const newToken = new Date().toISOString();

      await setDoc(tokenRef, {token: newToken});
      console.log('✅ Token updated successfully');

      // Update cache
      const transactions = await UserTransactions.getUserTransactionsByYear(
        this.userId,
        year
      );
      await this.cache.updateTransactions(transactions, year, newToken);
      console.log('✅ Cache updated with new transaction');

      return transaction;
    } catch (e) {
      console.error('❌ Error updating token or cache:', e);
      throw e;
    }
  }

  async updateTransaction(
    transaction: Transaction
  ): Promise<Transaction | null> {
    const year = new Date(transaction.timestamp).getFullYear().toString();

    try {
      console.log('Saving transaction to Firestore:', transaction);
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
      console.log('Transaction saved to Firestore:', transaction);
    } catch (e) {
      console.error('Error writing to Firestore', e);
    }

    try {
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
      console.log('Transaction saved to Firebase');
    } catch (e) {
      console.error('Error writing to Firestore', e);
    }

    // Get updated transactions and update cache
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year
    );

    const newToken = new Date().toISOString(); // Define newToken
    await this.cache.updateTransactions(transactions, year, newToken);

    return transaction;
  }

  async deleteTransaction(transactionId: string, year: string): Promise<void> {
    try {
      console.log('Saving transaction to Firestore:', transactionId);
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
      console.log('Transaction saved to Firestore:', transactionId);
    } catch (e) {
      console.error('Error writing to Firestore', e);
    }

    try {
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
      console.log('Transaction saved to Firebase');
    } catch (e) {
      console.error('Error writing to Firestore', e);
    }

    // Get updated transactions and update cache
    const transactions = await UserTransactions.getUserTransactionsByYear(
      this.userId,
      year
    );

    const newToken = new Date().toISOString(); // Define newToken
    await this.cache.updateTransactions(transactions, year, newToken);
  }
}

export const createSyncService = (userId: string) => new SyncService(userId);
