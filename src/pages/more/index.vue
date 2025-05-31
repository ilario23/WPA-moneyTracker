<script setup lang="ts">
const {t} = useI18n();
</script>

<template>
  <div class="more-page-container p-2">
    <!-- Group 1: Transactions & Planning -->
    <VanCellGroup
      inset
      :title="t('morePage.groupTransactionsTitle')"
      class="mb-4"
    >
      <VanCell
        :title="t('menus.monthlyTransactions')"
        to="/monthly-transactions"
        is-link
      >
        <template #icon>
          <div class="i-carbon:IbmKnowledgeCatalog mt-4 mr-5"></div>
        </template>
      </VanCell>
      <VanCell
        :title="t('menus.recurringExpenses')"
        to="/recurring-expenses"
        is-link
      >
        <template #icon>
          <div class="i-carbon:Renew mt-4 mr-5"></div>
        </template>
      </VanCell>
    </VanCellGroup>

    <VanCellGroup inset :title="t('morePage.groupAnalyticsTitle')" class="mb-4">
      <VanCell
        :title="t('menus.financialCharts', 'Financial Charts')"
        to="/financial-charts"
        is-link
      >
        <template #icon>
          <div class="i-carbon:Analytics mt-4 mr-5"></div>
        </template>
      </VanCell>
    </VanCellGroup>

    <!-- Group 2: Data Management -->
    <VanCellGroup
      inset
      :title="t('morePage.groupDataManagementTitle')"
      class="mb-4"
    >
      <VanCell :title="t('menus.categories')" to="/categories" is-link>
        <template #icon>
          <div class="i-carbon:DataClass mt-4 mr-5"></div>
        </template>
      </VanCell>
    </VanCellGroup>

    <!-- Group 3: Account -->
    <VanCellGroup inset :title="t('morePage.groupAccountTitle')" class="mb-4">
      <VanCell :title="t('menus.settings')" to="/profile" is-link>
        <template #icon>
          <div class="i-carbon:Tools mt-4 mr-5"></div>
        </template>
      </VanCell>
    </VanCellGroup>
  </div>
</template>

<style scoped>
.more-page-container {
  padding-bottom: 60px; /* Add padding to avoid overlap with tabbar if present */
}
.mb-4 {
  margin-bottom: 16px; /* Equivalent to UnoCSS mb-4, adjust as needed */
}
</style>

<route lang="json5">
{
  name: 'more',
  meta: {
    title: 'More',
    i18n: 'menus.more',
  },
}
</route>
