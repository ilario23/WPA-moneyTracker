export type FrequencyType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringExpenseDefinition {
  id: string; // Unique ID for this definition
  userId: string;

  // Transaction template details:
  amount: number;
  categoryId: string;
  description?: string;

  // Recurrence details:
  frequency: FrequencyType;
  startDate: string; // ISO date string (when the recurrence begins)

  // Tracking:
  nextOccurrence: string; // ISO date string (when the next transaction should be generated)
  isActive: boolean; // To enable/disable this recurring expense
}
