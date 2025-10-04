<template>
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
    <van-tab v-for="month in months" :key="month.value" :title="month.text" />
  </van-tabs>
  <!-- Tabs and Search Icon Container -->
  <div class="search-container flex items-center gap-8px px-12px py-12px">
    <van-icon
      :name="showSearch ? 'close' : 'search'"
      size="24"
      class="search-icon shrink-0"
      @click="showSearch = !showSearch"
    />

    <transition name="slide-down">
      <van-search
        v-if="showSearch"
        v-model="searchQuery"
        :placeholder="$t('transaction.searchPlaceholder')"
        shape="round"
        class="search-input grow-1 m-0"
      />
    </transition>
  </div>
  <!-- Riepilogo -->
  <van-card
    class="text-center rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <template #title>
      <div class="summary-title font-bold text-16px mb-8px text-center">
        {{ $t('transaction.monthlySummary') }}
      </div>
    </template>
    <template #desc>
      <div class="summary-amount flex flex-col gap-4px">
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

  <div
    v-else
    v-for="(group, date) in groupedTransactions"
    class="transaction-list px-16px py-4px"
    :key="date"
  >
    <van-card
      v-for="transaction in group"
      :key="transaction.id"
      :price="transaction.amount"
      :desc="transaction.description || ''"
      currency="€"
      class="transaction-card shadow-[0_2px_4px_rgba(0,0,0,0.06),_0_8px_16px_rgba(0,0,0,0.08)]"
      @click="clickedTransaction(transaction)"
    >
      <template #title>
        <div
          class="transaction-title flex items-center justify-between w-[100%]"
        >
          <span>{{ getCategoryName(transaction.categoryId) }}</span>
          <van-tag plain>{{ formatDate(date) }}</van-tag>
        </div>
      </template>
      <template #thumb>
        <div
          class="category-indicator absolute left-0 top-0 bottom-0 w-4px rounded-[2px]"
          :style="{
            backgroundColor: getCategoryColor(transaction.categoryId),
          }"
        ></div>

        <div
          :class="getCategoryIcon(transaction.categoryId)"
          class="category-icon ml-8px"
          :style="{
            color: getCategoryColor(transaction.categoryId),
            fontSize: '36px',
          }"
        />
      </template>
    </van-card>
  </div>

  <!-- Floating Panel -->
  <van-popup
    v-model:show="showFloating"
    position="bottom"
    round
    :style="{height: 'auto'}"
  >
    <van-floating-panel v-model:height="heightFloating" :anchors="anchors">
      <div v-if="selectedTransaction" class="p-16px min-h-full flex flex-col">
        <div class="flex-shrink-0">
          <div class="flex items-center gap-12px mb-16px">
            <van-icon
              :name="getCategoryIcon(selectedTransaction.categoryId)"
              class="text-32px"
              :style="{
                color: getCategoryColor(selectedTransaction.categoryId),
              }"
            />
            <span class="text-18px font-600">
              {{ getCategoryName(selectedTransaction.categoryId) }}
            </span>
          </div>

          <div
            class="text-24px font-bold text-center mb-16px"
            :class="{
              'text-[#07c160]': Number(selectedTransaction.amount) > 0,
              'text-[#ee0a24]': Number(selectedTransaction.amount) < 0,
            }"
          >
            €{{ selectedTransaction.amount }}
          </div>

          <van-divider />

          <div class="flex flex-col gap-12px mb-24px">
            <div class="flex items-center gap-8px text-[#666]">
              <van-icon name="clock-o" />
              <span>
                {{
                  new Date(selectedTransaction.timestamp).toLocaleDateString()
                }}
              </span>
            </div>

            <div
              v-if="selectedTransaction.description"
              class="flex items-center gap-8px text-[#666]"
            >
              <van-icon name="description" />
              <span>{{ selectedTransaction.description }}</span>
            </div>
          </div>
        </div>

        <div class="flex-grow min-h-100px"></div>

        <div
          v-show="isExpanded"
          class="flex flex-col gap-12px sticky bottom-16px bg-white pt-16px"
        >
          <van-button
            type="primary"
            block
            @click="handleEdit(selectedTransaction.id)"
          >
            {{ $t('common.edit') }}
          </van-button>
          <van-button
            type="danger"
            block
            @click="handleDelete(selectedTransaction.id)"
          >
            {{ $t('common.delete') }}
          </van-button>
        </div>
      </div>
    </van-floating-panel>
  </van-popup>

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
</template>

<script setup lang="ts">
import {ref, computed, onMounted, nextTick, watch} from 'vue';
import {useUserStore} from '@/stores';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
// Removed incorrect Vant imports from previous attempt, will add specific ones later if needed by auto-import
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {showNotify, showDialog} from 'vant';
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
  await fetchData(); // Aggiorna subito le transazioni dopo aver processato le ricorrenti
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

const showFloating = ref(false);
const heightFloating = ref(0);
const selectedTransaction = ref<Transaction | null>(null);
const anchors = [
  Math.round(0.3 * window.innerHeight),
  Math.round(0.5 * window.innerHeight),
];

const clickedTransaction = (transaction: Transaction) => {
  heightFloating.value = anchors[0];
  selectedTransaction.value = transaction;
  showFloating.value = true;
};

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
    // Show confirmation dialog
    await showDialog({
      title: t('common.confirm'),
      message: t('transaction.deleteConfirmation'),
      showCancelButton: true,
    });

    const selectedYear = years.value[currentYearIndex.value].value.toString();
    await UserTransactions.deleteTransaction(
      userId,
      transactionId,
      selectedYear
    );
    await fetchData();
    showNotify({type: 'success', message: t('transaction.deleteSuccess')});
    showFloating.value = false;
  } catch (error) {
    // Check if error is from dialog cancellation
    if (error?.toString().includes('cancel')) return;

    console.error('Error deleting transaction:', error);
    showNotify({type: 'danger', message: t('transaction.deleteError')});
  }
};

// Add this computed property in the script section
const isExpanded = computed(() => {
  return heightFloating.value >= anchors[1];
});
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
/* Keep only styles that can't be easily converted to utility classes */
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

:deep(.van-swipe-cell) {
  margin: 8px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.221);
}

:deep(.van-card) {
  margin: 0;
  padding: 16px;
  width: 100%;
  border-radius: 0;
  padding-top: 0;
}

:deep(.van-card__header) {
  padding-top: 8px;
}

:deep(.van-card__thumb) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
}

:deep(.van-search) {
  padding: 0;
  width: 100%;
}

/* Keep income/expense/investment colors for reuse */
.income {
  color: #07c160;
}

.expense {
  color: #ee0a24;
}

.investment {
  color: #1989fa;
}
</style>
