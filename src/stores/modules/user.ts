import {defineStore} from 'pinia';
import {signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {AUTH} from '@/config/firebase';
import {clearToken, setToken} from '@/utils/auth';
import type {UserState, LoginData} from '@/api/user';

const InitUserInfo = {
  uid: '',
  email: '',
  displayName: '',
  avatar: '', // Aggiunto avatar come parte delle informazioni iniziali
};

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {...InitUserInfo},
  }),
  actions: {
    setInfo(partial: Partial<UserState>) {
      this.userInfo = {...this.userInfo, ...partial};
    },
    async fetchUserInfo() {
      const user = AUTH.currentUser;
      if (user) {
        this.setInfo({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          avatar: user.photoURL || '', // Aggiunto avatar
        });
      } else {
        throw new Error('User not logged in');
      }
    },
    async login(loginForm: LoginData) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          AUTH,
          loginForm.email,
          loginForm.password
        );
        const user = userCredential.user;

        // Save the token in localStorage
        setToken(await user.getIdToken());

        // Update user information
        this.setInfo({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          avatar: user.photoURL || '', // Aggiunto avatar
        });
      } catch (error) {
        clearToken(); // Clear the token in case of error
        throw error;
      }
    },
    async logout() {
      try {
        await signOut(AUTH);
      } finally {
        clearToken(); // Clear the token during logout
        this.setInfo({...InitUserInfo}); // Reset user information, incluso avatar
      }
    },
  },
  persist: true, // Enable persistent state
});
