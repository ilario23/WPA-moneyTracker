import type {CategoryWithType} from './category';
import type {Transaction} from './transaction';

export interface CacheToken {
  categoriesToken: string;
  transactionTokens: Record<string, string>; // year -> token
}

export interface CacheStore {
  categories: CategoryWithType[];
  transactions: Record<string, Transaction[]>; // year -> transactions
  tokens: CacheToken;
}
