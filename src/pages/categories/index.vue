<template>
  <div>
    <div style="display: flex; width: 100%; gap: 12px; padding: 8px">
      <van-cell
        v-for="root in rootCategories"
        :key="root.value"
        :title="root.text"
        @click="selectCategory(root)"
        style="flex: 1; text-align: center; padding: 12px; border-radius: 8px"
      >
        <template #right-icon>
          <van-icon :name="root.icon" />
        </template>
      </van-cell>
    </div>

    <van-swipe-cell
      v-if="selectedCategory && selectedCategory.text"
      :title="selectedCategory.text"
    >
      <van-card
        num="1"
        price="2.00"
        desc="Description"
        :title="selectedCategory.text"
        class="goods-card"
        thumb="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg"
      />
      <template #right>
        <van-button
          square
          icon="delete-o"
          type="danger"
          style="height: 100%"
          @click="showDeleteDialog = true"
        />
      </template>
      <template #left>
        <van-button
          square
          icon="edit"
          type="primary"
          style="height: 100%"
          @click="showEditDialog = true"
        />
      </template>
    </van-swipe-cell>

    <div v-if="selectedCategory.children">
      <van-divider dashed>Children </van-divider>
      <van-cell-group inset>
        <van-cell
          v-for="child in selectedCategory.children"
          :key="child.value"
          :title="child.text"
          @click="selectCategory(child)"
        >
          <template #right-icon>
            <van-icon :name="child.icon" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>

  <van-dialog
    v-model:show="showDeleteDialog"
    :title="$t('category.delete')"
    :message="$t('category.deleteConfirm')"
    show-cancel-button
    show-confirm-button
    @confirm="handleDeleteConfirm"
    @cancel="handleCancel"
  />

  <van-dialog
    v-model:show="showEditDialog"
    :title="$t('category.edit')"
    show-cancel-button
    show-confirm-button
    @confirm="handleEditConfirm"
    @cancel="handleCancel"
  >
    <van-field v-model="selectedCategory.text" :label="$t('category.title')" />
  </van-dialog>

  <van-button
    type="primary"
    icon="plus"
    style="
      position: fixed;
      bottom: 16px;
      right: 16px;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    "
    to="/add-category"
  />
</template>

<script lang="ts" setup>
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {showNotify} from 'vant';
import {useUserStore} from '@/stores';
import type {Category} from '@/types/category';
import {API} from '@/api';
import {useRouter} from 'vue-router';
import {BASE_CATEGORIES_ID} from '@/utils/category';

const {t: $t} = useI18n();

const userStore = useUserStore();
const router = useRouter();
const categories = ref<Category[]>([]);
const rootCategories = ref();

const showDeleteDialog = ref(false);
const showEditDialog = ref(false);

// Function to build category tree
const buildCategoryTree = (categories: any[]) => {
  const categoryMap = new Map<string, any>();
  const roots: any[] = [];

  // Create initial map without children
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      text: category.title,
      value: category.id,
      children: [],
      icon: category.icon,
      color: category.color,
      budget: category.budget,
      excludeFromStat: category.excludeFromStat,
    });
  });

  // Populate hierarchy
  categories.forEach((category) => {
    const node = categoryMap.get(category.id);
    if (category.parentCategoryId == null || category.parentCategoryId == '') {
      roots.push(node);
    } else {
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Prune empty children
  roots.forEach(pruneEmptyChildren);

  return roots;
};

// Function to prune empty children
const pruneEmptyChildren = (node: any) => {
  if (node.children.length === 0) {
    delete node.children;
  } else {
    node.children.forEach(pruneEmptyChildren); // Recursively prune children
  }
};

// Function to get user categories
const getUserCategories = () => {
  if (userStore.userInfo?.uid) {
    API.Database.Users.Categories.getUserCategories(
      userStore.userInfo?.uid
    ).then((res) => {
      categories.value = res;
      rootCategories.value = buildCategoryTree(categories.value);
    });
  }
};

// Root categories
getUserCategories();

// Function to find category by ID
const findCategory = (categories: any[], id: string) => {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children) {
      const child = findCategory(category.children, id);
      if (child) return child;
    }
  }
  return null;
};

// Selected category details
const selectedCategory = ref({
  value: null,
  text: '',
  children: null,
});

// Function to select a category and show details
const selectCategory = (category) => {
  selectedCategory.value = category;
};

// Function to handle delete confirm action
const handleDeleteConfirm = async () => {
  if (selectedCategory.value.children) {
    console.log('Cannot delete category with children');
    // Show an alert for that
    showNotify({
      type: 'danger',
      message: $t('category.noDeletionIfChildren'),
    });
    return;
  }

  try {
    // Ottieni l'ID della categoria selezionata
    const categoryId = selectedCategory.value.value;

    if (!categoryId) {
      showNotify({
        type: 'danger',
        message: $t('category.noCategorySelectedForDeletion'),
      });
      return;
    }

    // Verifica se la categoria è una delle categorie originali
    if (BASE_CATEGORIES_ID.includes(categoryId)) {
      showNotify({
        type: 'danger',
        message: $t('category.noDeletionOfDefaultCategory'),
      });
      return;
    }

    // Chiama l'API per cancellare la categoria
    await API.Database.Users.Categories.deleteUserCategory(
      userStore.userInfo?.uid,
      categoryId
    );

    // Aggiorna la lista delle categorie
    getUserCategories();

    // Mostra una notifica di successo
    showNotify({
      type: 'success',
      message: $t('category.deleteSuccess'),
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    showNotify({
      type: 'danger',
      message: $t('category.deleteError'),
    });
  } finally {
    // Chiudi la dialog
    showDeleteDialog.value = false;
  }
};

// Function to handle edit confirm action
const handleEditConfirm = () => {
  if (!selectedCategory.value.value) {
    showNotify({
      type: 'danger',
      message: $t('category.noCategorySelectedForEditing'),
    });
    return;
  }
  // Reindirizza alla pagina add-category con i dati della categoria selezionata
  router.push({
    name: 'add-category',
    query: {
      id: selectedCategory.value.value,
    },
  });

  // Chiudi la dialog
  showEditDialog.value = false;
};

// Function to handle cancel action
const handleCancel = () => {
  console.log('cancel');
  showDeleteDialog.value = false;
  showEditDialog.value = false;
};
</script>

<route lang="json5">
{
  name: 'categories',
  meta: {
    title: 'Categories',
    i18n: 'menus.categories',
  },
}
</route>

<style scoped></style>
