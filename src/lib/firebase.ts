import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, User, setPersistence, indexedDBLocalPersistence, signInWithCredential, signInAnonymously } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
// ... rest of imports
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  getDoc,
  writeBatch,
  setLogLevel,
  enableIndexedDbPersistence
} from 'firebase/firestore';                
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence explicitly to Local for better cross-platform support
setPersistence(auth, indexedDBLocalPersistence);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence for better user experience
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Dữ liệu chỉ tàng trữ trong một thẻ trình duyệt duy nhất.");
    } else if (err.code === 'unimplemented') {
      console.warn("Trình duyệt không hỗ trợ tàng trữ lãng du.");
    }
  });
}

// Suppress Firestore's internal quota/backoff logging to avoid polluting the preview console
setLogLevel('silent');

export const googleProvider = new GoogleAuthProvider();
// Force account selection which helps in some WebViews
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async () => {
  try {
    const platform = Capacitor.getPlatform();
    console.log("Detecting platform for login:", platform);

    if (platform !== 'web') {
        // Native Google Authentication for APK
        try {
            console.log("Starting native login flow...");
            // Ensure initialized
            await GoogleAuth.initialize();
            
            const googleUser = await GoogleAuth.signIn();
            console.log("Google Auth SignIn success:", googleUser.email);
            
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const result = await signInWithCredential(auth, credential);
            console.log("Firebase Auth success for:", result.user.email);
            return result.user;
        } catch (error: any) {
            console.warn("Native login with plugin failed, attempting Web fallback...", error);
            try {
                // Try Firebase Auth web flow (signInWithRedirect) as fallback inside Webview
                // This might work if the native plugin isn't configured with the Web Client ID
                await signInWithRedirect(auth, googleProvider);
                return null; // Will redirect and reload
            } catch (fallbackError: any) {
                console.error("Native login fallback failed:", fallbackError);
                const errorMsg = error.message || JSON.stringify(error);
                alert(`Lỗi Đăng Nhập APK: Chưa cập nhật Client ID.\n\nChi tiết: ${errorMsg}\n(Lập trình viên cần đưa Web Client ID vào file capacitor.config.ts và build lại APK)`);
                throw error;
            }
        }
    } else {
        // Web Google Authentication
        console.log("Starting web login flow (Popup)...");
        return (await signInWithPopup(auth, googleProvider)).user;
    }
  } catch (error: any) {
    console.error("General login error:", error);
    
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        alert("Cửa sổ đăng nhập đã bị chặn hoặc đóng.");
        await signInWithRedirect(auth, googleProvider);
        return null;
    }
    
    alert(`Lỗi Đăng Nhập Hệ Thống: ${error.message}`);
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    return (await signInAnonymously(auth)).user;
  } catch (error: any) {
    alert(`Lỗi Đăng Nhập Ẩn Danh: ${error.message}`);
    throw error;
  }
};

export const logout = () => auth.signOut();

// Sync interface for real-time updates
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null) => {
  if (error.message?.includes('insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: user ? {
        userId: user.uid,
        email: user.email || '',
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        providerInfo: user.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || '',
        }))
      } : {
        userId: 'anonymous',
        email: '',
        emailVerified: false,
        isAnonymous: true,
        providerInfo: []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};
