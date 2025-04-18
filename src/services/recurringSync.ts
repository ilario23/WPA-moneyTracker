import {createCacheService} from './cache';
import {UserRecurringExpenses} from '@/api/database/modules/subcollections/user.recurringExpenses';
import type {RecurringExpenseDefinition} from '@/types/recurringExpense';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';

const cache = createCacheService();

export const RECURRING_EXPENSES_DEFINITIONS = 'recurringExpensesDefinitions';
export const RECURRING_EXPENSES_TOKEN = 'recurringTransactionToken';
const TOKENS_COLLECTION = 'tokens';

export const RecurringSyncService = {
  // Ottieni il token remoto da Firebase
  async getRemoteToken(userId: string): Promise<string | undefined> {
    const docRef = doc(
      DB,
      'users',
      userId,
      TOKENS_COLLECTION,
      RECURRING_EXPENSES_TOKEN
    );
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data()?.token : undefined;
  },

  // Aggiorna il token su Firebase
  async setRemoteToken(userId: string, token: string): Promise<void> {
    const docRef = doc(
      DB,
      'users',
      userId,
      TOKENS_COLLECTION,
      RECURRING_EXPENSES_TOKEN
    );
    await setDoc(docRef, {token});
  },

  // Ottieni tutte le recurring expenses, usando cache se valida
  async getRecurringExpenses(
    userId: string,
    forceRefresh = false
  ): Promise<RecurringExpenseDefinition[]> {
    const store = await cache.getStore();
    const cachedData = store?.recurringExpenses;
    const cachedToken = store?.tokens?.recurringTransactionToken;

    let remoteToken: string | undefined;
    if (!forceRefresh && cachedToken) {
      remoteToken = await RecurringSyncService.getRemoteToken(userId);
      if (remoteToken && remoteToken === cachedToken && cachedData) {
        // Token valido, ritorna dati cache
        return cachedData;
      }
    }

    // Altrimenti, fetch da Firebase
    const recurringExpenses =
      await UserRecurringExpenses.getActiveRecurringExpenses(userId);
    const newToken = new Date().toISOString();
    await cache.setStore({
      ...store,
      recurringExpenses,
      tokens: {
        ...store?.tokens,
        recurringTransactionToken: newToken,
      },
    });
    await RecurringSyncService.setRemoteToken(userId, newToken);
  },

  // Aggiorna una recurring expense e la cache (sincronizza sempre con Firebase)
  async updateRecurringExpenseAndCache(
    userId: string,
    expense: RecurringExpenseDefinition
  ): Promise<void> {
    await UserRecurringExpenses.updateRecurringExpense(
      userId,
      expense.id,
      expense
    );

    // Dopo update, ricarica tutte le recurring expenses da Firebase
    const recurringExpenses =
      await UserRecurringExpenses.getActiveRecurringExpenses(userId);
    const store = await cache.getStore();
    const newToken = new Date().toISOString();
    await cache.setStore({
      ...store,
      recurringExpenses,
      tokens: {
        ...store?.tokens,
        recurringTransactionToken: newToken,
      },
    });
    await RecurringSyncService.setRemoteToken(userId, newToken);
  },

  // Processa una recurring expense scaduta fino a portarla a nextOccurrence futura
  async processExpiredRecurringExpense(
    userId: string,
    expense: RecurringExpenseDefinition,
    processFn: (expense: RecurringExpenseDefinition) => Promise<void>
  ): Promise<number> {
    let count = 0;
    let currentExpense = {...expense};
    const now = new Date();
    while (
      currentExpense.isActive &&
      new Date(currentExpense.nextOccurrence) <= now
    ) {
      await processFn(currentExpense);
      // Recupera la definizione aggiornata (workaround: fetch all and filter)
      const allExpenses =
        await UserRecurringExpenses.getActiveRecurringExpenses(userId);
      const updated = allExpenses.find((e) => e.id === currentExpense.id);
      if (!updated) break;
      currentExpense = updated;
      count++;
    }
    // Aggiorna la cache dopo il processing
    await RecurringSyncService.updateRecurringExpenseAndCache(
      userId,
      currentExpense
    );
    return count;
  },

  async clearRecurringExpensesCache(): Promise<void> {
    const store = await cache.getStore();
    await cache.setStore({
      ...store,
      recurringExpenses: [],
      tokens: {
        ...store?.tokens,
        recurringTransactionToken: '',
      },
    });
  },
};
