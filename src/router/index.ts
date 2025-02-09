import {createRouter, createWebHistory} from 'vue-router/auto';
import {handleHotUpdate, routes} from 'vue-router/auto-routes';

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import type {EnhancedRouteLocation} from './types';
import useRouteCacheStore from '@/stores/modules/routeCache';
import {useUserStore} from '@/stores';

import {isLogin} from '@/utils/auth';
import setPageTitle from '@/utils/set-page-title';

NProgress.configure({showSpinner: true, parent: '#app'});

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_PUBLIC_PATH),
  routes,
});

// This will update routes at runtime without reloading the page
if (import.meta.hot) handleHotUpdate(router);

router.beforeEach(async (to: EnhancedRouteLocation) => {
  NProgress.start();

  const routeCacheStore = useRouteCacheStore();
  const userStore = useUserStore();

  // Route cache
  routeCacheStore.addRoute(to);

  // Set page title
  setPageTitle(to.meta.title);

  if (isLogin()) {
    if (!userStore.userInfo?.uid) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        // Handle error (e.g., token expired, user not found)
        await userStore.logout();
        router.push({name: 'login'});
      }
    }
  } else if (to.meta.requiresAuth) {
    // Redirect to login if the route requires authentication
    router.push({name: 'login'});
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
