import {RecurringSyncService} from './recurringSync';
import {createSyncService} from './sync';
import {useUserStore} from '@/stores/modules/user'; // Import user store
import type {RecurringExpenseDefinition} from '@/types/recurringExpense';
import type {Transaction} from '@/types/transaction';

function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + months);
  return newDate;
}

function addYears(date: Date, years: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(date.getFullYear() + years);
  return newDate;
}

function addWeeks(date: Date, weeks: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + weeks * 7);
  return newDate;
}

export const RecurringProcessor = {
  async processRecurringExpenses(): Promise<void> {
    console.log('RecurringProcessor.processRecurringExpenses() called!');
    const userStore = useUserStore();
    const userId = userStore.userInfo.uid;
    if (!userId) {
      console.error(
        'User ID not found in store. Cannot process recurring expenses.'
      );
      return;
    }
    const sync = createSyncService(userId);

    try {
      console.log('Processing recurring expenses for user:', userId);
      const recurringExpenses =
        await RecurringSyncService.getRecurringExpenses(userId);

      if (!recurringExpenses) {
        console.warn(
          'recurringExpenses is null or undefined, skipping processing'
        );
        return;
      }

      if (!Array.isArray(recurringExpenses)) {
        console.error('recurringExpenses is not an array:', recurringExpenses);
        return;
      }

      const today = new Date();

      for (const expense of recurringExpenses) {
        let nextOccurrence = new Date(expense.nextOccurrence);

        // Itera finché la prossima occorrenza è nel passato o oggi
        while (nextOccurrence <= today) {
          console.log(
            `Creating transaction for recurring expense: ${expense.id}`
          );

          const transaction: Transaction = {
            id: crypto.randomUUID(),
            amount: expense.amount,
            categoryId: expense.categoryId,
            description: expense.description,
            timestamp: nextOccurrence.toISOString(),
            userId: userId,
          };

          await sync.updateTransactionAndCache(transaction);

          // Calcola la prossima occorrenza
          let newNextOccurrence: Date;
          switch (expense.frequency) {
            case 'WEEKLY':
              newNextOccurrence = addWeeks(nextOccurrence, 1);
              break;
            case 'MONTHLY':
              newNextOccurrence = addMonths(nextOccurrence, 1);
              break;
            case 'YEARLY':
              newNextOccurrence = addYears(nextOccurrence, 1);
              break;
            default:
              console.warn(`Unknown frequency type: ${expense.frequency}`);
              break;
          }

          // Aggiorna la definizione ricorrente SOLO se la frequenza è valida
          if (newNextOccurrence) {
            nextOccurrence = newNextOccurrence;
            await RecurringSyncService.updateRecurringExpenseAndCache(userId, {
              ...expense,
              nextOccurrence: nextOccurrence.toISOString(),
            });
            // Aggiorna anche l'oggetto expense per i prossimi cicli
            expense.nextOccurrence = nextOccurrence.toISOString();
            console.log(
              `Updated nextOccurrence for recurring expense ${expense.id} to ${nextOccurrence.toISOString()}`
            );
          } else {
            break;
          }
        }
      }

      console.log('Recurring expenses processing complete.');
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
    }
  },
};
