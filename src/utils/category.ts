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

//export base 3 categories
export const BASE_CATEGORIES: Category[] = [
  {
    id: '533d4482-df54-47e5-b8d8-000000000001',
    title: 'Expenses',
    color: '#f99595',
    icon: 'cart-o"',
    parentCategoryId: null,
    userId: userStore.userInfo?.uid,
    active: true,
  },
  {
    id: '533d4482-df54-47e5-b8d8-000000000002',
    title: 'Incomes',
    color: '#168d3a',
    icon: 'paid',
    parentCategoryId: null,
    userId: userStore.userInfo?.uid,
    active: true,
  },
  {
    id: '533d4482-df54-47e5-b8d8-000000000003',
    title: 'Investments',
    color: '#0906a7',
    icon: 'balance-o',
    parentCategoryId: null,
    userId: userStore.userInfo?.uid,
    active: true,
  },
];
export const BASE_CATEGORIES_ID = BASE_CATEGORIES.map(
  (category) => category.id
);
