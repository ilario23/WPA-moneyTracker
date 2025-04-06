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

  async setStore(store: CacheStore): Promise<void> {
    await this.db.put('cache', store, 'store');
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
    year: string,
    transactions: Transaction[],
    token: string
  ) {
    const store = (await this.getStore()) || {
      categories: [],
      transactions: {},
      tokens: {categoriesToken: '', transactionTokens: {}},
    };

    store.transactions[year] = transactions;
    store.tokens.transactionTokens[year] = token;
    await this.setStore(store);
  }
}

export const createCacheService = (userId: string) => new CacheService(userId);
