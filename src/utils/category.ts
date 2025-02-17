import type {Category} from '@/types/category';

export const EMPTY_CATEGORY: Category = {
  id: '',
  title: '',
  userId: '',
  color: '',
  icon: '',
  budget: 0,
  parentCategoryId: '',
  excludeFromStat: false,
  active: true,
};
