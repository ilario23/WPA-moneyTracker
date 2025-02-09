import {AUTH} from '@/config/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';

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

// Register
export async function register(data: LoginData): Promise<void> {
  await createUserWithEmailAndPassword(AUTH, data.email, data.password);
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

// Reset Password
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(AUTH, email);
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
