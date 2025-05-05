<template>
  <div>
    <!-- Top bar: Year Selector Tabs left, Gear button right -->
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        gap: 12px;
      "
    >
      <div style="flex: 1">
        <van-tabs
          v-model:active="currentYearIndex"
          swipeable
          style="margin-bottom: 0"
        >
          <van-tab
            v-for="year in availableYears"
            :key="year.value"
            :title="year.text"
          />
        </van-tabs>
      </div>
      <van-button
        icon="setting-o"
        type="default"
        size="small"
        style="border: none; background: none; box-shadow: none"
        @click="showSettings = true"
      />
    </div>

    <!-- Settings Side Panel -->
    <van-popup
      v-model:show="showSettings"
      position="top"
      closeable
      @close="showSettings = false"
      safe-area-inset-top
      safe-area-inset-bottom
    >
      <div style="padding: 24px">
        <div class="settings-row">
          <van-switch
            v-model="showInvestment"
            size="24px"
            style="flex-shrink: 0"
          />
          <div style="flex: 1">
            <span>
              {{ $t('transaction.showInvestments') || 'Show Investments' }}
            </span>
            <div style="font-size: 12px; color: #888; margin-top: 2px">
              {{
                $t('transaction.showInvestmentsTooltip') ||
                'Include investments in the chart. Investments are shown as a separate bar.'
              }}
            </div>
          </div>
        </div>
        <van-divider style="margin: 16px 0" />
        <div style="margin-top: 16px">
          <van-button
            icon="cart-o"
            :text="$t('common.sidePanel')"
            type="default"
            size="small"
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              border: none;
              background: none;
              box-shadow: none;
              padding: 0;
            "
            @click="clickSidePanel()"
          >
            <template #icon>
              <van-icon name="cart-o" />
            </template>
            <span>{{ $t('common.sidePanel') }}</span>
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- SidePanel: Supported Charts List -->
    <van-popup
      v-model:show="showSidePanel"
      position="left"
      closeable
      @close="showSidePanel = false"
      style="width: 80vw; max-width: 400px; height: 100%"
      safe-area-inset-top
      safe-area-inset-bottom
    >
      <div style="display: flex; height: 100%">
        <van-sidebar v-model="selectedChartIndex" style="min-width: 120px">
          <van-sidebar-item
            v-for="chart in supportedCharts"
            :key="chart.id"
            :title="chart.name"
          />
        </van-sidebar>
        <div style="flex: 1; padding: 24px">
          <h3 style="margin-bottom: 16px">
            {{ supportedCharts[selectedChartIndex]?.name }}
          </h3>
          <div style="font-size: 14px; color: #888">
            {{ supportedCharts[selectedChartIndex]?.desc }}
          </div>
        </div>
      </div>
    </van-popup>

    <!-- Chart Area -->
    <div class="chart-container">
      <van-loading v-if="loading" size="24px" vertical
        >{{ $t('common.loading') }}...</van-loading
      >
      <Chart v-else :option="chartOptions" class="chart-instance" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {useTransactionChart} from '@/composables/useTransactionChart';
import Chart from '@/components/Chart/index.vue';

const showInvestment = ref(false);
const showSettings = ref(false);

// SidePanel state
const showSidePanel = ref(false);
const selectedChartIndex = ref(0);

// Mock list of supported charts
const supportedCharts = [
  {id: 1, name: 'Bar Chart', desc: 'Simple bar chart for transactions.'},
  {id: 2, name: 'Line Chart', desc: 'Line chart for trends.'},
  {id: 3, name: 'Pie Chart', desc: 'Pie chart for category breakdown.'},
];

const {
  loading,
  availableYears,
  currentYearIndex,
  chartOptions,
  setShowInvestment,
} = useTransactionChart();

watch(showInvestment, setShowInvestment, {immediate: true});

function clickSidePanel() {
  showSettings.value = false;
  showSidePanel.value = true;
}
</script>

<route lang="json5">
{
  name: 'echarts-test',
  meta: {
    title: 'ECharts Test',
    i18n: 'menus.echartsTest',
  },
}
</route>

<style scoped>
.chart-container {
  padding: 16px;
  min-height: 400px; /* Ensure container has height */
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-instance {
  width: 100%;
  height: 400px; /* Fixed height for the chart */
}

/* Adjust tab height if needed */
:deep(.van-tabs__wrap) {
  height: 36px;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px; /* Add some spacing if more settings are added */
}
</style>
