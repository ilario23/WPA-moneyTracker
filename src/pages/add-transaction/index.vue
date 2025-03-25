<template>
  <van-tabs
    v-model:active="transactionType"
    animated
    swipeable
    :color="transactionType === 0 ? 'red' : 'green'"
    :title-active-color="transactionType === 0 ? '#ff000090' : '#00800090'"
    line-width="60"
  >
    <van-tab
      v-for="type in ['expense', 'income']"
      :key="type"
      :title="t(`transaction.${type}`)"
    >
      <div class="m-x-a w-7xl">
        <div class="mb-32 mt-20">
          <van-card
            :title="t('transaction.preview')"
            :desc="transactionData.description"
            :price="transactionData.amount"
            :thumb="dark ? logoDark : logo"
            currency="€"
            :class="type === 'expense' ? 'van-card-expense' : 'van-card-income'"
          >
            <template #tags>
              <van-tag :type="type === 'expense' ? 'warning' : 'success'">{{
                t(`transaction.${type}`)
              }}</van-tag>
            </template>
            <template #footer>
              <div>{{ dateLabel }}</div>
            </template>
          </van-card>
        </div>
      </div>
    </van-tab>
  </van-tabs>

  <div class="m-x-a w-7xl text-center">
    <van-form
      :model="transactionData"
      :rules="rules"
      validate-trigger="onSubmit"
      @submit="addTransaction"
    >
      <div class="overflow-hidden rounded-3xl">
        <van-field
          v-model="transactionData.amount"
          :rules="rules.amount"
          left-icon="shopping-cart-o"
          name="amount"
          type="number"
          :placeholder="t('transaction.amount')"
        />
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="fieldValue"
          is-link
          readonly
          label="Category"
          :placeholder="t('transaction.categoryId')"
          @click="showCascader = true"
        />
        <van-popup
          v-model:show="showCascader"
          round
          position="bottom"
          :style="{height: '40%'}"
        >
          <van-cascader
            v-model="cascaderValue"
            title="Select Category"
            :options="categoryOptions"
            @close="showCascader = false"
            @change="onChange"
            @finish="onFinish"
          />
        </van-popup>
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="dateLabel"
          right-icon="arrow-down"
          left-icon="calendar-o"
          readonly
          name="datePicker"
          placeholder="Select date"
          @click="showBottomCalendar = true"
        />
        <van-popup
          v-model:show="showBottomCalendar"
          round
          safe-area-inset-bottom
          destroy-on-close
          position="bottom"
          :style="{height: '40%'}"
        >
          <van-date-picker
            v-model="currentDate"
            type="datetime"
            title="Select Date"
            :min-date="minDate"
            :max-date="maxDate"
            @confirm="onConfirmCalendar"
            @cancel="showBottomCalendar = false"
          />
        </van-popup>
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="transactionData.description"
          :rules="rules.description"
          left-icon="edit"
          name="description"
          :placeholder="t('transaction.description')"
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
          {{ $t('transaction.add') }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onBeforeMount} from 'vue';
import {showNotify} from 'vant';
import {EMPTY_TRANSACTION} from '@/utils/transaction';
import type {Category} from '@/types/category';
import {useUserStore} from '@/stores/modules/user';
import {useI18n} from 'vue-i18n';

interface Option {
  text: string;
  value: string;
  children?: Option[];
}

// Ottieni lo store dell'utente
const userStore = useUserStore();

// Ottieni l'uid dell'utente come stringa
const userId: string = userStore.userInfo.uid;

console.log('User ID:', userId);

// Definisci una variabile per memorizzare i dati delle categorie
const categories = ref<Category[]>([]);
const categoryOptions = ref<Option[]>([]);
const showCascader = ref(false);
const fieldValue = ref('');
const cascaderValue = ref('');

// onBeforeMount, chiama getCategories per ottenere i dati delle categorie
onBeforeMount(async () => {
  // categories.value =
  //   await API.Database.Users.Categories.getUserCategories(userId);
  categories.value = [
    // ROOT Categories
    {id: 'a1b2c3d4', title: 'Entrate', userId: 'user123', active: true},
    {id: 'e5f6g7h8', title: 'Spese', userId: 'user123', active: true},
    {id: 'i9j0k1l2', title: 'Investimenti', userId: 'user123', active: true},

    // Subcategories di Entrate
    {
      id: 'm3n4o5p6',
      title: 'Stipendio',
      userId: 'user123',
      parentCategoryId: 'a1b2c3d4',
      active: true,
    },
    {
      id: 'q7r8s9t0',
      title: 'Freelance',
      userId: 'user123',
      parentCategoryId: 'a1b2c3d4',
      active: true,
    },
    {
      id: 'u1v2w3x4',
      title: 'Bonus e Premi',
      userId: 'user123',
      parentCategoryId: 'a1b2c3d4',
      active: true,
    },

    // Subcategories di Spese
    {
      id: 'y5z6a7b8',
      title: 'Casa',
      userId: 'user123',
      parentCategoryId: 'e5f6g7h8',
      active: true,
      budget: 1000,
    },
    {
      id: 'c9d0e1f2',
      title: 'Trasporti',
      userId: 'user123',
      parentCategoryId: 'e5f6g7h8',
      active: true,
      budget: 150,
    },
    {
      id: 'g3h4i5j6',
      title: 'Alimentari',
      userId: 'user123',
      parentCategoryId: 'e5f6g7h8',
      active: true,
      budget: 400,
    },

    // Sub-subcategories di Spese
    {
      id: 'k7l8m9n0',
      title: 'Affitto',
      userId: 'user123',
      parentCategoryId: 'y5z6a7b8',
      active: true,
      budget: 800,
    },
    {
      id: 'o1p2q3r4',
      title: 'Manutenzione',
      userId: 'user123',
      parentCategoryId: 'y5z6a7b8',
      active: true,
      budget: 200,
    },
    {
      id: 's5t6u7v8',
      title: 'Carburante',
      userId: 'user123',
      parentCategoryId: 'c9d0e1f2',
      active: true,
      budget: 100,
    },
  ];

  categoryOptions.value = buildCategoryOptions(categories.value);
});

