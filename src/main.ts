import {createApp} from 'vue';
import {createHead} from '@unhead/vue';
import App from '@/App.vue';
import router from '@/router';
import pinia from '@/stores';
import 'virtual:uno.css';
import '@/styles/app.less';
import '@/styles/var.less';
import {i18n} from '@/utils/i18n';

// Vant Desktop Adaptation
import '@vant/touch-emulator';

/* --------------------------------
There are individual components in Vant that are provided as functions.
These include the Toast, Dialog, Notify and ImagePreview components.
When using function components, the unplugin-vue-components
does not automatically introduce styles when using function components, so you need to introduce them manually.
------------------------------------- */
import 'vant/es/toast/style';
import 'vant/es/dialog/style';
import 'vant/es/notify/style';
import 'vant/es/image-preview/style';
import {registerSW} from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🆕 Nuova versione disponibile, aggiorno...');
    updateSW(true); // forza l'aggiornamento
  },
  onOfflineReady() {
    console.log('📦 App pronta per funzionare offline!');
  },
});

const app = createApp(App);
const head = createHead();

app.use(head);
app.use(router);
app.use(pinia);
app.use(i18n);

app.mount('#app');
