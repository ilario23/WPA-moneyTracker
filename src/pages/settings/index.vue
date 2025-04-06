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

    <VanCell
      center
      is-link
      :title="t('settings.clearCache')"
      @click="clearCache"
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
import {languageColumns, locale} from '@/utils/i18n';
import {createCacheService} from '@/services/cache';
import {showNotify, showConfirmDialog} from 'vant';

const {t} = useI18n();
const appStore = useAppStore();
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
