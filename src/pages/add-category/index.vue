<template>
  <div class="m-x-a w-7xl text-center">
    <div class="mb-32 mt-20">
      <van-icon :name="newCategory.icon" />
    </div>

    <van-form
      :model="newCategory"
      :rules="rules"
      validate-trigger="onSubmit"
      @submit="save"
    >
      <div class="overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.id"
          name="userId"
          :label="t('category.id')"
          readonly
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.title"
          :rules="rules.title"
          name="title"
          :label="t('category.title')"
          :placeholder="t('category.title')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.userId"
          :rules="rules.userId"
          name="userId"
          :placeholder="t('category.userId')"
          :label="t('category.userId')"
          readonly
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.color"
          :rules="rules.color"
          name="color"
          :placeholder="t('category.color')"
          :label="t('category.color')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.icon"
          :rules="rules.icon"
          name="icon"
          :placeholder="t('category.icon')"
          :label="t('category.icon')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.budget"
          :rules="rules.budget"
          name="budget"
          type="number"
          :placeholder="t('category.budget')"
          :label="t('category.budget')"
          disabled
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.parentCategoryId"
          :rules="rules.parentCategoryId"
          name="parentCategoryId"
          :placeholder="t('category.parentCategoryId')"
          :label="t('category.parentCategoryId')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field :label="t('category.excludeFromStat')" disabled>
          <template #input>
            <van-switch
              v-model="newCategory.excludeFromStat"
              :rules="rules.excludeFromStat"
              name="excludeFromStat"
              :title="t('category.excludeFromStat')"
            />
          </template>
        </van-field>
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field :label="t('category.active')" disabled>
          <template #input>
            <van-switch
              v-model="newCategory.active"
              :rules="rules.active"
              name="active"
              :title="t('category.active')"
            />
          </template>
        </van-field>
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
import type {Category} from '@/types/category';
import {useUserStore} from '@/stores';
import {API} from '@/api';

const userStore = useUserStore();
const categories = ref<Category[]>([]);

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

const newCategory = reactive({...EMPTY_CATEGORY});

const getUserCategories = () => {
  if (userStore.userInfo?.uid) {
    API.Database.Users.Categories.getUserCategories(
      userStore.userInfo?.uid
    ).then((res) => (categories.value = res));
  }
};

const rules = reactive({
  title: [{required: true, message: t('category.pleaseEnterTitle')}],
  userId: [{required: true, message: t('category.pleaseEnterUserId')}],
  color: [{required: false, message: t('category.pleaseEnterColor')}],
  icon: [{required: true, message: t('category.pleaseEnterIcon')}],
  budget: [{required: false, message: t('category.pleaseEnterBudget')}],
  parentCategoryId: [
    {required: false, message: t('category.pleaseEnterParentCategoryId')},
  ],
  excludeFromStat: [
    {required: true, message: t('category.pleaseEnterExcludeFromStat')},
  ],
  active: [{required: true, message: t('category.pleaseEnterActive')}],
});

const clearForm = () => {
  Object.assign(newCategory, EMPTY_CATEGORY);
};

const save = () => {
  if (userStore.userInfo?.uid)
    API.Database.Users.Categories.createUserCategory(
      userStore.userInfo.uid,
      newCategory
    )
      .then(getUserCategories)
      .catch((err) => console.error('failed creation category', err));
  clearForm();
};

async function addCategory() {
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
