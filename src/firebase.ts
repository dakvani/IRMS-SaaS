import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithPopup, GoogleAuthProvider, onIdTokenChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const storage = getStorage(app);

const provider = new GoogleAuthProvider();

let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onIdTokenChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        if (onAuthSuccess) onAuthSuccess(user, token);
      } catch (error) {
        console.error("Error getting ID token", error);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.error('Sign in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const emailSignUp = async (email: string, password: string, name: string): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    // Force token refresh to include new profile info (if custom claims depend on it, though standard claims just need refresh)
    const token = await result.user.getIdToken(true); 
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    throw error;
  }
};

export const emailSignIn = async (email: string, password: string): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

export const logout = async () => {
  await auth.signOut();
};
