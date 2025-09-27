<template>
  <div class="i-carbon:Wallet hidden" />
  <div class="i-carbon:calendar hidden" />
  <div class="i-carbon:tag hidden" />
  <div class="i-carbon:checkbox-checked hidden" />

  <!-- 💵 Finanze / Denaro / Entrate / Uscite -->
  <div class="i-carbon:finance hidden" />
  <div class="i-carbon:money hidden" />
  <div class="i-carbon:increase-level hidden" />
  <div class="i-carbon:receipt hidden" />
  <div class="i-carbon:wallet hidden" />

  <!-- 🏠 Casa / Costruzioni / Energia / Ambiente -->
  <div class="i-carbon:home hidden" />
  <div class="i-carbon:building hidden" />
  <div class="i-carbon:plug hidden" />
  <div class="i-carbon:lightning hidden" />
  <div class="i-carbon:humidity hidden" />

  <!-- 🎁 Regali / Preferiti / Sorrisi -->
  <div class="i-carbon:gift hidden" />
  <div class="i-carbon:favorite hidden" />

  <!-- 🧾 Documenti / Studio / Licenze -->
  <div class="i-carbon:certificate hidden" />
  <div class="i-carbon:notebook hidden" />
  <div class="i-carbon:license-draft hidden" />
  <div class="i-carbon:education hidden" />
  <div class="i-carbon:pen hidden" />

  <!-- 🏥 Salute / Farmaci / Cura personale -->
  <div class="i-carbon:hospital hidden" />
  <div class="i-carbon:medication hidden" />
  <div class="i-carbon:pills hidden" />
  <div class="i-carbon:stethoscope hidden" />
  <div class="i-carbon:cognitive hidden" />
  <div class="i-carbon:FingerprintRecognition hidden" />

  <!-- 🍔 Cibo / Bevande / Ristorazione -->
  <div class="i-carbon:restaurant hidden" />
  <div class="i-carbon:cafe hidden" />
  <div class="i-carbon:shopping-cart hidden" />
  <div class="i-carbon:ShoppingCart hidden" />
  <div class="i-carbon:ShoppingCartPlus hidden" />
  <div class="i-carbon:shopping-bag hidden" />
  <div class="i-carbon:fish hidden" />
  <div class="i-carbon:corn hidden" />
  <div class="i-carbon:NoodleBowl hidden" />
  <div class="i-carbon:bar hidden" />
  <div class="i-carbon:PiggyBank hidden" />

  <!-- 🚗 Trasporti / Veicoli / Mobilità -->
  <div class="i-carbon:car hidden" />
  <div class="i-carbon:car-front hidden" />
  <div class="i-carbon:scooter hidden" />
  <div class="i-carbon:bicycle hidden" />
  <div class="i-carbon:bus hidden" />
  <div class="i-carbon:train hidden" />
  <div class="i-carbon:van hidden" />
  <div class="i-carbon:charging-station hidden" />
  <div class="i-carbon:gas-station hidden" />
  <div class="i-carbon:road hidden" />
  <div class="i-carbon:plane hidden" />
  <div class="i-carbon:plane-private hidden" />
  <div class="i-carbon:tank hidden" />

  <!-- 🌍 Natura / Viaggi / Luoghi -->
  <div class="i-carbon:mountain hidden" />
  <div class="i-carbon:tree hidden" />
  <div class="i-carbon:map hidden" />
  <div class="i-carbon:location hidden" />
  <div class="i-carbon:palm-tree hidden" />
  <div class="i-carbon:hotel hidden" />
  <div class="i-carbon:monster hidden" />

  <!-- 🎮 Divertimento / Intrattenimento / Musica / Giochi -->
  <div class="i-carbon:music hidden" />
  <div class="i-carbon:game-console hidden" />
  <div class="i-carbon:apps hidden" />
  <div class="i-carbon:tool-kit hidden" />

  <!-- 🧠 Tecnologia / Informatica / Utente -->
  <div class="i-carbon:laptop hidden" />
  <div class="i-carbon:mobile hidden" />
  <div class="i-carbon:tablet hidden" />
  <div class="i-carbon:WatsonxData hidden" />
  <div class="i-carbon:user hidden" />
  <div class="i-carbon:settings hidden" />

  <!-- 🏆 Sport / Attività fisica -->
  <div class="i-carbon:basketball hidden" />
  <div class="i-carbon:soccer hidden" />
  <div class="i-carbon:tennis hidden" />
  <div class="i-carbon:swim hidden" />
  <div class="i-carbon:trophy hidden" />

  <!-- ⏰ Tempo / Allarmi / Sicurezza -->
  <div class="i-carbon:alarm hidden" />
  <div class="i-carbon:password hidden" />

  <!-- 📁 Altro / Varie -->
  <div class="i-carbon:folder hidden" />
  <div class="i-carbon:bee hidden" />
  <div class="i-carbon:rocket hidden" />
  <div class="i-carbon:Diagram hidden" />
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
                <van-icon style="font-size: 64px; color: inherit">
                  <div :class="previewIcon" />
                </van-icon>
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
      <div class="rounded-3xl calculator-wrapper" ref="amountWrapper">
        <div class="amount-field">
          <van-field
            v-model="amountInput"
            :rules="rules.amount"
            class="rounded-3xl"
            left-icon="shopping-cart-o"
            name="amount"
            type="text"
            inputmode="decimal"
            :placeholder="t('transaction.amount')"
            @blur="onAmountBlur"
            @focus="onAmountFocus"
            ref="amountField"
            @input="onAmountInput"
            :label-align="showCalculator && calcTrace ? 'top' : 'left'"
          >
            <template #label v-if="showCalculator && calcTrace">
              <div class="calc-trace">{{ calcTrace }}</div>
            </template>
          </van-field>
        </div>
        <div
          class="calculator-spacer"
          :style="{height: showCalculator ? '64px' : '0'}"
        >
          <transition name="fade">
            <div
              v-if="showCalculator"
              class="calculator-box"
              @mousedown.prevent
            >
              <div class="calculator-keys">
                <van-button
                  size="large"
                  style="flex: 1; font-size: 20px; height: 48px"
                  @click="onCalcOp('+')"
                  >+</van-button
                >
                <van-button
                  size="large"
                  style="flex: 1; font-size: 20px; height: 48px"
                  @click="onCalcOp('-')"
                  >-</van-button
                >
                <van-button
                  size="large"
                  style="flex: 1; font-size: 20px; height: 48px"
                  @click="onCalcOp('*')"
                  >*</van-button
                >
                <van-button
                  size="large"
                  style="flex: 1; font-size: 20px; height: 48px"
                  @click="onCalcOp('/')"
                  >/</van-button
                >
                <van-button
                  size="large"
                  style="flex: 1; font-size: 20px; height: 48px"
                  type="primary"
                  @click="onCalcEqual"
                  >=</van-button
                >
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="mt-16 overflow-hidden rounded-3xl">
        <van-field
          v-model="fieldCategoryValue"
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
          :style="{height: '70%'}"
          safe-area-inset-bottom
        >
          <van-cascader
            v-model="cascaderValue"
            title="Select Category"
            :options="filteredCategoriesOptions"
            @close="showCascader = false"
            @change="onChange"
            @finish="onFinish"
            class="h-full"
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
            <van-switch
              v-model="isRecurring"
              size="20"
              :disabled="isEditModeRecurring"
            />
          </template>
        </van-field>

        <div v-if="isRecurring" class="p-16">
          <van-field :label="t('transaction.activeLabel')">
            <template #button>
              <van-switch
                v-model="isActiveRecurring"
                size="20"
                disabled
                class="mb-16"
              />
            </template>
          </van-field>
          <van-radio-group
            v-model="frequency"
            direction="horizontal"
            class="mb-16"
          >
            <van-radio name="WEEKLY">{{ t('transaction.weekly') }}</van-radio>
            <van-radio name="MONTHLY">{{ t('transaction.monthly') }}</van-radio>
            <van-radio name="YEARLY">{{ t('transaction.yearly') }}</van-radio>
          </van-radio-group>

          <van-cell
            v-if="calculatedNextOccurrenceDisplay"
            :title="t('transaction.NextOccurrenceLabel')"
            :label="calculatedNextOccurrenceDisplay"
            :style="{
              padding: '8px',
              maxWidth: '100%',
              boxSizing: 'border-box',
              '--van-cell-title-line-height': 'normal',
              '--van-cell-text-line-height': '1.4',
              '--van-cell-title-margin-bottom': '8px',
              '--van-cell-label-margin-top': '0',
            }"
          />
        </div>
      </van-cell-group>
      <!-- End Recurring Expense Section -->

      <div
        class="mt-16 action-buttons-container"
        style="display: flex; gap: 16px; justify-content: center"
      >
        <van-button
          v-if="transactionId || recurringExpenseIdToEdit"
          type="default"
          round
          style="width: 120px"
          @click="router.back()"
        >
          {{ t('common.cancelButton') }}
        </van-button>
        <van-button
          :loading="loading"
          type="primary"
          native-type="submit"
          round
          :style="{
            width: transactionId || recurringExpenseIdToEdit ? '120px' : '100%',
          }"
        >
          {{ submitButtonText }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onBeforeMount,
  onMounted,
  computed,
  watch,
  nextTick,
  onBeforeUnmount,
} from 'vue'; // Added computed and watch
import {showNotify} from 'vant';
import {EMPTY_TRANSACTION} from '@/utils/transaction';
import {useUserStore} from '@/stores/modules/user';
import {useI18n} from 'vue-i18n';
import {UserCategories} from '@/api/database/modules/subcollections/user.categories';
import {createSyncService} from '@/services/sync';
import {UserTransactions} from '@/api/database/modules/subcollections/user.transactions';
import {useRoute, useRouter} from 'vue-router';
import type {
  FrequencyType,
  RecurringExpenseDefinition,
} from '@/types/recurringExpense'; // Import FrequencyType and RecurringExpenseDefinition
import {UserRecurringExpenses} from '@/api/database/modules/subcollections/user.recurringExpenses';
import {RecurringSyncService} from '@/services/recurringSync';
import type {FieldRule} from 'vant';

