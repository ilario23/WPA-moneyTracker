<template>
  <div>
    <!-- Year Selector Tabs -->
    <van-tabs v-model:active="currentYearIndex" swipeable>
      <van-tab
        v-for="year in availableYears"
        :key="year.value"
        :title="year.text"
      />
    </van-tabs>

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
import {useTransactionChart} from '@/composables/useTransactionChart';
import Chart from '@/components/Chart/index.vue'; // Import the chart component

const {loading, availableYears, currentYearIndex, chartOptions} =
  useTransactionChart();
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
</style>
