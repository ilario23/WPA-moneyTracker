import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router/auto';
import {handleHotUpdate, routes as autoRoutes} from 'vue-router/auto-routes';

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import type {EnhancedRouteLocation} from './types';
import useRouteCacheStore from '@/stores/modules/routeCache';
import {useUserStore} from '@/stores';

import {isLogin} from '@/utils/auth';
import setPageTitle from '@/utils/set-page-title';

NProgress.configure({showSpinner: true, parent: '#app'});

// Add redirect from root to add-transaction
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/add-transaction', // Redirect root path to add-transaction using path string
  },
  ...autoRoutes, // Include automatically generated routes
];

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

  // Pagine accessibili senza autenticazione
  const publicPages: Array<EnhancedRouteLocation['name']> = ['login', '404'];

  // Controlla se l'utente sta accedendo a una pagina pubblica o se è autenticato
  const isAuthenticated = !!userStore.userInfo?.uid;

  if (!isAuthenticated) {
    if (publicPages.includes(to.name)) {
      // Consenti l'accesso alle pagine pubbliche
      return true;
    }

    if (isLogin() && !publicPages.includes(to.name)) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        // Gestisci errori (es. token scaduto, utente non trovato)
        await userStore.logout();
        return {name: 'login'};
      }
    }

    // Reindirizza alla pagina di login se non autenticato
    return {name: 'login'};
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
