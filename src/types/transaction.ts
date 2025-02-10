export type Transaction = {
    id: string;
    amount: number;
    categoryId: string;
    timestamp: Date;
    description?: string;
    userId: string;
  };
  