<template>
  <div>
    <van-tabs
      v-model:active="selectedRootIndex"
      swipeable
      :color="currentRootCategory?.color"
      :title-active-color="currentRootCategory?.color"
    >
      <van-tab
        v-for="category in rootCategories"
        :key="category.id"
        :title="category.title"
      >
        <div
          class="chart-container"
          ref="chartContainer"
          :style="containerStyle"
        >
          <van-loading v-if="loading" size="24px" vertical>
            {{ $t('common.loading') }}
          </van-loading>
          <Chart
            v-else-if="chartOptions"
            :option="chartOptions"
            :style="{width: '100%', height: `${chartHeight}px`}"
          />
          <van-empty v-else :description="$t('charts.noData')" />
        </div>
      </van-tab>
    </van-tabs>

    <!-- Add this filter switch at the bottom -->
    <div class="filter-container">
      <van-cell center>
        <template #title>
          <span>{{ $t('category.showOnlyActive') }}</span>
        </template>
        <template #right-icon>
          <van-switch v-model="showOnlyActive" size="24px" />
        </template>
      </van-cell>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from 'vue';
import type {EChartsOption} from 'echarts';
import Chart from '@/components/Chart/index.vue';
import {useUserStore} from '@/stores';
import {API} from '@/api';
import {useI18n} from 'vue-i18n';
import {generateTreeChartOptions} from './charts/treeChart';
import {BASE_CATEGORIES} from '@/utils/category';

const {t} = useI18n();
const userStore = useUserStore();
const loading = ref(true);
const chartContainer = ref<HTMLElement | null>(null);
const chartHeight = ref(600);
const categories = ref([]);

const selectedRootIndex = ref(0);
const rootCategories = ref(BASE_CATEGORIES);

const currentRootCategory = computed(
  () => rootCategories.value[selectedRootIndex.value]
);

// Stile del container
const containerStyle = computed(() => ({
  padding: '16px',
  minHeight: '400px',
  height: `${chartHeight.value}px`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const showOnlyActive = ref(true);

// Opzioni del grafico
const chartOptions = computed<EChartsOption | null>(() => {
  if (!categories.value?.length) {
    console.log('No categories available');
    return null;
  }

  try {
    const selectedRootId = currentRootCategory.value?.id;

    const findAllChildren = (parentId: string): string[] => {
      const directChildren = categories.value
        .filter((cat) => {
          const matchesParent = cat.parentCategoryId === parentId;
          return showOnlyActive.value
            ? matchesParent && cat.active
            : matchesParent;
        })
        .map((cat) => cat.id);

      const allChildren = [...directChildren];
      directChildren.forEach((childId) => {
        allChildren.push(...findAllChildren(childId));
      });

      return allChildren;
    };

    const allCategoryIds = selectedRootId
      ? [selectedRootId, ...findAllChildren(selectedRootId)]
      : [];

    const filteredCategories = categories.value.filter(
      (cat) =>
        allCategoryIds.includes(cat.id) && (!showOnlyActive.value || cat.active)
    );

    const options = generateTreeChartOptions(filteredCategories, t);

    return options;
  } catch (error) {
    console.error('Error generating chart options:', error);
    return null;
  }
});

// Carica i dati delle categorie
async function fetchCategories() {
  if (!userStore.userInfo?.uid) {
    console.log('No user ID available');
    return;
  }

  try {
    const allCategories = await API.Database.Users.Categories.getUserCategories(
      userStore.userInfo.uid
    );
    categories.value = allCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    loading.value = false;
  }
}

// Gestione dimensione del grafico
function updateChartHeight() {
  if (!chartContainer.value) return;
  const viewportHeight = window.innerHeight;
  const containerTop = chartContainer.value.getBoundingClientRect().top;
  const bottomPadding = 16;
  const safetyMargin = 50;
  chartHeight.value = Math.max(
    400,
    viewportHeight - containerTop - bottomPadding - safetyMargin
  );
}

onMounted(() => {
  fetchCategories();
  updateChartHeight();
  window.addEventListener('resize', updateChartHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateChartHeight);
});
</script>

<route lang="json5">
{
  name: 'category-tree',
  meta: {
    title: 'Category Tree',
    i18n: 'menus.categoryTree',
  },
}
</route>

<style scoped>
.chart-container {
  transition: height 0.3s ease;
  width: 100%; /* Add this */
  position: relative; /* Add this */
}

:deep(.van-tabs__wrap) {
  padding: 0 16px;
}

.filter-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--van-background-2);
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>
