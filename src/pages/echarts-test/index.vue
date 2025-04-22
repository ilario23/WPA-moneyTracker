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
        <!-- Add more settings rows here if needed -->
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

const {
  loading,
  availableYears,
  currentYearIndex,
  chartOptions,
  setShowInvestment,
} = useTransactionChart();

watch(showInvestment, setShowInvestment, {immediate: true});
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
