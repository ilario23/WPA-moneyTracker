<script setup lang="ts">
import {useRouter} from 'vue-router';
import {useUserStore} from '@/stores';
import {showNotify} from 'vant';
import {signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
import {AUTH} from '@/config/firebase';
import {handleNewUser} from '@/api/user';

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
    <h1
      class="text-9xl font-bold"
      :class="dark ? 'text-theme-dark' : 'text-theme-light'"
    >
      {{ $t('login.welcome') }}
    </h1>
    <div class="mb-32 mt-20">
      <img
        src="@/assets/images/log-in-girl.svg"
        class="h-300 w-300 mt-8"
        alt="login illustration"
      />
    </div>

    <div class="mt-16">
      <van-button
        :loading="loading"
        round
        @click="loginWithGoogle"
        ButtonIconPosition="right"
        type="primary"
      >
        <template #icon>
          <div
            class="h-38 w-38 rounded-full mr-10 bg-gray-100 flex items-center justify-center"
          >
            <img
              src="@/assets/images/google-icon.svg"
              class="h-30 w-30 rounded-full"
              alt="Google logo"
            />
          </div>
        </template>
        <span class="flex-1 text-center">
          {{ $t('login.loginWithGoogle') }}
        </span>
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.text-theme-light {
  color: #050e20;
}

.text-theme-dark {
  color: #ffffff;
}
</style>

<route lang="json5">
{
  name: 'login',
  meta: {
    i18n: 'menus.login',
  },
}
</route>
