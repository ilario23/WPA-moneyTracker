<template>
  <van-pull-refresh
    v-model="loadingPullRefresh"
    @refresh="onPullRefresh"
    :success-text="$t('category.refreshSuccess')"
  >
    <div style="align-items: center; min-height: 70vh">
      <van-divider style="margin: auto">{{
        $t('category.rootCategories')
      }}</van-divider>
      <div style="display: flex; width: 100%; gap: 12px">
        <van-cell
          v-for="root in rootCategories"
          :key="root.value"
          :title="root.text"
          @click="selectCategory(root)"
          style="
            padding: 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
          "
        >
          <template #right-icon>
            <van-icon
              :name="root.icon"
              style="font-size: 20px; align-self: center; padding-right: 5px"
            />
          </template>
        </van-cell>
      </div>

      <!-- Animazione per la categoria selezionata -->
      <transition name="slide-horizontal" mode="out-in">
        <van-swipe-cell
          v-if="selectedCategory && selectedCategory.text"
          :key="selectedCategory.value"
          :title="selectedCategory.text"
        >
          <van-cell
            :title="selectedCategory.text"
            :style="{
              border: `1px solid ${selectedCategory.color}`,
              borderRadius: '8px',
              marginBottom: '12px',
              marginTop: '12px',
              backgroundColor: hexToRgba(selectedCategory.color, 0.07),
            }"
          >
            <template #icon>
              <van-icon :name="selectedCategory.icon" style="font-size: 32px" />
            </template>
          </van-cell>

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
      </transition>

      <!-- Transizione di fade-in con ritardo -->
      <transition name="fade-delayed">
        <div v-if="selectedCategory.children">
          <van-divider dashed>{{ $t('category.children') }}</van-divider>
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
      </transition>
    </div>
  </van-pull-refresh>

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

const selectedIcon = ref(''); // Variabile per memorizzare l'icona della categoria selezionata

// loadind pull refresh
const loadingPullRefresh = ref(false);

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

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const onPullRefresh = async () => {
  loadingPullRefresh.value = true;

  if (userStore.userInfo?.uid) {
    try {
      const res = await API.Database.Users.Categories.getResetUserCategories(
        userStore.userInfo.uid
      );
      categories.value = res;
      rootCategories.value = buildCategoryTree(categories.value);
    } catch (error) {
      console.error('onPullRefresh - error', error);
      showNotify({
        type: 'danger',
        message: $t('category.fetchError'),
      });
    }
  } else {
    showNotify({
      type: 'danger',
      message: $t('category.noUser'),
    });
  }

  await sleep(300);
  loadingPullRefresh.value = false;
  // set il focus del cascader a null
  selectedCategory.value = {
    value: null,
    text: '',
    children: null,
    icon: '',
    color: '',
  };
};

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
  icon: '',
  color: '',
});

// Function to select a category and show details
const selectCategory = (category) => {
  selectedCategory.value = category; // Aggiorna la categoria selezionata
  fetchCategoryIconColor(); // Recupera i dettagli della categoria e aggiorna l'icona
  console.log('selectedCategory.value.color', selectedCategory.value.color);
};

// Function to fetch category icon
const fetchCategoryIconColor = async () => {
  try {
    const categoryId = selectedCategory.value.value; // Ottieni l'ID della categoria selezionata
    if (!categoryId) {
      console.error('Nessuna categoria selezionata');
      return;
    }

    // Recupera i dettagli della categoria tramite API
    const category = await API.Database.Users.Categories.getUserCategoryById(
      userStore.userInfo?.uid,
      categoryId
    );

    if (category && category.icon) {
      selectedIcon.value = category.icon; // Assegna l'icona alla variabile ref
    } else {
      console.warn('Categoria non trovata o nessuna icona disponibile');
      selectedIcon.value = ''; // Resetta l'icona se non trovata
    }
  } catch (error) {
    console.error('Errore durante il recupero della categoria:', error);
  }
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

<style scoped>
/* Transizione slide-horizontal esistente */
.slide-horizontal-enter-active,
.slide-horizontal-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
  position: absolute; /* Permette la sovrapposizione */
  width: 100%; /* Assicura che gli elementi occupino lo stesso spazio */
}

.slide-horizontal-enter-from {
  transform: translateX(100%); /* L'elemento entra da destra */
  opacity: 0;
}

.slide-horizontal-enter-to {
  transform: translateX(0); /* L'elemento si posiziona al centro */
  opacity: 1;
}

.slide-horizontal-leave-from {
  transform: translateX(0); /* L'elemento parte dal centro */
  opacity: 1;
}

.slide-horizontal-leave-to {
  transform: translateX(-100%); /* L'elemento esce verso sinistra */
  opacity: 0;
}

/* Nuova transizione fade-delayed */
.fade-delayed-enter-active {
  transition: opacity 0.5s ease;
  transition-delay: 0.5s; /* Ritardo solo per l'ingresso */
}

.fade-delayed-leave-active {
  transition: opacity 0.1s ease; /* Nessun ritardo per l'uscita */
}

.fade-delayed-enter-from,
.fade-delayed-leave-to {
  opacity: 0; /* Elemento parte trasparente */
}

.fade-delayed-enter-to,
.fade-delayed-leave-from {
  opacity: 1; /* Elemento diventa visibile */
}
</style>
