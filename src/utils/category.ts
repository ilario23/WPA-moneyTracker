import type {Category} from '@/types/category';

// Use dynamic import to avoid initialization issues
let userStore: any = null;
async function getUserStore() {
  if (!userStore) {
    userStore = await import('@/stores');
  }
  return userStore.useUserStore();
}

export const EMPTY_CATEGORY: Category = {
  id: crypto.randomUUID(),
  title: '',
  color: '',
  icon: '',
  budget: null,
  parentCategoryId: null,
  excludeFromStat: false,
  active: true,
  userId: '', // Initialize with empty string
};

//export base 3 categories
export const BASE_CATEGORIES: Category[] = [
  {
    id: '533d4482-df54-47e5-b8d8-000000000001',
    title: 'Expenses',
    color: '#f99595',
    icon: 'cart-o',
    parentCategoryId: null,
    userId: '', // Initialize with empty string
    active: true,
  },
  {
    id: '533d4482-df54-47e5-b8d8-000000000002',
    title: 'Incomes',
    color: '#168d3a',
    icon: 'paid',
    parentCategoryId: null,
    userId: '', // Initialize with empty string
    active: true,
  },
  {
    id: '533d4482-df54-47e5-b8d8-000000000003',
    title: 'Investments',
    color: '#0906a7',
    icon: 'balance-o',
    parentCategoryId: null,
    userId: '', // Initialize with empty string
    active: true,
  },
];

(async () => {
  const userStore = await getUserStore();
  EMPTY_CATEGORY.userId = userStore.userInfo?.uid;
  BASE_CATEGORIES.forEach((category) => {
    category.userId = userStore.userInfo?.uid;
  });
})();

export const BASE_CATEGORIES_ID = BASE_CATEGORIES.map(
  (category) => category.id
);
