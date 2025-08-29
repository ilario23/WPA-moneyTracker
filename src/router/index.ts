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

  // Stato corrente
  const isAuthenticated = !!userStore.userInfo?.uid;
  const hasToken = isLogin();

  // Debug minimale
  // console.log('router guard', { path: to.path, isAuthenticated, hasToken, toName: to.name });

  // 1) Se la pagina è pubblica, permetti subito
  if (publicPages.includes(to.name)) {
    NProgress.done();
    return true;
  }

  // 2) Se abbiamo già userInfo, permetti
  if (isAuthenticated) {
    return true;
  }

  // 3) Se abbiamo token ma non userInfo, prova a recuperarla
  if (hasToken) {
    try {
      await userStore.fetchUserInfo();
      // fetch riuscito: permetti la navigazione originale
      return true;
    } catch (error) {
      // token non valido o errore -> logout e redirect al login (replace per non lasciare il login nello storico)
      await userStore.logout();
      return {name: 'login', replace: true};
    }
  }

  // 4) Nessun token: redirect al login (replace per evitare problemi di back)
  return {name: 'login', replace: true};
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
