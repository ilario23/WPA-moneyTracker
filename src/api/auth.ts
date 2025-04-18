import {useUserStore} from '@/stores';
import {AUTH} from '../config/firebase';
import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {API} from '../api';
import type {User} from '../types/user';

export const Auth = {
  onAuthChange: async () =>
    new Promise((res, rej) => {
      onAuthStateChanged(AUTH, async (firebaseUser) => {
        if (firebaseUser) {
          const ddUser = await API.Database.Users.getById(firebaseUser.uid);
          if (ddUser) {
            useUserStore().setInfo(ddUser);
            res(true);
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email || '',
              email: firebaseUser.email || '',
            };
            const createdUser = await API.Database.Users.create(newUser);
            useUserStore().setInfo(createdUser);
            res(!!createdUser);
          }
        } else {
          useUserStore().setInfo(null);
          rej(false);
        }
      });
    }),
  login: async (email: string, password: string) => {
    signInWithEmailAndPassword(AUTH, email, password)
      .then(async ({user}) => console.info(user))
      .catch((error) => console.error(error));
  },
  logout: async () =>
    signOut(AUTH).then(() => {
      console.info('logout');
    }),
};
