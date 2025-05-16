<template>
  <div>
    <div class="tabs-search-container">
      <!-- Year Selector Tabs -->
      <van-tabs
        v-model:active="currentYearIndex"
        swipeable
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
        <van-tab
          v-for="month in months"
          :key="month.value"
          :title="month.text"
        />
      </van-tabs>

      <!-- Tabs and Search Icon Container -->

      <van-icon
        :name="showSearch ? 'close' : 'search'"
        size="24"
        class="search-icon"
        @click="showSearch = !showSearch"
      />
    </div>

    <transition name="slide-down">
      <van-search
        v-if="showSearch"
        v-model="searchQuery"
        :placeholder="$t('transaction.searchPlaceholder')"
        shape="round"
        class="search-input"
      />
    </transition>

    <!-- Riepilogo -->
    <van-card class="summary-card">
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
          <div v-if="Number(totalInvestment) > 0" class="investment">
            {{ $t('transaction.investment') }}: €{{ totalInvestment }}
          </div>
          <!-- Show saving rate only if there is income -->
          <div
            v-if="Number(totalIncome) > 0"
            class="saving-rate"
            :class="{
              income: Number(savingRate.basic.absolute) > 0,
              expense: Number(savingRate.basic.absolute) < 0,
            }"
          >
            {{ $t('transaction.savingRate') }}: €{{
              savingRate.basic.absolute
            }}
            ({{ savingRate.basic.percentage }}%)
          </div>
          <div
            v-if="Number(totalIncome) > 0 && Number(totalInvestment) > 0"
            class="saving-rate with-investments"
          >
            {{ $t('transaction.savingRateWithInvestments') }}: €{{
              savingRate.withInvestments.absolute
            }}
            ({{ savingRate.withInvestments.percentage }}%)
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

    <div v-else class="transaction-list">
      <div v-for="(group, date) in groupedTransactions" :key="date">
        <van-swipe-cell v-for="transaction in group" :key="transaction.id">
          <template #left>
            <van-button
              square
              type="primary"
              text="Edit"
              class="edit-button"
              @click="handleEdit(transaction.id)"
            />
          </template>
          <template #right>
            <van-button
              square
              type="danger"
              text="Delete"
              class="delete-button"
              @click="handleDelete(transaction.id)"
            />
          </template>
          <van-card
            :price="transaction.amount"
            :desc="transaction.description || ''"
            currency="€"
            class="transaction-card"
          >
            <template #title>
              <div class="transaction-title">
                <span>{{ getCategoryName(transaction.categoryId) }}</span>
                <van-tag plain>{{ formatDate(date) }}</van-tag>
              </div>
            </template>
            <template #thumb>
              <div
                class="category-indicator"
                :style="{
                  backgroundColor: getCategoryColor(transaction.categoryId),
                }"
              ></div>
              <van-icon
                :name="getCategoryIcon(transaction.categoryId)"
                class="category-icon"
                :style="{
                  color: getCategoryColor(transaction.categoryId),
                }"
                size="36px"
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
import {ref, computed, onMounted, nextTick, watch} from 'vue';
import {useUserStore} from '@/stores';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
// Removed incorrect Vant imports from previous attempt, will add specific ones later if needed by auto-import
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {showNotify} from 'vant';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {RecurringProcessor} from '@/services/recurringProcessor';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

const {t, locale} = useI18n();
const userStore = useUserStore();
const userId = userStore.userInfo.uid;
const router = useRouter();

// State variables for search
const showSearch = ref(false); // Controls search bar visibility
const searchQuery = ref(''); // Holds the search input value

