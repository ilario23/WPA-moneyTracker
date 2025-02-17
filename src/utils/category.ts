import type {Category} from '@/types/category';
import {useUserStore} from '@/stores';
const userStore = useUserStore();

export const EMPTY_CATEGORY: Category = {
  id: crypto.randomUUID(),
  title: '',
  userId: userStore.userInfo?.uid,
  color: '',
  icon: '',
  budget: null,
  parentCategoryId: null,
  excludeFromStat: false,
  active: true,
};
