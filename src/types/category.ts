export type Category = {
  id: string;
  title: string;
  userId: string;
  color?: string;
  icon?: string;
  budget?: number;
  parentCategoryId?: string;
  excludeFromStat?: boolean;
  active: boolean;
};

export interface CategoryWithType extends Category {
  type: 1 | 2 | 3; // 1: expenses, 2: income, 3: investment
}