interface Option {
  text: string;
  value: string;
  children?: Option[];
  icon?: string;
}

// --- Recurring Expense State ---
const isRecurring = ref(false);
const frequency = ref<FrequencyType>('MONTHLY'); // Default frequency
const isEditModeRecurring = ref(false); // New ref for recurring edit mode
const recurringExpenseIdToEdit = ref<string | null>(null); // Store ID if editing recurring
const isActiveRecurring = ref(true); // For the new 'isActive' switch, defaults to true
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
const fieldCategoryValue = ref('');
const cascaderValue = ref('');
const parentlessCategories = ref([]);
const vanTabColor = ref('');
const vanTabTitleActiveColor = ref('');

const route = useRoute();
const transactionId = route.query.id as string; // For editing regular transactions
recurringExpenseIdToEdit.value = route.query.recurringExpenseId as
  | string
  | null; // For editing recurring expenses

// onBeforeMount, chiama getCategories per ottenere i dati delle categorie
onBeforeMount(async () => {
  // Ottieni tutte le categorie
  const allCategories = await UserCategories.getUserCategories(userId);
  parentlessCategories.value = allCategories.filter(
    (category) =>
      category.parentCategoryId === '' || category.parentCategoryId === null
  );

  if (recurringExpenseIdToEdit.value) {
    isEditModeRecurring.value = true;
    isRecurring.value = true; // It's a recurring expense by definition
    const expenseToEdit = await UserRecurringExpenses.getRecurringExpenseById(
      userId,
      recurringExpenseIdToEdit.value
    );
    if (expenseToEdit) {
      transactionData.amount = expenseToEdit.amount;
      amountInput.value = expenseToEdit.amount.toString();
      transactionData.categoryId = expenseToEdit.categoryId;
      transactionData.description = expenseToEdit.description || '';
      frequency.value = expenseToEdit.frequency;
      isActiveRecurring.value = expenseToEdit.isActive; // Load isActive status

      // Use nextOccurrence for the calendar when editing a recurring expense
      const nextOccurrenceDate = new Date(expenseToEdit.nextOccurrence);
      currentDate.value = [
        nextOccurrenceDate.getFullYear().toString(),
        (nextOccurrenceDate.getMonth() + 1).toString().padStart(2, '0'),
        nextOccurrenceDate.getDate().toString().padStart(2, '0'),
      ];
      dateLabel.value = currentDate.value.join('/');

      const category = allCategories.find(
        (c) => c.id === expenseToEdit.categoryId
      );
      if (category) {
        fieldCategoryValue.value = category.title;
        cascaderValue.value = category.id;
        const parentIndex = parentlessCategories.value.findIndex(
          (c) => c.id === (category.parentCategoryId || category.id)
        );
        if (parentIndex !== -1) {
          transactionType.value = parentIndex;
          // swipingTabs will be called in onMounted or after this block if needed
        }
      }
    } else {
      showNotify({type: 'danger', message: t('recurringExpense.fetchError')}); // Using existing i18n key
      router.back();
    }
  } else if (transactionId) {
    // Existing logic for editing regular transactions
    const year = new Date().getFullYear().toString();
    const yearTransactions = await UserTransactions.getUserTransactionsByYear(
      userId,
      year
    );
    const transaction = yearTransactions.find((t) => t.id === transactionId);

    if (transaction) {
      Object.assign(transactionData, transaction);
      amountInput.value = transaction.amount?.toString() || '';

      const date = new Date(transaction.timestamp);
      currentDate.value = [
        date.getFullYear().toString(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0'),
      ];
      dateLabel.value = currentDate.value.join('/');

      const category = allCategories.find(
        (c) => c.id === transaction.categoryId
      );
      if (category) {
        fieldCategoryValue.value = category.title;
        cascaderValue.value = category.id;
        const parentIndex = parentlessCategories.value.findIndex(
          (c) => c.id === (category.parentCategoryId || category.id)
        );
        if (parentIndex !== -1) {
          transactionType.value = parentIndex;
        }
      }
    }
  }
  // If transactionType was potentially updated, ensure tabs reflect this.
  // onMounted already calls swipingTabs(0) or the relevant index.
  // If editing, we might need to call swipingTabs(transactionType.value) here
  // or ensure onMounted handles the updated transactionType.value correctly.
  // For now, let's assume onMounted's swipingTabs(0) or subsequent user interaction handles tab visuals.
});

onMounted(async () => {
  // Assegna le categorie al cascader, filtrando solo quelle attive
  categoryOptions.value = await UserCategories.getCascaderCategoryOptions(
    userId,
    true
  );
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
  // When creating a recurring expense, the date picker sets the start date.
  // When editing a recurring expense, the date picker sets the next occurrence.
  // For regular transactions, it's just 'selectDate'.
  isEditModeRecurring.value
    ? t('transaction.nextOccurrenceDateLabel') // New i18n key
    : isRecurring.value
    ? t('transaction.startDate')
    : t('transaction.selectDate')
);

const pastOccurrencesCount = computed(() => {
  if (!isRecurring.value || isEditModeRecurring.value) return 0;

  const selectedDate = new Date(currentDate.value.join('-'));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate >= today) return 0;

  let count = 0;
  let tempDate = new Date(selectedDate);
  while (tempDate < today) {
    count++;
    tempDate = calculateNextOccurrence(tempDate, frequency.value);
  }
  return count;
});

const calculatedNextOccurrenceDisplay = ref('');

function calculateNextOccurrence(startDate: Date, freq: FrequencyType): Date {
  const nextDate = new Date(startDate);
  switch (freq) {
    case 'WEEKLY':
      nextDate.setDate(startDate.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(startDate.getMonth() + 1);
      break;
    case 'YEARLY':
      nextDate.setFullYear(startDate.getFullYear() + 1);
      break;
  }
  return nextDate;
}

function updateCalculatedNextOccurrenceDisplay() {
  if (isRecurring.value && !isEditModeRecurring.value) {
    // CREAZIONE NUOVA SPESA RICORRENTE
    const selectedStartDate = new Date(currentDate.value.join('-'));
    if (Number.isNaN(selectedStartDate.getTime())) {
      calculatedNextOccurrenceDisplay.value = t(
        'transaction.selectValidDatePrompt'
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Normalizza anche selectedStartDate per un confronto corretto solo sulla data
    const normalizedSelectedStartDate = new Date(selectedStartDate);
    normalizedSelectedStartDate.setHours(0, 0, 0, 0);

    let effectiveNextOccurrence = new Date(normalizedSelectedStartDate);

    if (effectiveNextOccurrence < today) {
      // Data di inizio nel passato, calcola la prima occorrenza valida da oggi
      while (effectiveNextOccurrence < today) {
        effectiveNextOccurrence = calculateNextOccurrence(
          effectiveNextOccurrence,
          frequency.value
        );
      }
      const pastCount = pastOccurrencesCount.value;
      calculatedNextOccurrenceDisplay.value = `${t(
        'transaction.pastOccurrencesWarning',
        {count: pastCount}
      )}.\n${t(
        'transaction.nextScheduledOccurrenceLabel'
      )}: ${effectiveNextOccurrence.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
    } else {
      // Data di inizio è oggi o nel futuro: questa è la prima occorrenza
      calculatedNextOccurrenceDisplay.value = `${t(
        'transaction.firstOccurrenceOnLabel'
      )}: ${effectiveNextOccurrence.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
      // Mostra opzionalmente quella successiva
      const subsequentOccurrence = calculateNextOccurrence(
        effectiveNextOccurrence,
        frequency.value
      );
      calculatedNextOccurrenceDisplay.value += ` (${t(
        'transaction.thenLabel'
      )}: ${subsequentOccurrence.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })})`;
    }
  } else if (isEditModeRecurring.value) {
    // MODIFICA SPESA RICORRENTE ESISTENTE
    const selectedNextOccurrence = new Date(currentDate.value.join('-'));
    if (!Number.isNaN(selectedNextOccurrence.getTime())) {
      const futureNextDate = calculateNextOccurrence(
        selectedNextOccurrence,
        frequency.value
      );
      // Qui il testo si riferisce alla prossima occorrenza *dopo quella selezionata per la modifica*
      calculatedNextOccurrenceDisplay.value = `(${t(
        'transaction.nextAfterThisLabel'
      )}: ${futureNextDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })})`;
    } else {
      calculatedNextOccurrenceDisplay.value = '';
    }
  } else {
    calculatedNextOccurrenceDisplay.value = '';
  }
}

watch(
  [currentDate, frequency, isRecurring, isEditModeRecurring],
  updateCalculatedNextOccurrenceDisplay,
  {immediate: true}
);

const submitButtonText = computed(() => {
  if (isEditModeRecurring.value) {
    return t('transaction.updateRecurringExpenseButton'); // Corrected/New i18n key
  }
  if (transactionId) {
    // Editing a regular transaction
    return t('transaction.updateTransactionButton'); // New i18n key
  }
  if (isRecurring.value) {
    // Creating a new recurring definition
    return t('transaction.saveRecurringExpense');
  }
  return t('transaction.add'); // Creating a new regular transaction
});
// ------------------------------------------

watch(
  () => isDark.value,
  (newMode) => {
    dark.value = newMode;
  }
);

const rules = reactive<{[key: string]: FieldRule[]}>({
  amount: [
    {required: true, message: t('transaction.pleaseEnterAmount')},
    {
      validator: (value: any) => {
        const amount = parseFloat(value);
        return amount >= 0;
      },
      message: t('transaction.amountCannotBeNegative'),
    },
  ],
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
  if (isEditModeRecurring.value && recurringExpenseIdToEdit.value) {
    await updateRecurringDefinition();
  } else if (isRecurring.value) {
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
  amountInput.value = ''; // Reset amount input field
  const today = new Date();
  currentDate.value = [
    // Reset calendar to today
    today.getFullYear().toString(),
    (today.getMonth() + 1).toString().padStart(2, '0'),
    today.getDate().toString().padStart(2, '0'),
  ];
  dateLabel.value = currentDate.value.join('/'); // Reset date label

  // Reset recurring fields as well
  isRecurring.value = false;
  frequency.value = 'MONTHLY';
  isActiveRecurring.value = true; // Reset active state to default true
  isEditModeRecurring.value = false;
  recurringExpenseIdToEdit.value = null;

  // Reset category fields to the current active tab's root category
  if (
    parentlessCategories.value.length > 0 &&
    transactionType.value < parentlessCategories.value.length
  ) {
    swipingTabs(transactionType.value);
  } else if (parentlessCategories.value.length > 0) {
    swipingTabs(0); // Default to the first tab if current index is somehow out of bounds
  } else {
    // Handle case where categories might not be loaded yet, though unlikely here
    fieldCategoryValue.value = '';
    cascaderValue.value = '';
    previewIcon.value = ''; // Or a default icon
  }
};

async function saveDefinition() {
  // This function is now only for CREATING new recurring definitions
  try {
    loading.value = true;

    // Basic validation
    if (!transactionData.amount || !transactionData.categoryId) {
      showNotify({
        type: 'danger',
        message: t('transaction.pleaseEnterAmountAndCategory'), // Assuming you add this translation
      });
      return;
    }

    const initialStartDate = new Date(currentDate.value.join('-')); // Data selezionata dall'utente
    let calculatedNextOccurrenceDate = new Date(initialStartDate); // Copia per calcolare la prossima occorrenza
    calculatedNextOccurrenceDate.setHours(0, 0, 0, 0); // Normalizza per confronto solo date

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizza oggi

    let createPastTransactionRecord = false; // Flag

    if (calculatedNextOccurrenceDate < today) {
      // La data di inizio scelta dall'utente è nel passato
      createPastTransactionRecord = true;
      // Calcola la prima occorrenza valida da oggi in poi per la definizione
      while (calculatedNextOccurrenceDate < today) {
        calculatedNextOccurrenceDate = calculateNextOccurrence(
          calculatedNextOccurrenceDate,
          frequency.value
        );
      }
    }
    // Ora 'calculatedNextOccurrenceDate' è la data corretta per la 'nextOccurrence' della definizione

    const recurringExpenseDefinition = {
      amount: transactionData.amount,
      categoryId: transactionData.categoryId,
      description: transactionData.description,
      frequency: frequency.value,
      startDate: initialStartDate.toISOString(), // Salva la data di inizio scelta dall'utente
      nextOccurrence: calculatedNextOccurrenceDate.toISOString(), // Salva la prossima occorrenza calcolata
      isActive: isActiveRecurring.value,
    };

    // Salva la DEFINIZIONE della spesa ricorrente
    await UserRecurringExpenses.addRecurringExpense(
      userId,
      recurringExpenseDefinition
    );

    // Se la data di inizio originale era nel passato, crea una TRANSAZIONE per quella data
    if (createPastTransactionRecord) {
      const pastTransaction = {
        id: crypto.randomUUID(), // ID univoco per questa transazione singola
        amount: transactionData.amount,
        categoryId: transactionData.categoryId,
        description: transactionData.description, // Potrebbe essere utile aggiungere un riferimento alla spesa ricorrente
        timestamp: initialStartDate.toISOString(), // Timestamp della transazione = data di inizio scelta
        userId: userId,
        // recurringDefinitionId: newDefinition.id, // Opzionale: se vuoi collegare questa transazione alla definizione
      };
      await sync.updateTransactionAndCache(pastTransaction); // Usa il servizio esistente per salvare la transazione
      showNotify({
        type: 'primary', // Changed from 'info' to 'primary'
        message: t('transaction.pastInstanceCreated', {
          date: initialStartDate.toLocaleDateString(),
        }),
      });
    }

    // After adding, reload all recurring expenses to update the cache
    await RecurringSyncService.getRecurringExpenses(userId, true);

    showNotify({
      type: 'success',
      message: t('transaction.recurringExpenseAdded'),
    });

    resetFields();
    router.back();
  } catch (error) {
    console.error('Error in saveDefinition:', error);
    showNotify({
      type: 'danger',
      message: t('transaction.recurringExpenseError'),
    });
  } finally {
    loading.value = false;
  }
}

async function updateRecurringDefinition() {
  if (!recurringExpenseIdToEdit.value) return;

  try {
    loading.value = true;

    if (!transactionData.amount || !transactionData.categoryId) {
      showNotify({
        type: 'danger',
        message: t('transaction.pleaseEnterAmountAndCategory'),
      });
      return;
    }

    const newNextOccurrence = new Date(
      currentDate.value.join('-')
    ).toISOString();

    const updatedExpenseData: Partial<RecurringExpenseDefinition> = {
      amount: transactionData.amount,
      categoryId: transactionData.categoryId,
      description: transactionData.description,
      frequency: frequency.value,
      nextOccurrence: newNextOccurrence,
      isActive: isActiveRecurring.value, // Save the state of the new switch
      // startDate is not updated here, it's kept from the original definition.
    };

    // If you also want to allow editing startDate, you'd need another field or different logic.
    // For now, editing the date field modifies nextOccurrence.

    await UserRecurringExpenses.updateRecurringExpense(
      userId,
      recurringExpenseIdToEdit.value,
      updatedExpenseData
    );

    // After updating, reload all recurring expenses to update the cache
    await RecurringSyncService.getRecurringExpenses(userId, true);

    showNotify({
      type: 'success',
      message: t('transaction.recurringExpenseUpdated'), // New i18n key
    });

    resetFields();
    router.back();
  } catch (error) {
    console.error('Error in updateRecurringDefinition:', error);
    showNotify({
      type: 'danger',
      message: t('transaction.recurringExpenseUpdateError'), // New i18n key
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
  fieldCategoryValue.value = selectedOptions
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
  fieldCategoryValue.value = parentlessCategories.value[index]?.title;

  // aggiorno le opzioni del cascader
  filteredCategoriesOptions.value = categoryOptions.value.filter(
    (category) => category.value === parentlessCategories.value[index]?.id
  );
};

// Calculator state
const showCalculator = ref(false);
const calcFirstValue = ref<number | null>(null);
const calcOperator = ref<string | null>(null);
const calcTrace = ref<string>('');
const amountField = ref<any>(null);
const amountWrapper = ref<HTMLElement | null>(null);

function onAmountFocus() {
  showCalculator.value = true;
}
function onAmountBlur() {
  setTimeout(() => {
    if (!isCalculatorButtonPressed.value) {
      showCalculator.value = false;
      calcTrace.value = '';
      calcFirstValue.value = null;
      calcOperator.value = null;
      // Normalizza l'amount quando chiudiamo la calcolatrice senza usarla
      normalizeAmount();
    }
    isCalculatorButtonPressed.value = false;
  }, 100);
}

const isCalculatorButtonPressed = ref(false);

function onCalcOp(op: string) {
  isCalculatorButtonPressed.value = true;

  // Se abbiamo già un'operazione in corso, aggiorniamo solo l'operatore
  if (calcFirstValue.value !== null && calcOperator.value) {
    calcOperator.value = op;
    updateCalcTrace();
    nextTick(() => {
      amountField.value?.focus?.();
    });
    return;
  }

  // Altrimenti, iniziamo una nuova operazione
  const val = parseFloat(amountInput.value.replace(',', '.'));
  if (!isNaN(val)) {
    calcFirstValue.value = val;
    calcOperator.value = op;
    amountInput.value = '';
    updateCalcTrace();
  }
  nextTick(() => {
    amountField.value?.focus?.();
  });
}

function onAmountInput() {
  // Se non stiamo usando la calcolatrice, normalizza l'input direttamente
  if (!calcOperator.value) {
    normalizeAmount();
  }
  // Altrimenti aggiorna solo il calcTrace per mostrare il calcolo in corso
  else {
    updateCalcTrace();
  }
}

function updateCalcTrace() {
  if (calcFirstValue.value !== null && calcOperator.value) {
    const second = parseFloat(amountInput.value.replace(',', '.')) || 0;
    let result = 0;
    switch (calcOperator.value) {
      case '+':
        result = calcFirstValue.value + second;
        break;
      case '-':
        result = calcFirstValue.value - second;
        break;
      case '*':
        result = calcFirstValue.value * second;
        break;
      case '/':
        result = second !== 0 ? calcFirstValue.value / second : 0;
        break;
    }
    calcTrace.value =
      calcFirstValue.value +
      ' ' +
      calcOperator.value +
      ' ' +
      (amountInput.value || '0') +
      ' = ' +
      (Number.isInteger(result) ? result : result.toFixed(2));
  } else {
    calcTrace.value = '';
  }
}

function onCalcEqual() {
  isCalculatorButtonPressed.value = true;
  const first = calcFirstValue.value;
  const op = calcOperator.value;
  const second = parseFloat(amountInput.value.replace(',', '.'));
  if (first !== null && op && !isNaN(second)) {
    let result = 0;
    switch (op) {
      case '+':
        result = first + second;
        break;
      case '-':
        result = first - second;
        break;
      case '*':
        result = first * second;
        break;
      case '/':
        result = second !== 0 ? first / second : 0;
        break;
    }
    amountInput.value = Number.isInteger(result)
      ? result.toString()
      : result.toFixed(2);
    transactionData.amount = parseFloat(amountInput.value) || 0;
    calcFirstValue.value = null;
    calcOperator.value = null;
    calcTrace.value = '';
    showCalculator.value = false;
  }
  nextTick(() => {
    amountField.value?.focus?.();
  });
}

// Chiudi la calcolatrice cliccando fuori
onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('mousedown', handleClickOutsideCalc);
  }
});
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('mousedown', handleClickOutsideCalc);
  }
});
function handleClickOutsideCalc(e: MouseEvent) {
  // Usa il wrapper che contiene sia calcolatrice che campo
  const wrapper = amountWrapper.value;
  if (showCalculator.value && wrapper && !wrapper.contains(e.target as Node)) {
    showCalculator.value = false;
  }
}
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
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: opacity 0.2s, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
.calculator-wrapper {
  position: relative;
}

.calculator-spacer {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.calculator-box {
  position: absolute;
  left: 0;
  right: 0;
  top: 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.calc-trace {
  font-size: 14px;
  color: var(--van-text-color-2);
  text-align: right;
  font-family: monospace;
  padding: 4px 0;
}

.calculator-keys {
  background-color: var(--van-background-2);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
}

.calculator-keys .van-button {
  flex: 1;
  height: 48px;
}
</style>
