import type { Transaction } from '@/types/transaction';
import {useUserStore} from '@/stores';
const userStore = useUserStore();


export const EMPTY_TRANSACTION: Transaction = {
  id: '',
  amount: 0,
  categoryId: '',
  timestamp: new Date(),
  description: '',
  userId: userStore.userInfo?.uid
};
