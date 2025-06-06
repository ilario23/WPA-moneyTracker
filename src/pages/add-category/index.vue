<template>
  <van-cell-group inset :title="t('category.addNewCategory')">
    <div class="m-x-a w-7xl text-center">
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
            v-model="fieldValueParent"
            is-link
            readonly
            :label="t('category.parentCategory')"
            :placeholder="t('category.parentCategory')"
            @click="showCascader = true"
          >
            <template #right-icon v-if="fieldValueParent">
              <van-icon
                name="clear"
                @click.stop="clearParentCategory"
                class="text-gray-500"
              />
            </template>
          </van-field>
          <van-popup
            v-model:show="showCascader"
            round
            position="bottom"
            :style="{height: '60%'}"
          >
            <van-cascader
              v-model="cascaderValue"
              :title="t('category.selectParentCategory')"
              :options="categoryOptions"
              @close="showCascader = false"
              @change="onChange"
              @finish="onFinish"
            />
          </van-popup>
        </div>

        <div class="mt-2">
          <van-field
            v-model="newCategory.color"
            name="color"
            :label="t('category.color')"
            :placeholder="t('category.color')"
            type="color"
            :style="{
              '--van-field-label-color':
                newCategory.color === '' ? '#B0B0B0' : 'inherit',
            }"
          >
            <template #input>
              <input type="color" v-model="newCategory.color" />
            </template>
          </van-field>
        </div>

        <div class="mt-16 overflow-hidden rounded-3xl">
          <van-field
            name="icon"
            v-model="newCategory.icon"
            :rules="rules.icon"
            :label="t('category.icon')"
            readonly
            @click="showIconPopup = true"
            class="van-haptics-feedback"
          >
            <template #input>
              <div
                v-if="newCategory.icon"
                :class="newCategory.icon"
                style="font-size: 32px"
              />
              <span v-else style="color: #b0b0b0">{{
                t('category.selectIcon')
              }}</span>
            </template>
          </van-field>
        </div>

        <van-popup
          v-model:show="showIconPopup"
          position="center"
          round
          style="width: 80%; height: 60%; padding: 16px; text-align: center"
        >
          <div style="display: flex; flex-direction: column; height: 100%">
            <h3 style="margin-bottom: 16px">{{ t('category.selectIcon') }}</h3>
            <div style="flex: 1; overflow-y: auto">
              <van-grid :column-num="4">
                <van-grid-item
                  v-for="icon in availableIcons"
                  :key="icon"
                  @click="selectIcon(icon)"
                >
                  <div :class="icon" style="font-size: 32px" />
                </van-grid-item>
              </van-grid>
            </div>
          </div>
        </van-popup>

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
  </van-cell-group>
</template>

<script setup lang="ts">
import {ref, reactive, onBeforeMount} from 'vue';
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
const fieldValueParent = ref('');

const newCategory = reactive<Category>({...EMPTY_CATEGORY});

// Stato per il cascader
const categoryOptions = ref([]);
const showCascader = ref(false);
const cascaderValue = ref('');

// Stato per il popup delle icone
const showIconPopup = ref(false);

// Regole di validazione
const rules = reactive({
  title: [{required: true, message: t('category.pleaseEnterTitle')}],
  color: [{required: false, message: t('category.pleaseEnterColor')}],
  icon: [{required: true, message: t('category.pleaseEnterIcon')}],
  excludeFromStat: [
    {required: true, message: t('category.pleaseEnterExcludeFromStat')},
  ],
  active: [{required: true, message: t('category.pleaseEnterActive')}],
});

// Carica le categorie per il cascader
onBeforeMount(async () => {
  newCategory.id = crypto.randomUUID();

  // Ottieni le categorie per il cascader
  categoryOptions.value =
    await API.Database.Users.Categories.getCascaderCategoryOptions(
      userStore.userInfo?.uid
    );

  if (route.query.id) {
    const temp = await API.Database.Users.Categories.getUserCategoryById(
      userStore.userInfo?.uid,
      route.query.id as string
    );

    if (temp) {
      Object.assign(newCategory, temp);
    }
  }
});

// Gestione del cascader
const onChange = ({selectedOptions}: {selectedOptions: any[]}) => {
  cascaderValue.value = selectedOptions[selectedOptions.length - 1].value;
  fieldValueParent.value = selectedOptions
    .map((option) => option.text)
    .join('/');
  newCategory.parentCategoryId =
    selectedOptions[selectedOptions.length - 1].value;
};
const onFinish = () => {
  showCascader.value = false;
};
// Clear the parent category
const clearParentCategory = () => {
  cascaderValue.value = '';
  newCategory.parentCategoryId = null;
  fieldValueParent.value = '';
};

