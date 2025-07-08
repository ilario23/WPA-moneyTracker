import {createPinia} from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import useAppStore from './modules/app';
import {useUserStore} from './modules/user';
import {useRemindersStore} from './modules/reminders';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export {useAppStore, useUserStore, useRemindersStore};
export default pinia;
