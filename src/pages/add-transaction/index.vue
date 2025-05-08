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
            :price="transactionData.amount || 0"
            currency="€"
            :style="{
              backgroundColor: `${parentlessCategories[transactionType]?.color}70`,
            }"
            class="van-card-style"
          >
            <template #thumb>
              <div style="display: flex; align-items: center; height: 100%">
                <van-icon
                  :name="previewIcon"
                  style="font-size: 64px; color: inherit"
                />
              </div>
            </template>

            <template #tags>
              <van-tag
                :style="{
                  backgroundColor: `${parentlessCategories[transactionType]?.color}`,
                }"
              >
                {{ category.text }}
              </van-tag>
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
          v-model="amountInput"
          :rules="rules.amount"
          left-icon="shopping-cart-o"
          name="amount"
          type="text"
          inputmode="decimal"
          :placeholder="t('transaction.amount')"
          @blur="normalizeAmount"
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
          :style="{height: '60%'}"
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
          :placeholder="datePickerLabel"
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

      <!-- Recurring Expense Section -->
      <van-cell-group class="mt-16 overflow-hidden rounded-3xl">
        <van-field :label="t('transaction.recurringExpenseLabel')">
          <template #button>
            <van-switch v-model="isRecurring" size="20" />
          </template>
        </van-field>

        <div v-if="isRecurring" class="p-16">
          <van-radio-group v-model="frequency" direction="horizontal">
            <van-radio name="WEEKLY">{{ t('transaction.weekly') }}</van-radio>
            <van-radio name="MONTHLY">{{ t('transaction.monthly') }}</van-radio>
            <van-radio name="YEARLY">{{ t('transaction.yearly') }}</van-radio>
          </van-radio-group>
        </div>
      </van-cell-group>
      <!-- End Recurring Expense Section -->

      <div class="mt-16">
        <van-button
          :loading="loading"
          type="primary"
          native-type="submit"
          round
          block
        >
          {{ submitButtonText }}
          <!-- Use computed text -->
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
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {createSyncService} from '@/services/sync';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {useRoute, useRouter} from 'vue-router';
import type {FrequencyType} from '@/types/recurringExpense'; // Import FrequencyType
import {UserRecurringExpenses} from '@/api/database/modules/subcollections/user.recurringExpenses';
import {RecurringSyncService} from '@/services/recurringSync';

interface Option {
  text: string;
  value: string;
  children?: Option[];
  icon?: string;
}

// --- Recurring Expense State ---
const isRecurring = ref(false);
const frequency = ref<FrequencyType>('MONTHLY'); // Default frequency
// -----------------------------

// Ottieni lo store dell'utente
const router = useRouter();
const userStore = useUserStore();

// Ottieni l'uid dell'utente come stringa
const userId: string = userStore.userInfo.uid;

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

const route = useRoute();
const transactionId = route.query.id as string;

