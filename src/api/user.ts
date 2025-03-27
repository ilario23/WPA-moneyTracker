import {AUTH} from '@/config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type {Category} from '@/types/category';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';
// import base categories from '@/utils/category';
import {BASE_CATEGORIES} from '@/utils/category';

// Define interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginRes {
  token: string;
}

export interface UserState {
  uid?: string;
  name?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
}

// Login
export async function login(data: LoginData): Promise<LoginRes> {
  const userCredential = await signInWithEmailAndPassword(
    AUTH,
    data.email,
    data.password
  );
  const user = userCredential.user;
  const token = await user.getIdToken();
  return {token};
}

// Logout
export async function logout(): Promise<void> {
  await signOut(AUTH);
}

// Get User Info
export async function getUserInfo(): Promise<UserState> {
  const user = AUTH.currentUser;
  if (user) {
    return {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || '',
      avatar: user.photoURL || '',
    };
  }
  throw new Error('User not logged in');
}

// Listen to Auth State Changes
export function onAuthStateChange(
  callback: (user: UserState | null) => void
): void {
  onAuthStateChanged(AUTH, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        avatar: user.photoURL || '',
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Controlla se l'utente è nuovo e, in caso affermativo, crea una collection base.
 * @param user L'oggetto utente di Firebase
 */
export async function handleNewUser(user: UserState): Promise<boolean> {
  try {
    const userDocRef = doc(DB, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // L'utente è nuovo, crea un documento utente
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        avatar: user.avatar || '',
        createdAt: new Date().toISOString(),
      });

      // Crea una collection base con il costruttore di categorie
      const defaultCategories: Category[] = BASE_CATEGORIES.map((category) => ({
        ...category,
        userId: user.uid,
      }));

      for (const category of defaultCategories) {
        await setDoc(
          doc(DB, 'users', user.uid, 'categories', category.id),
          category
        );
      }

      return true; // Indica che l'utente è nuovo
    }

    return false; // Indica che l'utente esiste già
  } catch (error) {
    console.error('Errore durante il controllo del nuovo utente:', error);
    throw error;
  }
}
