<template>
  <div class="m-x-a w-7xl text-center">
    <div class="mb-32 mt-20">
      <van-icon :name="newCategory.icon" />
    </div>

    <van-form
      :model="newCategory"
      validate-trigger="onSubmit"
      @submit="save"
      :rules="rules"
    >
      <div class="overflow-hidden rounded-3xl">
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
          v-model="newCategory.parentCategoryId"
          name="parentCategoryId"
          :label="t('category.parentCategoryId')"
          :placeholder="t('category.parentCategoryId')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.color"
          name="color"
          :label="t('category.color')"
          :placeholder="t('category.color')"
          type="color"
          @change="
            () => {
              console.log('Selected color:', newCategory.color);
            }
          "
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.icon"
          name="icon"
          :rules="rules.icon"
          :label="t('category.icon')"
          :placeholder="t('category.icon')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="newCategory.budget"
          name="budget"
          type="number"
          :label="t('category.budget')"
          :placeholder="t('category.budget')"
          disabled
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
              disabled
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
              disabled
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
          {{ route.query.id ? t('category.update') : t('category.add') }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onBeforeMount, toRaw} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {showNotify} from 'vant';
import {EMPTY_CATEGORY} from '@/utils/category';
import type {Category} from '@/types/category';
import {useUserStore} from '@/stores';
import {API} from '@/api';
import {useI18n} from 'vue-i18n';
const {t} = useI18n();

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);

const newCategory = reactive<Category>({...EMPTY_CATEGORY});

const rules = reactive({
  title: [{required: true, message: t('category.pleaseEnterTitle')}],
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

onBeforeMount(async () => {
  newCategory.id = crypto.randomUUID();
  if (route.query.id) {
    console.log('route.query.id', route.query.id);
    const temp = await API.Database.Users.Categories.getUserCategoryById(
      userStore.userInfo?.uid,
      route.query.id as string
    );

    if (temp) {
      // Assegna i valori alla reactive `newCategory`
      Object.assign(newCategory, toRaw(temp));
    }
  }
  console.log('newCategory.id:', newCategory.id);
});

const save = async () => {
  try {
    loading.value = true;

    if (userStore.userInfo?.uid) {
      if (route.query.id) {
        // Modifica categoria esistente
        await API.Database.Users.Categories.updateUserCategory(
          userStore.userInfo.uid,
          newCategory
        );
        showNotify({type: 'success', message: 'Category updated successfully'});
      } else {
        // Crea nuova categoria
        await API.Database.Users.Categories.createUserCategory(
          userStore.userInfo.uid,
          newCategory
        );
        showNotify({type: 'success', message: 'Category added successfully'});
      }
      Object.assign(newCategory, EMPTY_CATEGORY);
      router.push({name: 'categories'});
    }
  } catch (error) {
    console.error('Error saving category:', error);
    showNotify({type: 'danger', message: 'Failed to save category'});
  } finally {
    loading.value = false;
  }
};
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
