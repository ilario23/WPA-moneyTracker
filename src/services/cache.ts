import {openDB} from 'idb';
import type {DBSchema, IDBPDatabase} from 'idb';
import type {CategoryWithType} from '@/types/category';
import type {Transaction} from '@/types/transaction';
import type {CacheStore} from '@/types/cache';

interface MyDB extends DBSchema {
  cache: {
    key: string;
    value: any;
  };
}

class CacheService {
  private db: Promise<IDBPDatabase<MyDB>>;
  private STORE_KEY = 'store';

  constructor() {
    this.db = this.initDB();
  }

  private initDB(): Promise<IDBPDatabase<MyDB>> {
    return openDB<MyDB>('finance-app', 1, {
      upgrade(db) {
        db.createObjectStore('cache');
      },
    });
  }

  async getStore(): Promise<CacheStore | null> {
    try {
      const db = await this.db;
      return await db.get('cache', this.STORE_KEY);
    } catch (error) {
      console.error('Error getting store:', error);
      return null;
    }
  }

  async setStore(store: CacheStore): Promise<void> {
    try {
      const db = await this.db;
      await db.put('cache', store, this.STORE_KEY);
    } catch (error) {
      console.error('Error setting store:', error);
      throw error;
    }
  }

  async clearStore(): Promise<void> {
    try {
      const db = await this.db;
      await db.delete('cache', this.STORE_KEY);
    } catch (error) {
      console.error('Error clearing store:', error);
      throw error;
    }
  }

  async updateTransactions(
    transactions: Transaction[],
    year: string,
    token?: string
  ): Promise<void> {
    const store = (await this.getStore()) || {
      categories: [],
      recurringExpenses: [], // Initialize recurringExpenses
      transactions: {},
      tokens: {
        categoriesToken: '',
        transactionTokens: {},
        recurringTransactionToken: '', // Initialize recurringTransactionToken
      },
    };

    // Ensure store.transactions exists
    store.transactions = store.transactions || {};

    // Aggiorna le transazioni per l'anno specifico - gestiamo il timestamp come stringa
    store.transactions[year] = transactions.map((t) => ({
      ...t,
      timestamp:
        typeof t.timestamp === 'object'
          ? (t.timestamp as Date).toISOString()
          : t.timestamp,
    }));

    // Ensure store.tokens and store.tokens.transactionTokens exist
    store.tokens = store.tokens || {
      categoriesToken: '',
      transactionTokens: {},
      recurringTransactionToken: '',
    };
    store.tokens.transactionTokens = store.tokens.transactionTokens || {};

    // Se c'è un nuovo token, aggiornalo
    if (token) {
      store.tokens.transactionTokens[year] = token;
    }

    await this.setStore(store);
  }

  async updateCategories(
    categories: CategoryWithType[],
    token: string
  ): Promise<void> {
    const store = (await this.getStore()) || {
      categories: [],
      recurringExpenses: [], // Initialize recurringExpenses
      transactions: {},
      tokens: {
        categoriesToken: '',
        transactionTokens: {},
        recurringTransactionToken: '', // Initialize recurringTransactionToken
      },
    };

    store.categories = categories;
    store.tokens.categoriesToken = token;
    await this.setStore(store);
  }
}

export const createCacheService = () => new CacheService();
