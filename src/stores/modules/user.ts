import {defineStore} from 'pinia';
import type {UserState, LoginData} from '@/api/user'; // Assicurati che i tipi siano importati correttamente
import {clearToken, setToken} from '@/utils/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {AUTH} from '@/config/firebase'; // Importa AUTH da firebase.ts

const InitUserInfo = {
  uid: '',
  email: '',
  displayName: '',
};

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserState>({...InitUserInfo});

  // Set user's information
  const setInfo = (partial: Partial<UserState>) => {
    userInfo.value = {...userInfo.value, ...partial};
  };

  const fetchUserInfo = async () => {
    const user = AUTH.currentUser;
    if (user) {
      setInfo({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
      });
    } else {
      throw new Error('User not logged in');
    }
  };

  const login = async (loginForm: LoginData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        AUTH,
        loginForm.email,
        loginForm.password
      );
      const user = userCredential.user;

      // Salva il token nel localStorage
      setToken(await user.getIdToken());

      // Aggiorna le informazioni dell'utente
      setInfo({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
      });
    } catch (error) {
      clearToken(); // Pulisci il token in caso di errore
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(AUTH);
    } finally {
      clearToken(); // Pulisci il token durante il logout
      setInfo({...InitUserInfo}); // Resetta le informazioni dell'utente
    }
  };

  const updateUserProfile = async (profileData: Partial<UserState>) => {
    const user = AUTH.currentUser;

    if (user) {
      await updateProfile(user, {
        displayName: profileData.displayName,
      });
      setInfo(profileData); // Aggiorna localmente le informazioni del profilo
    }
  };

  return {
    userInfo,
    fetchUserInfo,
    login,
    logout,
    updateUserProfile,
  };
});
