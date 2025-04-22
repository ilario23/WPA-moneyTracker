import {ref, computed, watch} from 'vue';
import {useUserStore} from '@/stores';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';
import type {EChartsOption} from 'echarts';
import {useI18n} from 'vue-i18n';
import {showNotify} from 'vant';

export function useTransactionChart() {
  const {t, locale} = useI18n();
  const userStore = useUserStore();
  const userId = userStore.userInfo.uid;

  const loading = ref(false);
  const transactions = ref<Transaction[]>([]);
  const categories = ref<CategoryWithType[]>([]);
  const showInvestment = ref(false);

  function setShowInvestment(val: boolean) {
    showInvestment.value = val;
  }

  // --- Year Selection ---
  const availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    // Create array in reverse order (newest first)
    return Array.from({length: 5}, (_, i) => ({
      text: String(currentYear - (4 - i)),
      value: currentYear - (4 - i),
    }));
  });

  // Default to the index of the current year
  const currentYearIndex = ref(
    availableYears.value.findIndex((y) => y.value === new Date().getFullYear())
  );
  if (currentYearIndex.value === -1) {
    currentYearIndex.value = availableYears.value.length - 1; // Fallback to the last year if current not found
  }

  const selectedYear = computed(
    () => availableYears.value[currentYearIndex.value].value
  );

  // --- Data Fetching ---
  async function fetchData() {
    if (!userId) return;
    loading.value = true;
    try {
      const yearStr = selectedYear.value.toString();
      // Fetch transactions and categories concurrently
      [transactions.value, categories.value] = await Promise.all([
        UserTransactions.getUserTransactionsByYear(userId, yearStr),
        UserCategories.getCategoriesWithType(userId),
      ]);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      showNotify({type: 'danger', message: t('transaction.fetchError')});
      transactions.value = []; // Clear data on error
      categories.value = [];
    } finally {
      loading.value = false;
    }
  }

  // Fetch data when the selected year changes
  watch(selectedYear, fetchData, {immediate: true});

  // --- Chart Option Generation ---
  const chartOptions = computed<EChartsOption>(() => {
    const monthlyData: {
      income: number[];
      expense: number[];
      investment: number[];
    } = {
      income: Array(12).fill(0),
      expense: Array(12).fill(0),
      investment: Array(12).fill(0),
    };

    const incomeCategoryIds = new Set(
      categories.value.filter((cat) => cat.type === 2).map((cat) => cat.id)
    );
    const expenseCategoryIds = new Set(
      categories.value.filter((cat) => cat.type === 1).map((cat) => cat.id)
    );
    const investmentCategoryIds = new Set(
      categories.value.filter((cat) => cat.type === 3).map((cat) => cat.id)
    );

    transactions.value.forEach((t) => {
      const monthIndex = new Date(t.timestamp).getMonth(); // 0-11
      const amount = Number(t.amount) || 0;

      if (incomeCategoryIds.has(t.categoryId)) {
        monthlyData.income[monthIndex] += amount;
      } else if (expenseCategoryIds.has(t.categoryId)) {
        monthlyData.expense[monthIndex] += amount;
      } else if (investmentCategoryIds.has(t.categoryId)) {
        monthlyData.investment[monthIndex] += amount;
      }
    });

    // Generate month names based on locale
    const monthNames = Array.from({length: 12}, (_, i) => {
      const date = new Date(selectedYear.value, i, 1);
      return date.toLocaleString(locale.value, {month: 'short'});
    });

    // Build legend and series dynamically
    const legendData = [t('transaction.income'), t('transaction.expense')];
    const series: EChartsOption['series'] = [
      {
        name: t('transaction.income'),
        type: 'bar',
        emphasis: {focus: 'series'},
        data: monthlyData.income.map((val) => val.toFixed(2)),
        itemStyle: {color: '#07c160'},
      },
      {
        name: t('transaction.expense'),
        type: 'bar',
        emphasis: {focus: 'series'},
        data: monthlyData.expense.map((val) => val.toFixed(2)),
        itemStyle: {color: '#ee0a24'},
      },
    ];
    if (showInvestment.value) {
      legendData.push(t('transaction.investment'));
      series.push({
        name: t('transaction.investment'),
        type: 'bar',
        emphasis: {focus: 'series'},
        data: monthlyData.investment.map((val) => val.toFixed(2)),
        itemStyle: {color: '#1989fa'},
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {type: 'shadow'},
      },
      legend: {
        data: legendData,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: monthNames,
        },
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            formatter: '€{value}',
          },
        },
      ],
      series,
    };
  });

  // Fetch initial data on mount if needed (though immediate watch handles it)
  // onMounted(fetchData);

  return {
    loading,
    availableYears,
    currentYearIndex, // Expose index for v-model binding with van-tabs
    selectedYear,
    chartOptions,
    fetchData, // Expose fetchData if manual refresh is needed
    setShowInvestment,
  };
}
