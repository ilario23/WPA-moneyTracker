import type {CategoryWithType} from './category';
import type {Transaction} from './transaction';
import type {RecurringExpenseDefinition} from './recurringExpense'; // Import the new type

export interface CacheStore {
  categories: CategoryWithType[];
  recurringExpenses: RecurringExpenseDefinition[]; // Add recurring expenses array
  transactions: {
    [year: string]: Transaction[];
  };
  tokens: {
    categoriesToken: string;
    transactionTokens: {
      [year: string]: string;
    };
    recurringTransactionToken: string; // Add token for recurring transactions
  };
}
