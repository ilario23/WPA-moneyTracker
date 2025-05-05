<script setup lang="ts">
import {routeWhiteList} from '@/config/routes';

const {t} = useI18n();
const route = useRoute();

const show = computed(
  () => route.name && routeWhiteList.includes(route.name as string)
); // Cast route.name to string
</script>

<template>
  <van-tabbar v-if="show" placeholder route>
    <van-tabbar-item replace to="/add-transaction">
      {{ t('menus.transaction') }}
      <template #icon>
        <div class="i-carbon:add-alt" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/more/">
      {{ t('menus.more') }}
      <template #icon>
        <div class="i-carbon:menu" />
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>