const {t} = useI18n();
const logo = 'path/to/logo.png';
const logoDark = 'path/to/logo-dark.png';
const transactionType = ref(0);
const loading = ref(false);
const showBottomCalendar = ref<boolean>(false);
const currentDate = ref([
  new Date().getFullYear().toString(),
  (new Date().getMonth() + 1).toString().padStart(2, '0'),
  new Date().getDate().toString().padStart(2, '0'),
]);
// minDate: beginning of 4 years ago
// maxDate: end following year from now
const minDate = new Date(new Date().getFullYear() - 4, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 1, 11, 31);

const transactionData = reactive({...EMPTY_TRANSACTION});

const dateLabel = ref<string>(currentDate.value.join('/'));
const dark = ref<boolean>(isDark.value);

watch(
  () => isDark.value,
  (newMode) => {
    dark.value = newMode;
  }
);

const rules = reactive({
  amount: [{required: true, message: t('transaction.pleaseEnterAmount')}],
  categoryId: [
    {required: true, message: t('transaction.pleaseEnterCategoryId')},
  ],
  timestamp: [{required: true, message: t('transaction.pleaseEnterTimestamp')}],
  description: [
    {required: true, message: t('transaction.pleaseEnterDescription')},
  ],
});

async function addTransaction(values: any) {
  console.log('values', values);
  try {
    loading.value = true;
    // Simulate adding a transaction
    await new Promise((resolve) => setTimeout(resolve, 1000));
    showNotify({type: 'success', message: t('transaction.success')});
  } catch (error) {
    showNotify({type: 'danger', message: t('transaction.error')});
  } finally {
    resetFields();
    loading.value = false;
  }
}

const resetFields = () => {
  Object.assign(transactionData, EMPTY_TRANSACTION);
  dateLabel.value = [
    new Date().getFullYear().toString(),
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
    new Date().getDate().toString().padStart(2, '0'),
  ].join('/');
};

const onConfirmCalendar = ({selectedValues}) => {
  dateLabel.value = selectedValues.join('/');
  currentDate.value = selectedValues;
  showBottomCalendar.value = false;
  transactionData.timestamp = new Date(selectedValues.join('-')).toISOString();
};

const buildCategoryOptions = (categories: Category[]): Option[] => {
  const categoryMap = new Map<string, Option>();
  const categoryOptions: Option[] = []; // Inizializza la root categories

  // Creazione dei nodi di base
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      text: category.title,
      value: category.id,
      children: [], // Inizializziamo sempre children
    });
  });

  // Costruzione della gerarchia
  categories.forEach((category) => {
    const node = categoryMap.get(category.id);
    if (!node) return;

    if (!category.parentCategoryId) {
      categoryOptions.push(node);
    } else {
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // **Rimuove `children` se è vuoto**
  const cleanTree = (nodes: Option[]): Option[] => {
    return nodes.map((node) => {
      const cleanedNode = {...node}; // Copia l'oggetto
      if (cleanedNode.children.length > 0) {
        cleanedNode.children = cleanTree(cleanedNode.children); // Ricorsione sui figli
      } else {
        delete cleanedNode.children; // Rimuove `children` se è vuoto
      }
      return cleanedNode;
    });
  };

  return cleanTree(categoryOptions);
};

const onChange = ({selectedOptions}: {selectedOptions: Option[]}) => {
  // onChange e onFinish sono

  // Logica per gestire il cambiamento della selezione
  cascaderValue.value = selectedOptions[selectedOptions.length - 1].value;
  //questi altri due invece servono per l'inserimento della spesa, uno l'id e l'altro il nome
  // da mostrare nella pagina
  fieldValue.value = selectedOptions.map((option) => option.text).join('/');
  transactionData.categoryId =
    selectedOptions[selectedOptions.length - 1].value;
};

const onFinish = () => {
  //chiudo il cascader perchè sono arrivato alla fine
  showCascader.value = false;
};
</script>

<route lang="json5">
{
  name: 'transaction',
  meta: {
    title: 'Add Transaction',
    i18n: 'menus.transaction',
  },
}
</route>

<style scoped>
.van-card-expense {
  background-color: #ff000020;
  /* Light red background */
  border-radius: 20px;
}

.van-card-income {
  background-color: #00800020;
  /* Light green background */
  border-radius: 20px;
}
</style>
