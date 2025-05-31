<template>
  <div>
    <van-loading v-if="loading" type="spinner" size="24px" vertical
      >{{ $t('common.loading') }}...</van-loading
    >
    <van-empty
      v-else-if="!sortedRecurringExpenses.length"
      :description="$t('recurringExpense.noExpenses')"
    />
    <div v-else class="recurring-expense-list">
      <van-card
        v-for="expense in sortedRecurringExpenses"
        :key="expense.id"
        :price="expense.amount"
        :desc="expense.description || ''"
        currency="€"
        class="transaction-card shadow-[0_2px_4px_rgba(0,0,0,0.06),_0_8px_16px_rgba(0,0,0,0.08)]"
        @click="clickedExpense(expense)"
      >
        <template #title>
          <div
            class="transaction-title flex items-center justify-between w-[100%]"
          >
            <span>{{ getCategoryName(expense.categoryId) }}</span>
            <van-tag plain type="primary">{{
              formatFrequency(expense.frequency)
            }}</van-tag>
          </div>
        </template>
        <template #thumb>
          <div
            class="category-indicator absolute left-0 top-0 bottom-0 w-4px rounded-[2px]"
            :style="{
              backgroundColor: getCategoryColor(expense.categoryId),
            }"
          ></div>
          <div
            :class="getCategoryIcon(expense.categoryId)"
            class="category-icon ml-8px"
            :style="{
              color: getCategoryColor(expense.categoryId),
              fontSize: '36px',
            }"
          />
        </template>
        <template #num>
          <div class="card-footer-custom">
            <span
              >{{ $t('recurringExpense.nextOccurrence') }}:
              {{ formatDate(expense.nextOccurrence) }}</span
            >
          </div>
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
        <div v-if="selectedExpense" class="p-16px min-h-full flex flex-col">
          <div class="flex-shrink-0">
            <div class="flex items-center gap-12px mb-16px">
              <div
                :class="getCategoryIcon(selectedExpense.categoryId)"
                class="text-32px"
                :style="{
                  color: getCategoryColor(selectedExpense.categoryId),
                }"
              />
              <span class="text-18px font-600">
                {{ getCategoryName(selectedExpense.categoryId) }}
              </span>
            </div>

            <div class="text-24px font-bold text-center mb-16px">
              €{{ selectedExpense.amount }}
            </div>

            <van-divider />

            <div class="flex flex-col gap-12px mb-24px">
              <div class="flex items-center gap-8px text-[#666]">
                <van-icon name="clock-o" />
                <span>{{ formatFrequency(selectedExpense.frequency) }}</span>
              </div>

              <div class="flex items-center gap-8px text-[#666]">
                <van-icon name="underway-o" />
                <span
                  >{{ $t('recurringExpense.nextOccurrence') }}:
                  {{ formatDate(selectedExpense.nextOccurrence) }}</span
                >
              </div>

              <div
                v-if="selectedExpense.description"
                class="flex items-center gap-8px text-[#666]"
              >
                <van-icon name="description" />
                <span>{{ selectedExpense.description }}</span>
              </div>
              <div
                v-if="selectedExpense.startDate"
                class="flex items-center gap-8px text-[#666]"
              >
                <van-icon name="clock-o" />
                <span>
                  {{ $t('recurringExpense.startDate') }}:
                  {{ formatDate(selectedExpense.startDate) }}</span
                >
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
              @click="handleEdit(selectedExpense)"
            >
              {{ $t('common.edit') }}
            </van-button>
            <van-button
              type="danger"
              block
              @click="handleDelete(selectedExpense)"
            >
              {{ $t('common.delete') }}
            </van-button>
          </div>
        </div>
      </van-floating-panel>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue';
import {showNotify, showConfirmDialog} from 'vant';
import {useUserStore} from '@/stores/modules/user';
import {UserRecurringExpenses} from '@/api/database/modules/subcollections/user.recurringExpenses';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import type {
  RecurringExpenseDefinition,
  FrequencyType,
} from '@/types/recurringExpense';
import type {CategoryWithType} from '@/types/category';

