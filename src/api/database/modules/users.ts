import {DB} from '../../../config/firebase';
import type {User} from 'src/types/user.ts';
import {setLoading} from '../../../services/utils';
import {deleteDoc, doc, getDoc, setDoc} from 'firebase/firestore';
import {UserCategories} from './subcollections/user.categories';
import {UserTransactions} from './subcollections/user.transactions';

const COLLECTION = 'users';
export const Users = {
  getById: async (id: string) => {
    setLoading(true);
    const snap = await getDoc(doc(DB, COLLECTION, id)).finally(() =>
      setLoading(false)
    );
    return snap.exists() ? (snap.data() as User) : null;
  },
  create: async (user: User): Promise<User | null> => {
    try {
      setLoading(true);
      await setDoc(doc(DB, COLLECTION, user.uid), user);
      return user;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  },
  update: async (user: User): Promise<User | null> => {
    try {
      setLoading(true);
      await setDoc(doc(DB, COLLECTION, user.uid), user, {
        merge: true,
      });
      return user;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  },
  delete: async (user: User): Promise<void> => {
    setLoading(true);
    return deleteDoc(doc(DB, COLLECTION, user.uid)).finally(() =>
      setLoading(false)
    );
  },
  // ******** SUBCOLLECTIONS ****
  Categories: UserCategories,
  Transactions: UserTransactions,
};
