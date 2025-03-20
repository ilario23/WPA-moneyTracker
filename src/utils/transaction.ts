import type {Transaction} from '@/types/transaction';
import {useUserStore} from '@/stores';
const userStore = useUserStore();

export const EMPTY_TRANSACTION: Transaction = {
  id: '',
  amount: null,
  categoryId: '',
  timestamp: new Date().toISOString(),
  description: '',
  userId: userStore.userInfo?.uid,
};
