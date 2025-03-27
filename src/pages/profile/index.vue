<script setup lang="ts">
import {ref, computed} from 'vue';
import {useUserStore} from '@/stores';
import {showNotify} from 'vant';
import defaultAvatar from '@/assets/images/default-avatar.svg';
import {showConfirmDialog} from 'vant';

const {t} = useI18n();
const router = useRouter();

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

// Stato per la dialog
const showDialog = ref(false);

function clickProfile() {
  showDialog.value = true; // Mostra la dialog
}

async function logout() {
  showConfirmDialog({
    title: t('profile.comfirmTitle'),
  })
    .then(() => {
      showDialog.value = false; // Chiudi la dialog
      showNotify({type: 'success', message: t('profile.succesfulLogout')});
      userStore.logout();
      router.push({name: 'login'});
    })
    .catch((error) => {
      console.error('Errore durante il logout:', error);
      showNotify({type: 'danger', message: t('profile.errorLogout')});
    });
}
</script>

<template>
  <div>
    <VanCellGroup :inset="true">
      <van-cell center @click="clickProfile">
        <template #title>
          <van-image
            :src="userInfo.avatar || defaultAvatar"
            round
            class="h-56 w-56"
          />
        </template>

        <template #value>
          <span>{{ userInfo.email }}</span>
        </template>
      </van-cell>
    </VanCellGroup>

    <VanCellGroup :inset="true" class="!mt-16">
      <van-cell
        :title="$t('profile.settings')"
        icon="setting-o"
        is-link
        to="/settings"
      />
      <van-cell
        :title="$t('profile.docs')"
        icon="flower-o"
        is-link
        url="https://tenor.com/view/zeb-zeb89-eh-volevi-unto-gif-10755033"
      />
    </VanCellGroup>

    <!-- Dialog -->
    <van-dialog
      v-model:show="showDialog"
      :title="$t('profile.userInfo')"
      confirm-button-text="Logout"
      closeOnClickOverlay
    >
      <van-cell-group>
        <div class="px-5">
          <van-field
            :label="$t('profile.userEmail')"
            :placeholder="userInfo.email"
            readonly
            class="mt-10"
          />
          <van-field
            :label="$t('profile.userDisplayName')"
            :placeholder="userInfo.displayName"
            readonly
          />
          <van-field
            :label="$t('profile.userUid')"
            :placeholder="userInfo.uid"
            readonly
          />
          <van-cell center :title="$t('profile.userAvatar')">
            <template #right-icon>
              <van-image
                :src="userInfo.avatar || defaultAvatar"
                round
                class="h-36 w-36"
              />
            </template>
          </van-cell>
        </div>
      </van-cell-group>
      <template #footer>
        <van-button type="danger" @click="logout" block>
          {{ $t('profile.logout') }}
        </van-button>
      </template>
    </van-dialog>
  </div>
</template>

<route lang="json5">
{
  name: 'profile',
  meta: {
    title: 'profile',
    i18n: 'menus.profile',
  },
}
</route>
