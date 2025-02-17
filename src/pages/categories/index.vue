<template>
  <van-cascader
    v-if="false"
    v-model="selectedCategoryId2"
    :options="rootCategories"
    :field-names="fieldNames2"
    placeholder="Seleziona una categoria"
  />
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
    title="Delete Category"
    message="Are you sure you want to delete this category?"
    show-cancel-button
    show-confirm-button
    @confirm="handleDeleteConfirm"
    @cancel="handleCancel"
  />

  <van-dialog
    v-model:show="showEditDialog"
    title="Edit Category"
    show-cancel-button
    show-confirm-button
    @confirm="handleEditConfirm"
    @cancel="handleCancel"
  >
    <van-field
      v-model="selectedCategory.text"
      label="Category Name"
      placeholder="Enter category name"
    />
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
import {showNotify} from 'vant';

const showDeleteDialog = ref(false);
const showEditDialog = ref(false);

// Example data (these could be fetched from a database, e.g., Firebase)
const rawCategories = [
  {
    id: '11',
    title: 'General Expenses',
    color: '#FF5733',
    parentCategoryId: null,
    userId: 'user123',
    active: true,
    icon: 'fire-o',
    budget: 1000,
    excludeFromStat: false,
  },
  {
    id: '2',
    title: 'Savings',
    color: '#33FF57',
    parentCategoryId: null,
    userId: 'user123',
    active: true,
    icon: 'chat-o',
    budget: 2000,
    excludeFromStat: false,
  },
  {
    id: '3',
    title: 'Food & Drinks',
    color: '#FFBD33',
    parentCategoryId: '11',
    userId: 'user123',
    active: true,
    icon: 'cart-o',
    budget: 500,
    excludeFromStat: false,
  },
  {
    id: '4',
    title: 'Transport',
    color: '#33BDFF',
    parentCategoryId: '11',
    userId: 'user123',
    active: true,
    icon: 'smile-o',
    budget: 300,
    excludeFromStat: false,
  },
  {
    id: '5',
    title: 'Supermarket',
    color: '#FFC733',
    parentCategoryId: '3',
    userId: 'user123',
    active: true,
    icon: 'brush-o',
    budget: 300,
    excludeFromStat: false,
  },
  {
    id: '6',
    title: 'Restaurants',
    color: '#FF5733',
    parentCategoryId: '3',
    userId: 'user123',
    active: true,
    icon: 'shop-o',
    budget: 200,
    excludeFromStat: false,
  },
];

// Function to prune empty children
const pruneEmptyChildren = (node: any) => {
  if (node.children.length === 0) {
    delete node.children;
  } else {
    node.children.forEach(pruneEmptyChildren); // Recursively prune children
  }
};

// Function to build category tree
const buildCategoryTree = (categories: any[]) => {
  const categoryMap = new Map<number, any>();
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
    if (category.parentCategoryId === null) {
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

// Root categories
const rootCategories = buildCategoryTree(rawCategories);

const fieldNames2 = ref({
  active: 'active',
  budget: 'budget',
  children: 'children',
  color: 'color',
  excludeFromStat: 'excludeFromStat',
  icon: 'icon',
  id: 'id',
  parentCategoryId: 'parentCategoryId',
  title: 'title',
  userId: 'userId',
});

// Selected category ID
const selectedCategoryId2 = ref<string>('');

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
const handleDeleteConfirm = () => {
  if (selectedCategory.value.children) {
    console.log('Cannot delete category with children');
    // Show an alert for that
    showNotify({
      type: 'danger',
      message: 'You can only delete a category without children',
    });
    console.log('TODO: add translation');
    return;
  } else {
    console.log('Delete category with id:', selectedCategory.value.value);
    console.log('TODO: Delete category');
  }

  showDeleteDialog.value = false;
};

// Function to handle edit confirm action
const handleEditConfirm = () => {
  console.log('Edit category with id:', selectedCategory.value.value);
  console.log('TODO: Edit category');
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
