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
