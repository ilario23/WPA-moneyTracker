<template>
  <div>
    <!-- Intestazione con filtri -->
    <van-nav-bar :title="$t('transaction.monthlyTransactions')" />

    <van-cell-group inset class="month-selector mt-16">
      <van-field
        v-model="selectedMonthLabel"
        readonly
        :label="$t('transaction.month')"
        right-icon="arrow-down"
        @click="showMonthPicker = true"
      />
    </van-cell-group>

    <!-- Riepilogo -->
    <van-card class="summary-card mt-16">
      <template #title>
        <div class="summary-title">{{ $t('transaction.monthlySummary') }}</div>
      </template>
      <template #desc>
        <div class="summary-amount">
          <div class="income">
            {{ $t('transaction.income') }}: €{{ totalIncome }}
          </div>
          <div class="expense">
            {{ $t('transaction.expense') }}: €{{ totalExpense }}
          </div>
          <div class="balance">
            {{ $t('transaction.balance') }}: €{{ totalBalance }}
          </div>
        </div>
      </template>
    </van-card>

    <!-- Lista transazioni -->
    <van-divider>{{ $t('transaction.transactions') }}</van-divider>

    <van-empty
      v-if="filteredTransactions.length === 0"
      :description="$t('transaction.noTransactions')"
    />

    <div v-else>
      <div v-for="(group, date) in groupedTransactions" :key="date">
        <van-divider>{{ formatDate(date) }}</van-divider>

        <van-swipe-cell v-for="transaction in group" :key="transaction.id">
          <van-card
            :price="transaction.amount"
            :desc="transaction.description || ''"
            :title="getCategoryName(transaction.categoryId)"
            currency="€"
            :style="{
              backgroundColor: `${getCategoryColor(transaction.categoryId)}30`,
            }"
          >
            <template #thumb>
              <van-icon
                :name="getCategoryIcon(transaction.categoryId)"
                style="font-size: 24px"
              />
            </template>
          </van-card>
        </van-swipe-cell>
      </div>
    </div>

    <!-- Month Picker -->
    <van-popup v-model:show="showMonthPicker" position="bottom" round>
      <van-date-picker
        v-model="selectedMonth"
        type="year-month"
        :title="$t('transaction.selectMonth')"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onConfirmMonth"
        @cancel="showMonthPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, reactive} from 'vue';
import {useUserStore} from '@/stores';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {showNotify} from 'vant';
import {useI18n} from 'vue-i18n';
import type {Transaction} from '@/types/transaction';
import type {Category} from '@/types/category';

const {t} = useI18n();
const userStore = useUserStore();
const userId = userStore.userInfo.uid;

// State variables
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const showMonthPicker = ref(false);

// Date range for month picker
const minDate = new Date(new Date().getFullYear() - 4, 0, 1);
const maxDate = new Date();

// Default to current month
const currentDate = new Date();
const selectedMonth = ref<[string, string]>([
  currentDate.getFullYear().toString(),
  (currentDate.getMonth() + 1).toString().padStart(2, '0'),
]);
const selectedMonthLabel = ref(formatMonthLabel(selectedMonth.value));

// Fetch data on component mount
onMounted(async () => {
  await fetchData();
});

// Fetch transactions and categories
async function fetchData() {
  loading.value = true;
  try {
    // Fetch transactions
    transactions.value = await UserTransactions.getUsertransactions(userId);

    // Fetch categories
    categories.value = await UserCategories.getUserCategories(userId);
  } catch (error) {
    console.error('Error fetching data:', error);
    showNotify({type: 'danger', message: t('transaction.fetchError')});
  } finally {
    loading.value = false;
  }
}

// Filter transactions by selected month
const filteredTransactions = computed(() => {
  if (!transactions.value.length) return [];

  const [year, month] = selectedMonth.value;
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

  return transactions.value.filter((transaction) => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
});

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {};

  filteredTransactions.value.forEach((transaction) => {
    const date = new Date(transaction.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
  });

  // Sort dates in descending order (newest first)
  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .reduce<Record<string, Transaction[]>>((result, date) => {
      result[date] = groups[date];
      return result;
    }, {});
});

// Calculate totals
const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
    .toFixed(2);
});

const totalExpense = computed(() => {
  return filteredTransactions.value
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    .toFixed(2);
});

const totalBalance = computed(() => {
  return filteredTransactions.value
    .reduce((sum, t) => sum + (t.amount || 0), 0)
    .toFixed(2);
});

// Helper functions
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatMonthLabel([year, month]: [string, string]) {
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, {year: 'numeric', month: 'long'});
}

function onConfirmMonth({selectedValues}: {selectedValues: [string, string]}) {
  selectedMonth.value = selectedValues;
  selectedMonthLabel.value = formatMonthLabel(selectedValues);
  showMonthPicker.value = false;
}

// Category helper functions
function getCategoryName(categoryId: string) {
  const category = categories.value.find((c) => c.id === categoryId);
  return category ? category.title : t('transaction.unknownCategory');
}

function getCategoryColor(categoryId: string) {
  const category = categories.value.find((c) => c.id === categoryId);
  return category?.color || '#cccccc';
}

function getCategoryIcon(categoryId: string) {
  const category = categories.value.find((c) => c.id === categoryId);
  return category?.icon || 'question-o';
}
</script>

<route lang="json5">
{
  name: 'monthly-transactions',
  meta: {
    title: 'Monthly Transactions',
    i18n: 'menus.monthlyTransactions',
  },
}
</route>

<style scoped>
.month-selector {
  margin-bottom: 16px;
}

.summary-card {
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: #f8f8f8;
}

.summary-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.summary-amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.income {
  color: #07c160;
}

.expense {
  color: #ee0a24;
}

.balance {
  font-weight: bold;
  margin-top: 4px;
}

:deep(.van-card__price) {
  color: inherit;
}

:deep(.van-card__price--integer) {
  font-size: 16px;
}
</style>
