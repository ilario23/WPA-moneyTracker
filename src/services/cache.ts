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
  private db: IDBPDatabase<MyDB>;
  private STORE_KEY = 'store';

  constructor() {
    this.initDB();
  }

  private async initDB() {
    this.db = await openDB<MyDB>('finance-app', 1, {
      upgrade(db) {
        db.createObjectStore('cache');
      },
    });
  }

  async getStore(): Promise<CacheStore | null> {
    try {
      return await this.db.get('cache', this.STORE_KEY);
    } catch (error) {
      console.error('Error getting store:', error);
      return null;
    }
  }

  async setStore(store: CacheStore): Promise<void> {
    try {
      await this.db.put('cache', store, this.STORE_KEY);
    } catch (error) {
      console.error('Error setting store:', error);
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
      transactions: {},
      tokens: {
        categoriesToken: '',
        transactionTokens: {},
      },
    };

    // Aggiorna le transazioni per l'anno specifico - gestiamo il timestamp come stringa
    store.transactions[year] = transactions.map((t) => ({
      ...t,
      timestamp:
        typeof t.timestamp === 'object'
          ? (t.timestamp as Date).toISOString()
          : t.timestamp,
    }));

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
      transactions: {},
      tokens: {
        categoriesToken: '',
        transactionTokens: {},
      },
    };

    store.categories = categories;
    store.tokens.categoriesToken = token;
    await this.setStore(store);
  }
}

export const createCacheService = () => new CacheService();
