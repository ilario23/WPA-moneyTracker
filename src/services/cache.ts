import {openDB} from 'idb';
import type {DBSchema, IDBPDatabase} from 'idb';
import type {CategoryWithType} from '@/types/category';
import type {Transaction} from '@/types/transaction';
import type {CacheStore} from '@/types/cache';

interface MyDB extends DBSchema {
  cache: {
    key: string;
    value: CacheStore;
  };
}

class CacheService {
  private db: IDBPDatabase<MyDB>;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.initDB();
  }

  private async initDB() {
    this.db = await openDB<MyDB>(`finance-app-${this.userId}`, 1, {
      upgrade(db) {
        db.createObjectStore('cache');
      },
    });
  }

  async getStore(): Promise<CacheStore | null> {
    return await this.db.get('cache', 'store');
  }

  private async setStoreData(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.parse(JSON.stringify(value));
      await this.db.put('cache', serializedValue, key);
    } catch (error) {
      console.error('Error setting store:', error);
      throw error;
    }
  }

  async setStore(store: CacheStore): Promise<void> {
    await this.setStoreData('store', store);
  }

  async updateCategories(categories: CategoryWithType[], token: string) {
    const store = (await this.getStore()) || {
      categories: [],
      transactions: {},
      tokens: {categoriesToken: '', transactionTokens: {}},
    };

    store.categories = categories;
    store.tokens.categoriesToken = token;
    await this.setStore(store);
  }

  async updateTransactions(
    transactions: Transaction[],
    token?: string
  ): Promise<void> {
    const store = (await this.getStore()) || {
      categories: [],
      transactions: {},
      tokens: {categoriesToken: '', transactionTokens: {}},
    };

    const year = new Date().getFullYear().toString();
    store.transactions[year] = transactions.map((t) => ({
      ...t,
      timestamp:
        t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
    }));

    if (token) {
      store.tokens.transactionTokens[year] = token;
    }

    await this.setStore(store);
  }
}

export const createCacheService = (userId: string) => new CacheService(userId);
