<template>
  <div>
    <!-- Riga 1: Selezione Anno e Mese -->
    <div class="date-selectors">
      <van-tabs
        v-model:active="currentYearIndex"
        swipeable
        @change="handleYearChange"
      >
        <van-tab
          v-for="year in availableYears"
          :key="year.value"
          :title="year.text"
        />
      </van-tabs>
      <van-tabs
        v-model:active="currentMonthIndex"
        swipeable
        @change="handleMonthChange"
      >
        <van-tab
          v-for="month in availableMonths"
          :key="month.value"
          :title="month.text"
        />
      </van-tabs>
    </div>

    <!-- Pulsante Impostazioni -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
      "
    >
      <van-field
        :model-value="formattedTotal"
        readonly
        :label="t('charts.totalExpenses')"
        :style="{
          flex: 1,
          '--van-field-label-width': 'auto',
          '--van-field-background': 'transparent',
          '--van-field-input-background': 'transparent',
          '--van-field-padding': '0',
          '--van-cell-background': 'transparent',
        }"
      />
      <van-button
        icon="setting-o"
        type="default"
        size="small"
        style="
          border: none;
          background: none;
          box-shadow: none;
          margin-left: 8px;
        "
        @click="showSettingsPanel = true"
      />
    </div>

    <!-- Riga 2: Selezione Tipo di Grafico -->
    <div class="chart-type-selector" style="margin-top: 8px">
      <van-tabs
        v-model:active="selectedChartKey"
        swipeable
        @change="handleChartTypeChange"
      >
        <van-tab
          v-for="chartDef in chartDefinitions"
          :key="chartDef.key"
          :title-slot="true"
          :name="chartDef.key"
        >
          <template #title>
            <van-icon :name="chartDef.icon" style="margin-right: 4px" />
          </template>
        </van-tab>
      </van-tabs>
    </div>

    <!-- Area di Visualizzazione Grafico -->
    <div
      class="chart-container"
      ref="chartContainer"
      :style="{
        padding: '16px',
        minHeight: '400px',
        height: `${chartHeight}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }"
    >
      <van-loading v-if="loading" size="24px" vertical>
        {{ $t('common.loading') || 'Caricamento...' }}
      </van-loading>
      <Chart
        :key="selectedChartKey"
        v-else-if="currentChartOptions && !loading"
        :option="currentChartOptions"
        :style="{
          width: '100%',
          height: `${chartHeight}px`,
        }"
      />
      <van-empty
        v-else
        :description="$t('charts.noData') || 'Nessun dato da visualizzare'"
      />
    </div>

    <!-- Pannello Impostazioni Laterale -->
    <van-popup
      v-model:show="showSettingsPanel"
      position="right"
      style="width: 80vw; max-width: 300px; height: 100%"
      closeable
    >
      <div style="padding: 24px">
        <h4>{{ $t('common.settings') || 'Impostazioni' }}</h4>
        <p style="color: #888; font-size: 14px">
          {{
            $t('charts.settingsPlaceholder') ||
            'Le opzioni di configurazione per i grafici saranno disponibili qui in futuro.'
          }}
        </p>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue';
import type {EChartsOption} from 'echarts';
import {useI18n} from 'vue-i18n';

import Chart from '@/components/Chart/index.vue';
import {generatePieTotalByTypeOptions} from './charts/pieTotalByType';
import {generateBarMonthlyTransactionsOptions} from './charts/barMonthlyTransactions';
import {generateTreemapTotalByCategoryOptions} from './charts/treemapTotalByCategory';
import {generateSunburstTotalByCategoryOptions} from './charts/sunburstTotalByCategory';
import {generateCalendarHeatmapOptions} from './charts/calendarHeatmapTransactions';
import {generateSankeyFlowOptions} from './charts/sankeyCategoryFlow';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {useUserStore} from '@/stores';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

const {t, locale} = useI18n();
const userStore = useUserStore();
const userId = userStore.userInfo.uid;

const loading = ref(false);
const showSettingsPanel = ref(false);

const currentYearIndex = ref(0); // Default to the most recent year in the list
const currentMonthIndex = ref(new Date().getMonth()); // Default to current month index

const allTransactionsForYear = ref<Transaction[]>([]);
const categories = ref<CategoryWithType[]>([]);

// Chart Definitions
const chartDefinitions = ref([
  {
    key: 'pieTotalByType',
    name: computed(() => t('charts.pieNameTotalByType')),
    icon: 'chart-trending-o',
    generatorFunction: generatePieTotalByTypeOptions,
  },
  {
    key: 'barMonthlyTransactions',
    name: computed(() => t('charts.barNameMonthlyTransactions')),
    icon: 'bar-chart-o',
    generatorFunction: generateBarMonthlyTransactionsOptions,
  },
  {
    key: 'treemapTotalByCategory',
    name: computed(() => t('charts.treemapTotalByCategory')),
    icon: 'apps-o',
    generatorFunction: generateTreemapTotalByCategoryOptions,
  },
  {
    key: 'sunburstTotalByCategory',
    name: computed(() => t('charts.sunburstTotalByCategory')),
    icon: 'cluster-o',
    generatorFunction: generateSunburstTotalByCategoryOptions,
  },
  {
    key: 'calendarHeatmap',
    name: computed(() => t('charts.calendarHeatmap')),
    icon: 'calendar-o',
    generatorFunction: generateCalendarHeatmapOptions,
  },
  {
    key: 'sankeyFlow',
    name: computed(() => t('charts.sankeyFlow')),
    icon: 'cluster-o',
    generatorFunction: generateSankeyFlowOptions,
  },
]);
const selectedChartKey = ref(chartDefinitions.value[0].key);

// Date Selection Computeds
const availableYears = computed(() => {
  const currentAppYear = new Date().getFullYear();
  return Array.from({length: 5}, (_, i) => {
    const yearValue = currentAppYear - (4 - i); // Generates oldest to newest
    return {
      text: String(yearValue),
      value: yearValue,
    };
  }); // Oldest to newest: e.g., [2021, 2022, 2023, 2024, 2025]
});

const selectedYear = computed(
  () => availableYears.value[currentYearIndex.value]?.value
);

const availableMonths = computed(() => {
  const year = selectedYear.value;
  if (!year) return [];

  const currentAppDate = new Date();
  const isCurrentYear = year === currentAppDate.getFullYear();
  const monthsCount = isCurrentYear ? currentAppDate.getMonth() + 1 : 12;

  const monthTabs = Array.from({length: monthsCount}, (_, i) => {
    const date = new Date(year, i);
    return {
      text: date.toLocaleString(locale.value, {month: 'long'}),
      value: i, // 0 for January, 11 for December
    };
  });

  monthTabs.push({
    text: t('common.all', 'Tutti'),
    value: -1, // Identifier for "All" months
  });
  return monthTabs;
});

const selectedMonthValue = computed(
  () => availableMonths.value[currentMonthIndex.value]?.value
);

// Data Fetching
async function fetchCategories() {
  if (!userId) return;
  try {
    categories.value = await UserCategories.getCategoriesWithType(userId);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Optionally show a notification
  }
}

async function fetchDataForSelectedYear() {
  if (!userId || !selectedYear.value) return;
  loading.value = true;
  try {
    allTransactionsForYear.value =
      await UserTransactions.getUserTransactionsByYear(
        userId,
        selectedYear.value.toString()
      );
  } catch (error) {
    console.error('Error fetching transactions for year:', error);
    allTransactionsForYear.value = [];
    // Optionally show a notification
  } finally {
    loading.value = false;
  }
}

// Default Month/Year Logic
function setDefaultMonthOrAll() {
  const year = selectedYear.value;
  const currentAppDate = new Date();
  if (year === currentAppDate.getFullYear()) {
    // Current year, set to current month
    const currentMonth = currentAppDate.getMonth();
    const monthExists = availableMonths.value.find(
      (m) => m.value === currentMonth
    );
    if (monthExists) {
      currentMonthIndex.value = availableMonths.value.findIndex(
        (m) => m.value === currentMonth
      );
    } else if (availableMonths.value.length > 0) {
      currentMonthIndex.value = availableMonths.value.length - 2; // Last actual month before "All"
    }
  } else {
    // Previous year, set to "All"
    const allMonthIndex = availableMonths.value.findIndex(
      (m) => m.value === -1
    );
    if (allMonthIndex !== -1) {
      currentMonthIndex.value = allMonthIndex;
    } else if (availableMonths.value.length > 0) {
      currentMonthIndex.value = availableMonths.value.length - 1; // Default to last if "All" somehow not found
    }
  }
}

// Event Handlers
async function handleYearChange(index: number) {
  // Vant gives the index of the tab
  currentYearIndex.value = index;
  await fetchDataForSelectedYear();
  // Ensure availableMonths is updated before setting default month
  await nextTick();
  setDefaultMonthOrAll();
}

function handleMonthChange(index: number) {
  currentMonthIndex.value = index;
}

function handleChartTypeChange(key: string | number) {
  if (typeof key === 'string') {
    selectedChartKey.value = key;
  }
}

// Filtered Transactions
const filteredTransactions = computed(() => {
  if (!allTransactionsForYear.value.length) return [];
  if (selectedMonthValue.value === -1) {
    // "All" months selected
    return allTransactionsForYear.value;
  }
  return allTransactionsForYear.value.filter((transaction) => {
    const transDate = new Date(transaction.timestamp);
    return transDate.getMonth() === selectedMonthValue.value;
  });
});

// Chart Options Generator
const currentChartOptions = computed<EChartsOption | null>(() => {
  if (
    loading.value ||
    !filteredTransactions.value.length ||
    !categories.value.length
  ) {
    return null;
  }
  const chartDefinition = chartDefinitions.value.find(
    (def) => def.key === selectedChartKey.value
  );
  if (chartDefinition) {
    const {generatorFunction, key} = chartDefinition;

    const commonArgs = [
      filteredTransactions.value,
      categories.value,
      t,
      locale.value,
    ] as const;

    switch (key) {
      case 'barMonthlyTransactions':
        return (
          generatorFunction as typeof generateBarMonthlyTransactionsOptions
        )(...commonArgs, selectedMonthValue.value);
      case 'pieTotalByType':
        return (generatorFunction as typeof generatePieTotalByTypeOptions)(
          ...commonArgs
        );
      case 'treemapTotalByCategory':
      case 'sunburstTotalByCategory':
        return generatorFunction(...commonArgs, selectedMonthValue.value);
      case 'calendarHeatmap':
        return (generatorFunction as typeof generateCalendarHeatmapOptions)(
          ...commonArgs,
          selectedMonthValue.value
        );
      case 'sankeyFlow':
        return (generatorFunction as typeof generateSankeyFlowOptions)(
          ...commonArgs
        );
    }
  }
  return null;
});

// Computed Property for Total
const formattedTotal = computed(() => {
  const total = filteredTransactions.value.reduce((acc, transaction) => {
    const category = categories.value.find(
      (c) => c.id === transaction.categoryId
    );
    if (category?.type === 1) {
      // Solo le spese
      return acc + Number(transaction.amount);
    }
    return acc;
  }, 0);

  return total.toLocaleString(locale.value, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

// Chart Height Computation
const chartContainer = ref<HTMLElement | null>(null);
const chartHeight = ref(400);

const updateChartHeight = () => {
  if (!chartContainer.value) return;

  const viewportHeight = window.innerHeight;
  const containerTop = chartContainer.value.getBoundingClientRect().top;
  const bottomPadding = 16; // Spazio dal fondo
  const safetyMargin = 50; // Margine extra di sicurezza

  // Sottrai la posizione top del container, il padding e il margine di sicurezza
  const availableHeight =
    viewportHeight - containerTop - bottomPadding - safetyMargin;

  // Imposta un minimo di 400px
  chartHeight.value = Math.max(400, availableHeight);
};

// Lifecycle Hooks
onMounted(async () => {
  // Set currentYearIndex to the current actual year
  const currentAppYear = new Date().getFullYear();
  const idx = availableYears.value.findIndex((y) => y.value === currentAppYear);
  if (idx !== -1) {
    currentYearIndex.value = idx;
  } else if (availableYears.value.length > 0) {
    // Fallback to the newest year in the list if current year is somehow not found
    currentYearIndex.value = availableYears.value.length - 1;
  }

  await fetchCategories();
  await fetchDataForSelectedYear();

  // Ensure availableMonths is populated based on the fetched year's data
  await nextTick();
  setDefaultMonthOrAll();

  // Aggiungi il calcolo iniziale dell'altezza e l'event listener per il resize
  updateChartHeight();
  window.addEventListener('resize', updateChartHeight);
});

// Cleanup dell'event listener
onUnmounted(() => {
  window.removeEventListener('resize', updateChartHeight);
});
</script>

<route lang="json5">
{
  name: 'financial-charts',
  meta: {
    title: 'Financial Charts',
    i18n: 'menus.financialCharts',
    requiresAuth: true,
  },
}
</route>

<style scoped>
.date-selectors,
.chart-type-selector {
  padding: 0 8px; /* Add some horizontal padding */
}

/* Adjust tab height if needed */
:deep(.van-tabs__wrap) {
  height: 36px;
}

.chart-container {
  transition: height 0.3s ease;
}
</style>
