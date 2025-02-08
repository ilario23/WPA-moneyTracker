<script setup lang="ts">
import { showConfirmDialog, showToast, SwipeCell } from 'vant'
import { ref } from 'vue'

function beforeClose({ position }) {
  switch (position) {
    case 'left':
    case 'cell':
    case 'outside':
      return true
    case 'right':
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Are you sure to delete?',
        })
          .then(() => resolve(true))
          .catch(() => resolve(false))
      })
  }
}

const show = ref(true)
const onInput = value => showToast(value)
const onDelete = () => showToast('delete')

const { t } = useI18n()
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

  <van-cell plain type="primary" @touchstart.stop="show = true">
    Show Keyboard With Multiple ExtraKey
  </van-cell>
  <van-number-keyboard
    :show="show"
    theme="custom"
    :extra-key="['+', '*']"
    close-button-text="Close"
    @blur="show = false"
    @input="onInput"
    @delete="onDelete"
  />
</template>

<route lang="json5">
{
  name: 'test',
  meta: {
    title: '📊 TEST ',
    i18n: 'menus.test'
  },
}
</route>
