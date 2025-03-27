<script setup lang="ts">
import {useRouter} from 'vue-router';
import {useUserStore} from '@/stores';
import {showNotify} from 'vant';
import {signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
import {AUTH} from '@/config/firebase';
import {handleNewUser} from '@/api/user';

import logo from '~/images/logo.svg';
import logoDark from '~/images/logo-dark.svg';

const {t} = useI18n();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);

const dark = ref<boolean>(isDark.value);

watch(
  () => isDark.value,
  (newMode) => {
    dark.value = newMode;
  }
);

async function loginWithGoogle() {
  try {
    loading.value = true;
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(AUTH, provider);
    const user = result.user;

    // Salva le informazioni dell'utente nello store
    userStore.setInfo({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      avatar: user.photoURL || '',
    });

    // Verifica se l'utente è nuovo e crea la collection base
    const isNewUser = await handleNewUser({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      avatar: user.photoURL || '',
    });

    if (isNewUser) {
      showNotify({type: 'success', message: t('login.newUserCreated')});
    } else {
      showNotify({type: 'success', message: t('login.success')});
    }

    // Reindirizza alla home
    const {redirect, ...othersQuery} = router.currentRoute.value.query;
    router.push({
      name: 'home',
      query: {
        ...othersQuery,
      },
    });
  } catch (error) {
    console.error(error);
    showNotify({type: 'danger', message: t('login.error')});
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="m-x-a w-7xl text-center">
    <div class="mb-32 mt-20">
      <van-image
        :src="dark ? logoDark : logo"
        class="h-120 w-120"
        alt="brand logo"
      />
    </div>

    <div class="mt-16">
      <van-button
        :loading="loading"
        type="primary"
        round
        block
        @click="loginWithGoogle"
      >
        {{ $t('login.loginWithGoogle') }}
      </van-button>
    </div>
  </div>
</template>

<route lang="json5">
{
  name: 'login',
  meta: {
    i18n: 'menus.login',
  },
}
</route>
