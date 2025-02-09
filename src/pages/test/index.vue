<script setup lang="ts">
import {showConfirmDialog, showToast} from 'vant';
import {ref} from 'vue';

function beforeClose({
  position,
}: {
  position: string;
}): boolean | Promise<boolean> {
  switch (position) {
    case 'left':
    case 'cell':
    case 'outside':
      return true; // Chiusura immediata
    case 'right':
      return new Promise<boolean>((resolve) => {
        showConfirmDialog({
          title: 'Are you sure to delete?',
        })
          .then(() => resolve(true)) // Risolvi con true
          .catch(() => resolve(false)); // Risolvi con false
      });
    default:
      return false; // Fallback per posizioni sconosciute
  }
}

const showKeyboard = ref(false);
const onInput = (value) => showToast(value);
const onDelete = () => showToast('delete');

const {t} = useI18n();
</script>

<template>
  <p>PIPPO</p>
  title: {{ t('menus.test') }}

  <van-swipe-cell :before-close="beforeClose">
    <template #left>
      <van-button square type="primary" text="Select" />
    </template>
    <van-cell :border="false" title="Cell" value="Cell Content" />
    <template #right>
      <van-button square type="danger" text="Delete" />
    </template>
  </van-swipe-cell>

  <van-swipe-cell>
    <template #left>
      <van-button square type="primary" text="Select" />
    </template>
    <van-cell :border="false" title="Cell" value="Cell Content" />
    <template #right>
      <van-button square type="danger" text="Delete" />
      <van-button square type="primary" text="Collect" />
    </template>
  </van-swipe-cell>

  <van-cell plain type="primary" @touchstart.stop="showKeyboard = true">
    Show Keyboard With Multiple ExtraKey
  </van-cell>
  <van-number-keyboard
    :show="showKeyboard"
    theme="custom"
    :extra-key="['+', '*']"
    close-button-text="Close"
    @blur="showKeyboard = false"
    @input="onInput"
    @delete="onDelete"
  />
</template>

<route lang="json5">
{
  name: 'test',
  meta: {
    title: '📊 TEST ',
    i18n: 'menus.test',
  },
}
</route>
