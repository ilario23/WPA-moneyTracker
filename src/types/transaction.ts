export type Transaction = {
  id: string;
  amount: number | null;
  categoryId: string;
  timestamp: string;
  description?: string;
  userId: string;
};
