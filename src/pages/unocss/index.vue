<template>
  <h1 class="text-6xl color-pink font-semibold">Hello, Unocss!</h1>

  <p class="mt-4 text-gray-700 dark:text-white">
    This is a simple example of Unocss in action.
  </p>

  <button class="btn">Button</button>

  <div class="w-50 h-50 i-mdi-heart bg-blue"></div>
</template>

<script setup lang="ts"></script>

<route lang="json5">
{
  name: 'unocss',
  meta: {
    title: '🎨 Unocss',
    i18n: 'menus.unocssExample',
  },
}
</route>
