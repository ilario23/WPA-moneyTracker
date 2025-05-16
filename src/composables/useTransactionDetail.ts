import {ref} from 'vue';
import type {Transaction} from '@/types/transaction';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';

export function useTransactionDetail() {
  const showDetail = ref(false);
  const selectedTransaction = ref<Transaction | null>(null);

  const showTransactionDetail = (transaction: Transaction | null) => {
    if (!transaction) return;
    selectedTransaction.value = {...transaction}; // Create a copy
    showDetail.value = true;
  };

  const hideTransactionDetail = () => {
    showDetail.value = false;
    setTimeout(() => {
      selectedTransaction.value = null;
    }, 300); // Wait for transition to complete
  };

  return {
    showDetail,
    selectedTransaction,
    showTransactionDetail,
    hideTransactionDetail,
  };
}
