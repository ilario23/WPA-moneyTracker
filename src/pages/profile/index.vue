<template>
  <div>
    <VanCellGroup :inset="true">
      <van-cell center @click="clickProfile" :value="userInfo.email">
        <template #title>
          <van-image
            :src="userInfo.avatar || defaultAvatar"
            round
            class="h-56 w-56"
          />
        </template>
      </van-cell>
    </VanCellGroup>

    <VanCellGroup
      :title="t('menus.basicSettings')"
      :border="false"
      :inset="true"
    >
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

      <VanCell
        center
        :title="$t('settings.currentVersion')"
        @click="handleBasicSettingsClick"
      >
        <template #value>
          <div>
            <span>v{{ APP_VERSION }}</span>
            <span>•</span>
            <span>
              {{ new Date(BUILD_DATE).toLocaleDateString() }}
            </span>
          </div>
        </template>
      </VanCell>

      <VanCell center :title="$t('settings.environmentMode')">
        <div class="text-gray">
          {{
            environmentMode.charAt(0).toUpperCase() + environmentMode.slice(1)
          }}
        </div>
      </VanCell>
    </VanCellGroup>

    <VanCellGroup
      :title="t('settings.cacheSection')"
      :border="false"
      :inset="true"
    >
      <van-collapse v-model="activeCollapse" :border="false">
        <van-collapse-item
          :title="t('settings.cacheSectionTitle')"
          :inset="true"
        >
          <VanCell center :title="t('settings.clearCache')" @click="clearCache">
            <template #right-icon>
              <van-icon name="close" />
            </template>
          </VanCell>
          <VanCell
            center
            :title="t('settings.clearRecurringExpensesCache')"
            @click="clearRecurringExpensesCache"
          >
            <template #right-icon>
              <van-icon name="close" />
            </template>
          </VanCell>
          <VanCell
            center
            :title="t('settings.clearTransactionsCache')"
            @click="clearTransactionsCache"
          >
            <template #right-icon>
              <van-icon name="close" />
            </template>
          </VanCell>
          <VanCell
            center
            :title="t('settings.clearCategoriesCache')"
            @click="clearCategoriesCache"
          >
            <template #right-icon>
              <van-icon name="close" />
            </template>
          </VanCell>
        </van-collapse-item>
      </van-collapse>
    </VanCellGroup>

    <van-popup v-model:show="showLanguagePicker" position="bottom">
      <van-picker
        v-model="languageValues"
        :columns="languageColumns"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>

    <!-- Moved turtle logo to conditional rendering -->
    <Transition name="bounce">
      <div
        v-if="showTurtle"
        class="fixed bottom-100 left-1/2 -translate-x-1/2 z-10"
      >
        <img
          src="@/assets/images/turtle-logo.gif"
          class="h-156"
          alt="logo image"
        />
      </div>
    </Transition>

    <!-- Dialog -->
    <van-dialog
      v-model:show="showDialog"
      :title="$t('profile.userInfo')"
      confirm-button-text="Logout"
      closeOnClickOverlay
    >
      <van-cell-group>
        <div class="px-5">
          <van-field
            :label="$t('profile.userEmail')"
            :placeholder="userInfo.email"
            readonly
            class="mt-10"
          />
          <van-field
            :label="$t('profile.userDisplayName')"
            :placeholder="userInfo.displayName"
            readonly
          />
          <van-field
            :label="$t('profile.userUid')"
            :placeholder="userInfo.uid"
            readonly
          />
          <van-cell center :title="$t('profile.userAvatar')">
            <template #right-icon>
              <van-image
                :src="userInfo.avatar || defaultAvatar"
                round
                class="h-36 w-36"
              />
            </template>
          </van-cell>
        </div>
      </van-cell-group>
      <template #footer>
        <van-button type="danger" @click="logout" block>
          {{ $t('profile.logout') }}
        </van-button>
      </template>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onBeforeUnmount} from 'vue';
import {useUserStore} from '@/stores';
import {showNotify, showConfirmDialog} from 'vant';
import defaultAvatar from '@/assets/images/default-avatar.svg';
import {createCacheService} from '@/services/cache';
import type {PickerColumn} from 'vant';
import useAppStore from '@/stores/modules/app';
import {languageColumns, locale} from '@/utils/i18n';
import {RecurringSyncService} from '@/services/recurringSync';
import {BUILD_DATE, APP_VERSION} from '@/generated/build-info';

const {t} = useI18n();
const router = useRouter();

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

const appStore = useAppStore();
const environmentMode = computed(() => import.meta.env.MODE);
const checked = ref<boolean>(isDark.value);
const cacheService = createCacheService();
const activeCollapse = ref<string[]>([]);

// Stato per la dialog
const showDialog = ref(false);

function clickProfile() {
  showDialog.value = true; // Mostra la dialog
}

async function logout() {
  try {
    await showConfirmDialog({
      title: t('profile.comfirmTitle'),
    });

    showDialog.value = false;

    // Clear the cache before logout
    const cache = createCacheService();
    await cache.clearStore();

    await userStore.logout();
    showNotify({type: 'success', message: t('profile.succesfulLogout')});
    router.push({name: 'login'});
  } catch (error) {
    if (error?.toString().includes('cancel')) return;
    console.error('Errore durante il logout:', error);
    showNotify({type: 'danger', message: t('profile.errorLogout')});
  }
}

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

// Easter egg logic
const clickCount = ref(0);
const lastClickTime = ref(Date.now());
const showTurtle = ref(false);
let hideTimer: NodeJS.Timeout | null = null;

function handleBasicSettingsClick() {
  const now = Date.now();
  if (now - lastClickTime.value > 5000) {
    // Reset if more than 5 seconds passed
    clickCount.value = 1;
  } else {
    clickCount.value++;
  }
  lastClickTime.value = now;

  if (clickCount.value === 5) {
    showTurtle.value = true;
    clickCount.value = 0; // Reset counter

    // Clear any existing timer
    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    // Hide turtle after 3 seconds
    hideTimer = setTimeout(() => {
      showTurtle.value = false;
    }, 5000);
  }
}

// Clean up timer when component is unmounted
onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}
.bounce-leave-active {
  animation: bounce-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse;
}
@keyframes bounce-in {
  0% {
    transform: translateX(-50%) scale(0);
  }
  50% {
    transform: translateX(-50%) scale(1.25);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}
</style>

<route lang="json5">
{
  name: 'profile',
  meta: {
    title: 'profile',
    i18n: 'menus.profile',
  },
}
</route>