// Existing State variables
const transactions = ref<Transaction[]>([]);
const categories = ref<CategoryWithType[]>([]); // Change the type
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
const months = computed(() => {
  const currentDate = new Date();
  const selectedYear = years.value[currentYearIndex.value].value;
  const isCurrentYear = selectedYear === currentDate.getFullYear();
  const monthsCount = isCurrentYear ? currentDate.getMonth() + 1 : 12;

  const monthsTabs = Array.from({length: monthsCount}, (_, i) => {
    const date = new Date(selectedYear, i);
    return {
      text: date.toLocaleString(locale.value, {month: 'long'}),
      value: i,
    };
  });

  // Aggiungi il tab "All" alla fine
  monthsTabs.push({
    text: t('common.all'),
    value: -1,
  });

  return monthsTabs;
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

// Verify the current year is selected on mount
onMounted(async () => {
  await RecurringProcessor.processRecurringExpenses();
  // Dopo aver processato le ricorrenti, aggiorna le transazioni
  // Ensure we're on the current year
  const currentYear = new Date().getFullYear();
  const yearIndex = years.value.findIndex((y) => y.value === currentYear);
  if (yearIndex !== -1) {
    currentYearIndex.value = yearIndex;
  }
});

// Fetch transactions and categories
async function fetchData() {
  loading.value = true;
  try {
    const selectedYear = years.value[currentYearIndex.value].value.toString();

    // Get transactions only for the selected year
    transactions.value = await UserTransactions.getUserTransactionsByYear(
      userId,
      selectedYear
    );

    // Fetch categories with type
    categories.value = await UserCategories.getCategoriesWithType(userId);
  } catch (error) {
    console.error('Error fetching data:', error);
    showNotify({type: 'danger', message: t('transaction.fetchError')});
  } finally {
    loading.value = false;
  }
}

// Add watch for year changes to reload transactions
watch(
  currentYearIndex,
  () => {
    fetchData();
  },
  {immediate: true}
);

// Modified computed property to include search filtering
const filteredTransactions = computed(() => {
  if (!transactions.value.length) return [];

  const selectedYear = years.value[currentYearIndex.value].value;
  const isAllTab = currentMonthIndex.value === months.value.length - 1;
  const query = searchQuery.value.toLowerCase().trim();

  // Filter by year and month first
  let yearMonthFiltered = transactions.value.filter((transaction) => {
    const transDate = new Date(transaction.timestamp);
    if (isAllTab) {
      return transDate.getFullYear() === selectedYear;
    }
    return (
      transDate.getFullYear() === selectedYear &&
      transDate.getMonth() === currentMonthIndex.value
    );
  });

  // Then filter by search query if there is one
  if (query) {
    yearMonthFiltered = yearMonthFiltered.filter((transaction) => {
      const amountMatch = transaction.amount
        .toString()
        .toLowerCase()
        .includes(query);
      const descriptionMatch = (transaction.description || '')
        .toLowerCase()
        .includes(query);
      const categoryNameMatch = getCategoryName(transaction.categoryId)
        .toLowerCase()
        .includes(query);
      return amountMatch || descriptionMatch || categoryNameMatch;
    });
  }

  // Finally, sort the results
  return yearMonthFiltered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

function handleMonthChange(index: number) {
  currentMonthIndex.value = index;
}

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
  const incomeCategoryIds = categories.value
    .filter((cat) => cat.type === 2)
    .map((cat) => cat.id);

  const total = filteredTransactions.value
    .filter((t) => incomeCategoryIds.includes(t.categoryId))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return total.toFixed(2);
});

const totalExpense = computed(() => {
  const expenseCategoryIds = categories.value
    .filter((cat) => cat.type === 1)
    .map((cat) => cat.id);

  const total = filteredTransactions.value
    .filter((t) => expenseCategoryIds.includes(t.categoryId))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return total.toFixed(2);
});

const totalInvestment = computed(() => {
  const investmentCategoryIds = categories.value
    .filter((cat) => cat.type === 3)
    .map((cat) => cat.id);

  const total = filteredTransactions.value
    .filter((t) => investmentCategoryIds.includes(t.categoryId))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return total.toFixed(2);
});

const savingRate = computed(() => {
  const income = Number(totalIncome.value);
  const expenses = Number(totalExpense.value);
  const investments = Number(totalInvestment.value);

  // Calculate savings without investments
  const basicSavings = income - expenses;
  const basicPercentage = income > 0 ? (basicSavings / income) * 100 : 0;

  // Calculate savings including investments as part of expenses
  const totalSavings = income - (expenses + investments);
  const totalPercentage = income > 0 ? (totalSavings / income) * 100 : 0;

  return {
    basic: {
      absolute: basicSavings.toFixed(2),
      percentage: basicPercentage.toFixed(1),
    },
    withInvestments: {
      absolute: totalSavings.toFixed(2),
      percentage: totalPercentage.toFixed(1),
    },
  };
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
  return category?.color || '#00000000';
}

function getCategoryIcon(categoryId: string) {
  const category = categories.value.find((c) => c.id === categoryId);
  return category?.icon || 'question-o';
}

function handleYearChange(index: number) {
  const currentDate = new Date();
  const selectedYear = years.value[index].value;
  const isCurrentYear = selectedYear === currentDate.getFullYear();

  // First update the year
  currentYearIndex.value = index;

  // Use nextTick to ensure the month is set after the year change
  nextTick(() => {
    if (isCurrentYear) {
      currentMonthIndex.value = currentDate.getMonth();
    } else {
      currentMonthIndex.value = 11; // December
    }
  });
}

const handleEdit = async (transactionId: string) => {
  const transaction = transactions.value.find((t) => t.id === transactionId);
  if (!transaction) {
    showNotify({type: 'danger', message: t('transaction.notFound')});
    return;
  }

  // Redirect to add-transaction page with transaction data
  router.push({
    name: 'transaction',
    query: {
      id: transaction.id,
    },
  });
};

const handleDelete = async (transactionId: string) => {
  try {
    const selectedYear = years.value[currentYearIndex.value].value.toString();
    await UserTransactions.deleteTransaction(
      userId,
      transactionId,
      selectedYear
    );

    // Refresh data
    await fetchData();

    showNotify({type: 'success', message: t('transaction.deleteSuccess')});
  } catch (error) {
    console.error('Error deleting transaction:', error);
    showNotify({type: 'danger', message: t('transaction.deleteError')});
  }
};
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
  text-align: center;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
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

.investment {
  color: #1989fa;
}

.balance {
  font-weight: bold;
  margin-top: 4px;
}

.saving-rate {
  font-weight: bold;
  margin-top: 4px;
}

.saving-rate.with-investments {
  color: #1989fa;
}

:deep(.van-card__price) {
  color: inherit;
}

:deep(.van-card__price--integer) {
  font-size: 16px;
}

:deep(.van-tabs:first-child .van-tabs__wrap) {
  height: 36px;
}

:deep(.van-tag--plain) {
  background: transparent;
  flex-shrink: 0;
}

.transaction-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Stili per il contenitore e i bottoni */
:deep(.van-swipe-cell) {
  margin: 8px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.221);
}

.transaction-list {
  padding: 0 16px;
}

:deep(.van-card) {
  margin: 0;
  padding: 16px;
  width: 100%;
}

:deep(.van-swipe-cell__left),
:deep(.van-swipe-cell__right) {
  height: 100%;
  display: flex;
  align-items: stretch;
}

.edit-button,
.delete-button {
  height: 100%;
  width: 64px;
}

:deep(.van-card) {
  border-radius: 0;
  padding-top: 0;
}

:deep(.van-card__header) {
  padding-top: 8px;
}

/* Optional: Add some side padding to the list container */
.transaction-list {
  padding: 0 8px;
}

:deep(.van-card__thumb) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
}

.category-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
}

.category-icon {
  margin-left: 8px;
  font-size: 24px;
}

.edit-button {
  height: 100%;
  width: 64px;
}

.delete-button {
  height: 100%;
  width: 64px;
}
</style>
