<template>
  <VanCellGroup :title="t('menus.basicSettings')" :border="false" :inset="true">
    <VanCell center :title="t('menus.darkMode')">
      <template #right-icon>
        <VanSwitch
          v-model="checked"
          size="20px"
          label="on/off Dark Mode"
          @click="toggle()"
        />
      </template>
    </VanCell>

    <VanCell
      center
      is-link
      :title="t('menus.language')"
      :value="language"
      @click="showLanguagePicker = true"
    />

    <VanCell center :title="$t('settings.currentVersion')">
      <div class="text-gray">v{{ version }}</div>
    </VanCell>

    <VanCell center :title="$t('settings.environmentMode')">
      <div class="text-gray">{{ environmentMode }}</div>
    </VanCell>
  </VanCellGroup>

  <VanCellGroup
    :title="t('settings.cacheSectionTitle')"
    :border="false"
    :inset="true"
  >
    <VanCell
      center
      is-link
      :title="t('settings.clearCache')"
      @click="clearCache"
    />
    <VanCell
      center
      is-link
      :title="t('settings.clearRecurringExpensesCache')"
      @click="clearRecurringExpensesCache"
    />
    <VanCell
      center
      is-link
      :title="t('settings.clearTransactionsCache')"
      @click="clearTransactionsCache"
    />
    <VanCell
      center
      is-link
      :title="t('settings.clearCategoriesCache')"
      @click="clearCategoriesCache"
    />
    <VanCell
      center
      is-link
      :title="t('settings.clearRemindersCache')"
      @click="clearRemindersCache"
    />
  </VanCellGroup>

  <van-popup v-model:show="showLanguagePicker" position="bottom">
    <van-picker
      v-model="languageValues"
      :columns="languageColumns"
      @confirm="onLanguageConfirm"
      @cancel="showLanguagePicker = false"
    />
  </van-popup>
</template>

<script setup lang="ts">
import type {PickerColumn} from 'vant';
import {version} from '~root/package.json';
import useAppStore from '@/stores/modules/app';
import {useUserStore} from '@/stores/modules/user';
import {languageColumns, locale} from '@/utils/i18n';
import {createCacheService} from '@/services/cache';
import {showNotify, showConfirmDialog} from 'vant';
import {RecurringSyncService} from '@/services/recurringSync';
import {ReminderSyncService} from '@/services/reminderSync';

const {t} = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const environmentMode = computed(() => import.meta.env.MODE);
const checked = ref<boolean>(isDark.value);
const cacheService = createCacheService();

watch(
  () => isDark.value,
  (newMode) => {
    checked.value = newMode;
  },
  {immediate: true}
);

function toggle() {
  toggleDark();
  appStore.switchMode(isDark.value ? 'dark' : 'light');
}

const showLanguagePicker = ref(false);
const languageValues = ref<Array<string>>([locale.value]);
const language = computed(
  () => languageColumns.find((l) => l.value === locale.value).text
);

function onLanguageConfirm(event: {selectedOptions: PickerColumn}) {
  locale.value = event.selectedOptions[0].value as string;
  showLanguagePicker.value = false;
}

async function clearCache() {
  try {
    await showConfirmDialog({
      title: t('settings.clearCache'),
      message: t('settings.clearCacheConfirm'),
    });

    await cacheService.clearStore();
    showNotify({type: 'success', message: t('settings.cacheClearedSuccess')});
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Error clearing cache:', error);
    showNotify({type: 'danger', message: t('settings.cacheClearError')});
  }
}

async function clearRecurringExpensesCache() {
  try {
    await showConfirmDialog({
      title: t('settings.clearRecurringExpensesCache'),
      message: t('settings.clearRecurringExpensesCacheConfirm'),
    });

    await RecurringSyncService.clearRecurringExpensesCache();
    showNotify({
      type: 'success',
      message: t('settings.recurringExpensesCacheClearedSuccess'),
    });
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Error clearing recurring expenses cache:', error);
    showNotify({
      type: 'danger',
      message: t('settings.recurringExpensesCacheClearError'),
    });
  }
}

async function clearTransactionsCache() {
  try {
    await showConfirmDialog({
      title: t('settings.clearTransactionsCache'),
      message: t('settings.clearTransactionsCacheConfirm'),
    });

    const store = await cacheService.getStore();
    if (store) {
      store.transactions = {};
      store.tokens.transactionTokens = {};
      await cacheService.setStore(store);
    }
    showNotify({
      type: 'success',
      message: t('settings.transactionsCacheClearedSuccess'),
    });
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Error clearing transactions cache:', error);
    showNotify({
      type: 'danger',
      message: t('settings.transactionsCacheClearError'),
    });
  }
}

async function clearCategoriesCache() {
  try {
    await showConfirmDialog({
      title: t('settings.clearCategoriesCache'),
      message: t('settings.clearCategoriesCacheConfirm'),
    });

    const store = await cacheService.getStore();
    if (store) {
      store.categories = [];
      store.tokens.categoriesToken = '';
      await cacheService.setStore(store);
    }
    showNotify({
      type: 'success',
      message: t('settings.categoriesCacheClearedSuccess'),
    });
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Error clearing categories cache:', error);
    showNotify({
      type: 'danger',
      message: t('settings.categoriesCacheClearError'),
    });
  }
}

async function clearRemindersCache() {
  try {
    await showConfirmDialog({
      title: t('settings.clearRemindersCache'),
      message: t('settings.clearRemindersCacheConfirm'),
    });

    ReminderSyncService.clearCache(userStore.userInfo.uid);
    showNotify({
      type: 'success',
      message: t('settings.remindersCacheClearedSuccess'),
    });
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Error clearing reminders cache:', error);
    showNotify({
      type: 'danger',
      message: t('settings.remindersCacheClearError'),
    });
  }
}
</script>

<style scoped></style>

<route lang="json5">
{
  name: 'settings',
  meta: {
    title: 'Settings',
    i18n: 'menus.settings',
  },
}
</route>
