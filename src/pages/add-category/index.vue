<template>
  <div class="m-x-a w-7xl text-center">
    <div class="mb-32 mt-20">
      <van-icon :name="categoryData.icon" />
    </div>

    <van-form
      :model="categoryData"
      :rules="rules"
      validate-trigger="onSubmit"
      @submit="addCategory"
    >
      <div class="overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.title"
          :rules="rules.title"
          name="title"
          :placeholder="t('category.title')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.userId"
          :rules="rules.userId"
          name="userId"
          :placeholder="t('category.userId')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.color"
          :rules="rules.color"
          name="color"
          :placeholder="t('category.color')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.icon"
          :rules="rules.icon"
          name="icon"
          :placeholder="t('category.icon')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.budget"
          :rules="rules.budget"
          name="budget"
          type="number"
          :placeholder="t('category.budget')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="categoryData.parentCategoryId"
          :rules="rules.parentCategoryId"
          name="parentCategoryId"
          :placeholder="t('category.parentCategoryId')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-switch
          v-model="categoryData.excludeFromStat"
          :rules="rules.excludeFromStat"
          name="excludeFromStat"
          :title="t('category.excludeFromStat')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-switch
          v-model="categoryData.active"
          :rules="rules.active"
          name="active"
          :title="t('category.active')"
        />
      </div>

      <div class="mt-16">
        <van-button
          :loading="loading"
          type="primary"
          native-type="submit"
          round
          block
        >
          {{ $t('category.add') }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {useRouter} from 'vue-router';
import {showNotify} from 'vant';
import {EMPTY_CATEGORY} from '@/utils/category';

const {t} = useI18n();
const router = useRouter();
const loading = ref(false);

const dark = ref<boolean>(isDark.value);

watch(
  () => isDark.value,
  (newMode) => {
    dark.value = newMode;
  }
);

const categoryData = reactive({...EMPTY_CATEGORY});

const rules = reactive({
  title: [{required: true, message: t('category.pleaseEnterTitle')}],
  userId: [{required: true, message: t('category.pleaseEnterUserId')}],
  color: [{required: true, message: t('category.pleaseEnterColor')}],
  icon: [{required: true, message: t('category.pleaseEnterIcon')}],
  budget: [{required: true, message: t('category.pleaseEnterBudget')}],
  parentCategoryId: [
    {required: true, message: t('category.pleaseEnterParentCategoryId')},
  ],
  excludeFromStat: [
    {required: true, message: t('category.pleaseEnterExcludeFromStat')},
  ],
  active: [{required: true, message: t('category.pleaseEnterActive')}],
});

async function addCategory(values: any) {
  try {
    loading.value = true;
    // Simulate adding a category
    await new Promise((resolve) => setTimeout(resolve, 1000));
    showNotify({type: 'success', message: t('category.success')});
    router.push({name: 'categories'});
  } catch (error) {
    showNotify({type: 'danger', message: t('category.error')});
  } finally {
    loading.value = false;
  }
}
</script>

<route lang="json5">
{
  name: 'add-category',
  meta: {
    title: 'Add Category',
    i18n: 'menus.add-category',
  },
}
</route>

<style scoped>
/* Aggiungi qui i tuoi stili personalizzati */
</style>
