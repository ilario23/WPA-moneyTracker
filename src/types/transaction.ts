export type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  timestamp: string;
  description?: string;
  userId: string;
};