// Salvataggio della categoria
const save = async () => {
  try {
    loading.value = true;

    // Add check before saving
    if (!(await checkForActiveChildren())) {
      showNotify({
        type: 'warning',
        message: t('category.cantSaveInactiveParent'),
      });
      return;
    }

    if (userStore.userInfo?.uid) {
      if (route.query.id) {
        // Modifica categoria esistente
        await API.Database.Users.Categories.updateUserCategory(
          userStore.userInfo.uid,
          newCategory
        );
        showNotify({type: 'success', message: t('category.updateSuccess')});
      } else {
        // Crea nuova categoria
        await API.Database.Users.Categories.createUserCategory(
          userStore.userInfo.uid,
          newCategory
        );
        showNotify({type: 'success', message: t('category.addSuccess')});
      }

      // Check if we came from categories page
      if (
        typeof router.options.history.state.back === 'string' &&
        router.options.history.state.back.includes('categories')
      ) {
        router.back();
      } else {
        router.replace({name: 'categories'});
      }
    }
  } catch (error) {
    console.error('Error saving category:', error);
    showNotify({type: 'danger', message: t('category.saveError')});
  } finally {
    loading.value = false;
  }
};

// Select an icon
const selectIcon = (icon: string) => {
  newCategory.icon = icon; // Aggiorna l'icona selezionata
  showIconPopup.value = false; // Chiudi il popup
};

// Add this function after other const declarations
const checkForActiveChildren = async () => {
  if (!newCategory.active && userStore.userInfo?.uid && newCategory.id) {
    const allCategories = await API.Database.Users.Categories.getUserCategories(
      userStore.userInfo.uid
    );

    const activeChildren = allCategories.filter(
      (category) =>
        category.active && category.parentCategoryId === newCategory.id
    );

    return activeChildren.length === 0;
  }
  return true;
};

const availableIcons = [
  // 📆 Calendario / Tag / Checklist
  'i-carbon:calendar',
  'i-carbon:tag',
  'i-carbon:checkbox-checked',

  // 💵 Finanze / Denaro / Entrate / Uscite
  'i-carbon:finance',
  'i-carbon:money',
  'i-carbon:increase-level',
  'i-carbon:receipt',
  'i-carbon:wallet',

  // 🏠 Casa / Costruzioni / Energia / Ambiente
  'i-carbon:home',
  'i-carbon:building',
  'i-carbon:plug',
  'i-carbon:lightning',
  'i-carbon:humidity',

  // 🎁 Regali / Preferiti / Sorrisi
  'i-carbon:gift',
  'i-carbon:favorite',

  // 🧾 Documenti / Studio / Licenze
  'i-carbon:certificate',
  'i-carbon:notebook',
  'i-carbon:license-draft',
  'i-carbon:education',
  'i-carbon:pen',

  // 🏥 Salute / Farmaci / Cura personale
  'i-carbon:hospital',
  'i-carbon:medication',
  'i-carbon:pills',
  'i-carbon:stethoscope',
  'i-carbon:cognitive',
  'i-carbon:FingerprintRecognition',

  // 🍔 Cibo / Bevande / Ristorazione
  'i-carbon:restaurant',
  'i-carbon:cafe',
  'i-carbon:shopping-cart',
  'i-carbon:ShoppingCartPlus',
  'i-carbon:shopping-bag',
  'i-carbon:fish',
  'i-carbon:corn',
  'i-carbon:NoodleBowl',
  'i-carbon:bar',

  // 🚗 Trasporti / Veicoli / Mobilità
  'i-carbon:car',
  'i-carbon:car-front',
  'i-carbon:scooter',
  'i-carbon:bicycle',
  'i-carbon:bus',
  'i-carbon:train',
  'i-carbon:van',
  'i-carbon:charging-station',
  'i-carbon:gas-station',
  'i-carbon:road',
  'i-carbon:plane',
  'i-carbon:plane-private',
  'i-carbon:tank',

  // 🌍 Natura / Viaggi / Luoghi
  'i-carbon:mountain',
  'i-carbon:tree',
  'i-carbon:map',
  'i-carbon:location',
  'i-carbon:palm-tree',
  'i-carbon:hotel',
  'i-carbon:monster', // forse usata per avventure?

  // 🎮 Divertimento / Intrattenimento / Musica / Giochi
  'i-carbon:music',
  'i-carbon:game-console',
  'i-carbon:apps',
  'i-carbon:tool-kit',

  // 🧠 Tecnologia / Informatica / Utente
  'i-carbon:laptop',
  'i-carbon:mobile',
  'i-carbon:tablet',
  'i-carbon:WatsonxData',
  'i-carbon:user',
  'i-carbon:settings',

  // 🏆 Sport / Attività fisica
  'i-carbon:basketball',
  'i-carbon:soccer',
  'i-carbon:tennis',
  'i-carbon:swim',
  'i-carbon:trophy',

  // ⏰ Tempo / Allarmi / Sicurezza
  'i-carbon:alarm',
  'i-carbon:password',

  // 📁 Altro / Varie
  'i-carbon:folder',
  'i-carbon:bee',
  'i-carbon:rocket',
  'i-carbon:Diagram',
];
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

<style scoped></style>
