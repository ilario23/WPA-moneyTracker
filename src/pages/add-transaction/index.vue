<template>
  <van-tabs
    v-model:active="transactionType"
    animated
    swipeable
    :color="vanTabColor"
    :title-active-color="vanTabTitleActiveColor"
    @change="swipingTabs($event)"
    line-width="60"
  >
    <van-tab
      v-for="category in rootCategories"
      :key="category.value"
      :title="category.text"
    >
      <div class="m-x-a w-7xl">
        <div class="mb-32 mt-20">
          <van-card
            :title="t('transaction.preview')"
            :desc="transactionData.description"
            :price="transactionData.amount"
            :thumb="dark ? logoDark : logo"
            currency="€"
            :style="{
              backgroundColor: `${parentlessCategories[transactionType]?.color}70`,
            }"
            class="van-card-style"
          >
            <template #tags>
              <van-tag
                :style="{
                  backgroundColor: `${parentlessCategories[transactionType]?.color}`,
                }"
                >{{ category.text }}</van-tag
              >
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
          v-model="fieldCategotyValue"
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
            :options="filteredCategoriesOptions"
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
import {ref, reactive, onBeforeMount, onMounted} from 'vue';
import {showNotify} from 'vant';
import {EMPTY_TRANSACTION} from '@/utils/transaction';
import {useUserStore} from '@/stores/modules/user';
import {useI18n} from 'vue-i18n';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';

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
const categoryOptions = ref<Option[]>([]);
const filteredCategoriesOptions = ref<Option[]>([]);
const rootCategories = ref();
const showCascader = ref(false);
const fieldCategotyValue = ref('');
const cascaderValue = ref('');
const parentlessCategories = ref([]);
const vanTabColor = ref('');
const vanTabTitleActiveColor = ref('');

// onBeforeMount, chiama getCategories per ottenere i dati delle categorie
onBeforeMount(async () => {
  // Ottieni tutte le categorie
  const allCategories = await UserCategories.getUserCategories(userId);
  parentlessCategories.value = allCategories.filter(
    (category) =>
      category.parentCategoryId === '' || category.parentCategoryId === null
  );
});

onMounted(async () => {
  // Assegna le categorie al cascader
  categoryOptions.value =
    await UserCategories.getCascaderCategoryOptions(userId);
  rootCategories.value = categoryOptions.value;
  swipingTabs(0); // Imposta il colore della tab attiva
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

async function addTransaction() {
  try {
    // Genera un ID unico per la transazione
    const transactionId = crypto.randomUUID();

    // Prepara i dati della transazione
    const transaction = {
      ...transactionData,
      id: transactionId, // Aggiungi l'ID generato
      timestamp: new Date(transactionData.timestamp).toISOString(),
      userId: userId, // Associa la transazione all'utente corrente
      categoryId: transactionData.categoryId,
    };

    console.log('Transaction Data:', transaction);

    // Effettua la chiamata per creare la transazione
    const createdTransaction = await UserTransactions.createUserTransaction(
      userId,
      transaction
    );

    if (createdTransaction) {
      showNotify({type: 'success', message: t('transaction.success')});
    } else {
      throw new Error(t('transaction.error'));
    }
  } catch (error) {
    console.error(error);
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

const onChange = ({selectedOptions}: {selectedOptions: Option[]}) => {
  // onChange e onFinish sono

  // Logica per gestire il cambiamento della selezione
  cascaderValue.value = selectedOptions[selectedOptions.length - 1].value;
  //questi altri due invece servono per l'inserimento della spesa, uno l'id e l'altro il nome
  // da mostrare nella pagina
  fieldCategotyValue.value = selectedOptions
    .map((option) => option.text)
    .join('/');

  transactionData.categoryId =
    selectedOptions[selectedOptions.length - 1].value;
};

const onFinish = () => {
  //chiudo il cascader perchè sono arrivato alla fine
  showCascader.value = false;
};

const swipingTabs = (index: number) => {
  // colori delle tab
  vanTabColor.value = parentlessCategories.value[index]?.color;
  vanTabTitleActiveColor.value = parentlessCategories.value[index]?.color;

  // imposta la categoria selezionata
  transactionData.categoryId = parentlessCategories.value[index]?.id;

  // correggo il cascader e quello che si vede nel campo di testo
  cascaderValue.value = parentlessCategories.value[index]?.title;
  fieldCategotyValue.value = parentlessCategories.value[index]?.title;

  // aggiorno le opzioni del cascader
  filteredCategoriesOptions.value = categoryOptions.value.filter(
    (category) => category.value === parentlessCategories.value[index]?.id
  );
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
.van-card-style {
  border-radius: 20px;
}
</style>
