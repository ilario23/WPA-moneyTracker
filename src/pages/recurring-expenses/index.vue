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
      <van-swipe-cell
        v-for="expense in sortedRecurringExpenses"
        :key="expense.id"
      >
        <template #left>
          <van-button
            square
            type="primary"
            :text="$t('recurringExpense.edit')"
            @click="handleEdit(expense)"
          />
        </template>
        <template #right>
          <van-button
            square
            type="danger"
            :text="$t('recurringExpense.delete')"
            @click="handleDelete(expense)"
          />
        </template>
        <van-card
          :price="expense.amount"
          :desc="expense.description || ''"
          currency="€"
          :style="{
            backgroundColor: `${getCategoryColor(expense.categoryId)}30`,
          }"
        >
          <template #title>
            <div class="card-title-custom">
              <span>{{ getCategoryName(expense.categoryId) }}</span>
            </div>
          </template>
          <template #thumb>
            <van-icon
              :name="getCategoryIcon(expense.categoryId)"
              :style="{color: getCategoryColor(expense.categoryId)}"
              class="category-icon-custom"
              size="32px"
            />
          </template>
          <template #tags>
            <van-tag plain type="primary" class="frequency-tag">{{
              formatFrequency(expense.frequency)
            }}</van-tag>
          </template>
          <template #footer>
            <div class="card-footer-custom">
              <span
                >{{ $t('recurringExpense.nextOccurrence') }}:
                {{ formatDate(expense.nextOccurrence) }}</span
              >
              <span
                >{{ $t('recurringExpense.startDate') }}:
                {{ formatDate(expense.startDate) }}</span
              >
            </div>
          </template>
        </van-card>
      </van-swipe-cell>
    </div>
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

function handleEdit(expense: RecurringExpenseDefinition) {
  router.push({
    name: 'transaction', // Route name for add-transaction page
    query: {recurringExpenseId: expense.id},
  });
}

async function handleDelete(expense: RecurringExpenseDefinition) {
  try {
    await showConfirmDialog({
      // Corrected function call
      title: t('recurringExpense.deleteConfirmTitle'),
      message: t('recurringExpense.deleteConfirmMessage'),
    });
    await UserRecurringExpenses.deleteRecurringExpense(userId, expense.id);
    showNotify({type: 'success', message: t('recurringExpense.deleteSuccess')});
    fetchData(); // Refresh list
  } catch (error) {
    // If error is not 'cancel' (from dialog), then show error notification
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
.van-swipe-cell {
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
:deep(.van-card) {
  border-radius: 0; /* Remove card radius if swipe cell has it */
  background-color: var(--van-background-2); /* Match theme */
}
.card-title-custom {
  font-weight: bold;
  font-size: 16px;
}
.category-icon-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.frequency-tag {
  margin-top: 4px;
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

:deep(.van-card__thumb) {
  width: 48px; /* Adjust as needed */
  margin-right: 10px;
}

:deep(.van-card__content) {
  min-height: auto; /* Override Vant's min-height if it causes layout issues */
}

:deep(.van-button--square) {
  height: 100%;
}
</style>
