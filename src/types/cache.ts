import type {CategoryWithType} from './category';
import type {Transaction} from './transaction';

export interface CacheStore {
  categories: CategoryWithType[];
  transactions: {
    [year: string]: Transaction[];
  };
  tokens: {
    categoriesToken: string;
    transactionTokens: {
      [year: string]: string;
    };
  };
}
