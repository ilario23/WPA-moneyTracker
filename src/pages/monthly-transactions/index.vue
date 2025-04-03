<template>
  <div>
    <!-- Year Selector Tabs -->
    <van-tabs
      v-model:active="currentYearIndex"
      swipeable
      sticky
      @change="handleYearChange"
    >
      <van-tab v-for="year in years" :key="year.value" :title="year.text" />
    </van-tabs>

    <!-- Month Selector Tabs -->
    <van-tabs
      v-model:active="currentMonthIndex"
      swipeable
      @change="handleMonthChange"
    >
      <van-tab v-for="month in months" :key="month.value" :title="month.text" />
    </van-tabs>

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
import {ref, computed, onMounted, watch} from 'vue';
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
const currentYearIndex = ref(4); // Since we have 5 years and current year is last
const currentMonthIndex = ref(currentDate.getMonth());
const selectedMonth = ref<[string, string]>([
  currentDate.getFullYear().toString(),
  (currentDate.getMonth() + 1).toString().padStart(2, '0'),
]);
const selectedMonthLabel = ref(formatMonthLabel(selectedMonth.value));

// Computed properties
const currentYear = new Date().getFullYear();
const months = computed(() => {
  const currentDate = new Date();
  const selectedYear = years.value[currentYearIndex.value].value;
  const isCurrentYear = selectedYear === currentDate.getFullYear();

  // If it's current year, only show months up to current month
  const monthsCount = isCurrentYear ? currentDate.getMonth() + 1 : 12;

  return Array.from({length: monthsCount}, (_, i) => {
    const date = new Date(selectedYear, i);
    return {
      text: date.toLocaleString('default', {month: 'long'}),
      value: i,
    };
  });
});

// Aggiungi queste computed properties e refs
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  // Create array in reverse order (newest first)
  return Array.from({length: 5}, (_, i) => ({
    text: String(currentYear - (4 - i)),
    value: currentYear - (4 - i),
  }));
});

// Add a watcher to reset month if needed when year changes
watch(currentYearIndex, () => {
  const currentDate = new Date();
  const selectedYear = years.value[currentYearIndex.value].value;
  const isCurrentYear = selectedYear === currentDate.getFullYear();

  // If we switched to current year and selected month is in the future,
  // reset to current month
  if (isCurrentYear && currentMonthIndex.value > currentDate.getMonth()) {
    currentMonthIndex.value = currentDate.getMonth();
  }
});

// Verify the current year is selected on mount
onMounted(async () => {
  // Ensure we're on the current year
  const currentYear = new Date().getFullYear();
  const yearIndex = years.value.findIndex((y) => y.value === currentYear);
  if (yearIndex !== -1) {
    currentYearIndex.value = yearIndex;
  }

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

  const selectedYear = years.value[currentYearIndex.value].value;
  const startDate = new Date(selectedYear, currentMonthIndex.value, 1);
  const endDate = new Date(selectedYear, currentMonthIndex.value + 1, 0);

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
  console.log('Filtered Transactions:', filteredTransactions.value);
  const total = filteredTransactions.value
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => {
      console.log('Transaction Amount:', t.amount, 'Sum:', sum);
      return sum + (Number(t.amount) || 0);
    }, 0);
  console.log('Total Income:', total);
  return total.toFixed(2);
});

const totalExpense = computed(() => {
  const total = filteredTransactions.value
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0); // Converti `amount` in numero
  return total.toFixed(2);
});

const totalBalance = computed(() => {
  const total = filteredTransactions.value.reduce(
    (sum, t) => sum + (Number(t.amount) || 0), // Converti `amount` in numero
    0
  );
  return total.toFixed(2);
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

function handleMonthChange(index: number) {
  currentMonthIndex.value = index;
}

function handleYearChange(index: number) {
  currentYearIndex.value = index;
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

:deep(.van-tabs) {
  margin-bottom: 8px;
}

:deep(.van-tabs:first-child) {
  margin-bottom: 0;
}

:deep(.van-tabs:first-child .van-tabs__wrap) {
  height: 36px;
}

:deep(.van-tabs:first-child .van-tab) {
  font-size: 14px;
}
</style>
