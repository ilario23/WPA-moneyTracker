<script setup lang="ts">
import {storeToRefs} from 'pinia';
import useAppStore from '@/stores/modules/app';
import useRouteCache from '@/stores/modules/routeCache';
import useAutoThemeSwitcher from '@/hooks/useAutoThemeSwitcher';
import {useUserStore} from '@/stores/modules/user';
import {ReminderNotificationService} from '@/services/reminderNotifications';

useHead({
  title: 'Vue3 Vant Mobile',
  meta: [
    {
      name: 'description',
      content: 'An mobile web apps template based on the Vue 3 ecosystem',
    },
    {
      name: 'theme-color',
      content: () => (isDark.value ? '#111111' : '#ffffff'),
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: () => (preferredDark.value ? '/favicon-dark.svg' : '/favicon.svg'),
    },
  ],
});

const appStore = useAppStore();
const userStore = useUserStore();
const {mode} = storeToRefs(appStore);

const {initializeThemeSwitcher} = useAutoThemeSwitcher(appStore);

const keepAliveRouteNames = computed(() => {
  return useRouteCache().routeCaches as string[];
});

onMounted(() => {
  initializeThemeSwitcher();
  
  // Start reminder notification service if user is logged in
  if (userStore.userInfo.uid) {
    ReminderNotificationService.startNotificationService(userStore.userInfo.uid);
  }
});

onUnmounted(() => {
  // Stop reminder notification service when app is unmounted
  ReminderNotificationService.stopNotificationService();
});
</script>

<template>
  <VanConfigProvider :theme="mode">
    <NavBar />
    <router-view v-slot="{Component, route}">
      <section class="app-wrapper">
        <keep-alive :include="keepAliveRouteNames">
          <component :is="Component" :key="route.name" />
        </keep-alive>
      </section>
    </router-view>
    <TabBar />
  </VanConfigProvider>
</template>

<style scoped>
.app-wrapper {
  width: 100%;
  position: relative;
  padding: 16px;
}
</style>
