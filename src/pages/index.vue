<script setup lang="ts">
const {t} = useI18n();

const menuExampleItems = computed(() => [
  {title: t('menus.echartsDemo'), route: 'charts'},
  {title: t('menus.unocssExample'), route: 'unocss'},
  {title: t('menus.persistPiniaState'), route: 'counter'},
  {title: t('menus.keepAlive'), route: 'keepalive'},
  {title: t('menus.404Demo'), route: 'unknown'},
]);

const menuUsedItems = computed(() => [
  {title: t('menus.echartsTest'), route: 'echarts_test'},
  {title: t('menus.transaction'), route: 'add-transaction'},
  {title: t('menus.categories'), route: 'categories'},
  {title: t('menus.monthlyTransactions'), route: 'monthly-transactions'},
]);
</script>

<template>
  <VanCellGroup
    :title="t('menus.exampleComponents')"
    :border="false"
    :inset="true"
  >
    <template v-for="item in menuExampleItems" :key="item.route">
      <VanCell :title="item.title" :to="item.route" is-link />
    </template>
  </VanCellGroup>

  <VanCellGroup
    :title="t('menus.exampleComponents')"
    :border="false"
    :inset="true"
  >
    <template v-for="item in menuUsedItems" :key="item.route">
      <VanCell :title="item.title" :to="item.route" is-link />
    </template>
  </VanCellGroup>
</template>

<route lang="json5">
{
  name: 'home',
  meta: {
    title: 'home',
    i18n: 'menus.home',
  },
}
</route>