const userStore = useUserStore();
const userId = userStore.userInfo.uid;
const router = useRouter();
const {t, locale} = useI18n();

const recurringExpenses = ref<RecurringExpenseDefinition[]>([]);
const categories = ref<CategoryWithType[]>([]);
const loading = ref<boolean>(true);

async function fetchData() {
  loading.value = true;
  console.log('[RecurringExpensesPage] Fetching data for userId:', userId);
  try {
    const [expensesData, categoriesData] = await Promise.all([
      UserRecurringExpenses.getActiveRecurringExpenses(userId),
      UserCategories.getCategoriesWithType(userId),
    ]);

    recurringExpenses.value = expensesData;
    categories.value = categoriesData;
  } catch (error) {
    console.error('[RecurringExpensesPage] Error fetching data:', error);
    showNotify({type: 'danger', message: t('recurringExpense.fetchError')});
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

const sortedRecurringExpenses = computed(() => {
  return [...recurringExpenses.value].sort(
    (a, b) =>
      new Date(a.nextOccurrence).getTime() -
      new Date(b.nextOccurrence).getTime()
  );
});

function getCategoryName(categoryId: string): string {
  const category = categories.value.find((c) => c.id === categoryId);
  return category ? category.title : t('recurringExpense.unknownCategory');
}

function getCategoryIcon(categoryId: string): string {
  const category = categories.value.find((c) => c.id === categoryId);
  return category ? category.icon || 'question-o' : 'question-o';
}

function getCategoryColor(categoryId: string): string {
  const category = categories.value.find((c) => c.id === categoryId);
  return category ? category.color || '#cccccc' : '#cccccc';
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatFrequency(frequency: FrequencyType): string {
  switch (frequency) {
    case 'WEEKLY':
      return t('recurringExpense.weekly');
    case 'MONTHLY':
      return t('recurringExpense.monthly');
    case 'YEARLY':
      return t('recurringExpense.yearly');
    default:
      return frequency;
  }
}

// Add these new refs for floating panel
const showFloating = ref(false);
const heightFloating = ref(0);
const selectedExpense = ref<RecurringExpenseDefinition | null>(null);
const anchors = [
  Math.round(0.4 * window.innerHeight),
  Math.round(0.6 * window.innerHeight),
];

const isExpanded = computed(() => {
  return heightFloating.value >= anchors[1];
});

function clickedExpense(expense: RecurringExpenseDefinition) {
  heightFloating.value = anchors[0];
  selectedExpense.value = expense;
  showFloating.value = true;
}

// Update existing functions to work with floating panel
function handleEdit(expense: RecurringExpenseDefinition) {
  router.push({
    name: 'transaction',
    query: {recurringExpenseId: expense.id},
  });
  showFloating.value = false;
}

async function handleDelete(expense: RecurringExpenseDefinition) {
  try {
    await showConfirmDialog({
      title: t('recurringExpense.deleteConfirmTitle'),
      message: t('recurringExpense.deleteConfirmMessage'),
    });
    await UserRecurringExpenses.deleteRecurringExpense(userId, expense.id);
    showNotify({type: 'success', message: t('recurringExpense.deleteSuccess')});
    showFloating.value = false;
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting recurring expense:', error);
      showNotify({type: 'danger', message: t('recurringExpense.deleteError')});
    }
  }
}
</script>

<route lang="json5">
{
  name: '/recurring-expenses/', // vue-router/auto uses file path based naming
  meta: {
    title: 'Recurring Expenses',
    i18n: 'menus.recurringExpenses',
    requiresAuth: true,
  },
}
</route>

<style scoped>
.recurring-expense-list {
  padding: 8px;
}
:deep(.van-card) {
  margin: 8px 0;
  padding: 16px;
  width: 100%;
  border-radius: 8px;
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
.transaction-card {
  cursor: pointer;
}
.card-footer-custom {
  font-size: 12px;
  color: var(--van-text-color-2);
  padding-top: 8px;
}
.card-footer-custom span {
  display: block;
  margin-bottom: 2px;
}
</style>
