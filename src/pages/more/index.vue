<script setup lang="ts">
const {t} = useI18n();

const menuUsedItems = computed(() => [
  {title: t('menus.echartsTest'), route: '/echarts-test'},
  {title: t('menus.categories'), route: '/categories'},
  {title: t('menus.monthlyTransactions'), route: '/monthly-transactions'},
  {title: t('menus.profile'), route: '/profile'},
]);
</script>

<template>
  <VanCellGroup
    :border="false"
    :inset="true"
    :title="t('menus.listComponents')"
  >
    <template v-for="item in menuUsedItems" :key="item.route">
      <VanCell :title="item.title" :to="item.route" is-link />
    </template>
  </VanCellGroup>
</template>

<route lang="json5">
{
  name: 'more',
  meta: {
    title: 'More',
    i18n: 'menus.more',
  },
}
</route>