// onBeforeMount, chiama getCategories per ottenere i dati delle categorie
onBeforeMount(async () => {
  // Ottieni tutte le categorie
  const allCategories = await UserCategories.getUserCategories(userId);
  parentlessCategories.value = allCategories.filter(
    (category) =>
      category.parentCategoryId === '' || category.parentCategoryId === null
  );

  // Se c'è un ID nella query, carica i dati della transazione
  if (transactionId) {
    const year = new Date().getFullYear().toString();
    const yearTransactions = await UserTransactions.getUserTransactionsByYear(
      userId,
      year
    );
    const transaction = yearTransactions.find((t) => t.id === transactionId);

    if (transaction) {
      // Precompila i dati del form
      Object.assign(transactionData, transaction);

      // Imposta la data
      const date = new Date(transaction.timestamp);
      currentDate.value = [
        date.getFullYear().toString(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0'),
      ];
      dateLabel.value = currentDate.value.join('/');

      // Imposta la categoria
      const category = allCategories.find(
        (c) => c.id === transaction.categoryId
      );
      if (category) {
        fieldCategotyValue.value = category.title;
        cascaderValue.value = category.id;

        // Trova l'indice della categoria padre per impostare il tab corretto
        const parentIndex = parentlessCategories.value.findIndex(
          (c) => c.id === (category.parentCategoryId || category.id)
        );
        if (parentIndex !== -1) {
          transactionType.value = parentIndex;
          swipingTabs(parentIndex);
        }
      }
    }
  }
});

onMounted(async () => {
  // Assegna le categorie al cascader
  categoryOptions.value =
    await UserCategories.getCascaderCategoryOptions(userId);
  rootCategories.value = categoryOptions.value;
  swipingTabs(0); // Imposta il colore della tab attiva
});

const {t} = useI18n();
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

const previewIcon = ref<string>('');

const transactionData = reactive({...EMPTY_TRANSACTION});

const amountInput = ref(transactionData.amount?.toString() || '');

function normalizeAmount() {
  const normalized = amountInput.value.replace(',', '.');
  const parsed = parseFloat(normalized);

  const validAmount = isNaN(parsed) ? 0 : parsed;

  // Mostra fino a 2 decimali *solo se necessari*
  amountInput.value = Number.isInteger(validAmount)
    ? validAmount.toString()
    : validAmount.toFixed(2);

  transactionData.amount = parseFloat(amountInput.value) || 0;
}

const dateLabel = ref<string>(currentDate.value.join('/'));
const dark = ref<boolean>(isDark.value);

// --- Computed properties for conditional UI ---
const datePickerLabel = computed(() =>
  isRecurring.value ? t('transaction.startDate') : t('transaction.selectDate')
);
const submitButtonText = computed(() =>
  isRecurring.value ? t('transaction.saveDefinition') : t('transaction.add')
);
// ------------------------------------------

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

const sync = createSyncService(userId);

async function addTransaction() {
  if (isRecurring.value) {
    await saveDefinition();
  } else {
    await saveTransaction();
  }
}

async function saveTransaction() {
  try {
    loading.value = true;
    const transaction = {
      ...transactionData,
      id: transactionId || crypto.randomUUID(),
      timestamp: new Date(transactionData.timestamp).toISOString(),
      userId: userId,
      categoryId: transactionData.categoryId,
    };

    // Usa il servizio sync per gestire sia l'aggiunta che la modifica
    await sync.updateTransactionAndCache(transaction);

    showNotify({
      type: 'success',
      message: t(
        transactionId ? 'transaction.updateSuccess' : 'transaction.success'
      ),
    });

    // Reimposta il form e torna alla pagina precedente
    resetFields();
    router.back();
  } catch (error) {
    console.error('Error in saveTransaction:', error);
    showNotify({
      type: 'danger',
      message: t(
        transactionId ? 'transaction.updateError' : 'transaction.error'
      ),
    });
  } finally {
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
  // Reset recurring fields as well
  isRecurring.value = false;
  frequency.value = 'MONTHLY';
};

async function saveDefinition() {
  try {
    loading.value = true;

    // Basic validation (more robust validation might be needed)
    if (!transactionData.amount || !transactionData.categoryId) {
      showNotify({
        type: 'danger',
        message: t('transaction.pleaseEnterAmountAndCategory'), // Assuming you add this translation
      });
      return;
    }

    const startDate = new Date(currentDate.value.join('-')).toISOString();

    const recurringExpenseDefinition = {
      amount: transactionData.amount,
      categoryId: transactionData.categoryId,
      description: transactionData.description,
      frequency: frequency.value,
      startDate: startDate,
      nextOccurrence: startDate, // Initially the same as start date
      isActive: true,
    };

    await UserRecurringExpenses.addRecurringExpense(
      userId,
      recurringExpenseDefinition
    );

    // After adding, reload all recurring expenses to update the cache
    await RecurringSyncService.getRecurringExpenses(userId, true);

    showNotify({
      type: 'success',
      message: t('transaction.recurringExpenseAdded'), // Assuming you add this translation
    });

    resetFields();
    router.back();
  } catch (error) {
    console.error('Error in saveDefinition:', error);
    showNotify({
      type: 'danger',
      message: t('transaction.recurringExpenseError'), // Assuming you add this translation
    });
  } finally {
    loading.value = false;
  }
}

const onConfirmCalendar = ({selectedValues}) => {
  dateLabel.value = selectedValues.join('/');
  currentDate.value = selectedValues;
  showBottomCalendar.value = false;
  // Only set timestamp for non-recurring transactions.
  // For recurring, this date is the startDate, handled in addTransaction/saveDefinition
  if (!isRecurring.value) {
    transactionData.timestamp = new Date(
      selectedValues.join('-')
    ).toISOString();
  }
};

const onChange = ({selectedOptions}: {selectedOptions: Option[]}) => {
  // Logica per gestire il cambiamento della selezione
  cascaderValue.value = selectedOptions[selectedOptions.length - 1].value;
  //questi altri due invece servono per l'inserimento della spesa, uno l'id e l'altro il nome
  // da mostrare nella pagina
  fieldCategotyValue.value = selectedOptions
    .map((option) => option.text)
    .join('/');

  transactionData.categoryId =
    selectedOptions[selectedOptions.length - 1].value;
  previewIcon.value = selectedOptions[selectedOptions.length - 1].icon;
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

  // imposta l'icona della preview
  previewIcon.value = parentlessCategories.value[index]?.icon;

  // correggo il cascader e quello che si vede nel campo di testo
  cascaderValue.value = parentlessCategories.value[index]?.id || ''; // stringa
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
