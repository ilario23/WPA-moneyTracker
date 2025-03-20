<template>
  <VanCellGroup :title="t('menus.basicSettings')" :border="false" :inset="true">
    <VanCell center :title="t('menus.darkMode')">
      <template #right-icon>
        <VanSwitch v-model="checked" size="20px" aria-label="on/off Dark Mode" @click="toggle()" />
      </template>
    </VanCell>

    <VanCell center is-link :title="t('menus.language')" :value="language" @click="showLanguagePicker = true" />

    <VanCell center :title="$t('settings.currentVersion')">
    
      <div class="mt-10 text-gray">
       v{{ version }}
    </div>

    </VanCell>


  </VanCellGroup>




  <!-- Van Field per l'email -->

  <VanCellGroup :title="t('menus.user')" v-if="userInfo.email">
  <div class="text-center">
    <van-field label="E-mail" :placeholder="userInfo.email" readonly />

    <!-- Tasto Esci con una classe custom -->
    <van-button 
      type="danger" 
      size="large" 
      @click="Logout">
      {{ $t('settings.logout') }}
    </van-button>
  </div>
</VanCellGroup>



  <van-popup v-model:show="showLanguagePicker" position="bottom">
    <van-picker v-model="languageValues" :columns="languageColumns" @confirm="onLanguageConfirm"
      @cancel="showLanguagePicker = false" />
  </van-popup>
</template>

<script setup lang="ts">
import type { PickerColumn } from 'vant';
import { showConfirmDialog } from 'vant';
import router from '@/router';
import { useUserStore } from '@/stores';
import { version } from '~root/package.json';
import useAppStore from '@/stores/modules/app';
import { languageColumns, locale } from '@/utils/i18n';


const { t } = useI18n();
const userStore = useUserStore();
const appStore = useAppStore();
const userInfo = computed(() => userStore.userInfo);
const checked = ref<boolean>(isDark.value);

watch(
  () => isDark.value,
  (newMode) => {
    checked.value = newMode;
  },
  { immediate: true }
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

function onLanguageConfirm(event: { selectedOptions: PickerColumn }) {
  locale.value = event.selectedOptions[0].value as string;
  showLanguagePicker.value = false;
}

function Logout() {
  showConfirmDialog({
    title: t('settings.comfirmTitle'),
  })
    .then(() => {
      userStore.logout();
      router.push({ name: 'login' });
    })
    .catch(() => { });
}
</script>



<style scoped>
.van-text-color {
  --van-cell-text-color: var(--van-red);
}


</style>

<route lang="json5">
{
  name: 'settings',
  meta: {
    title: 'Settings',
    i18n: 'menus.settings',
  },
}
</route>
