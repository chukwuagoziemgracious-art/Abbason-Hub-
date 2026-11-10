import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Product, Order, User, SellerProfile, SellerReview, Complaint, SellerVerificationRequest } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider (Google Auth is the provisioned authentication provider on this Cloud project)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Self-healing auth listener: If a cached unprovisioned token exists in IndexedDB that causes Token Service errors, clear it immediately
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await user.getIdToken();
    } catch (err: any) {
      if (
        err?.message?.includes('token-service-api') ||
        err?.message?.includes('securetoken.googleapis.com') ||
        err?.code === 'auth/internal-error'
      ) {
        console.warn('[Abbason Hub] Resetting unprovisioned auth credential to ensure clean Firestore connectivity.');
        try {
          await firebaseSignOut(auth);
        } catch {}
      }
    }
  }
});

// Operation types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);

  // If error is related to unprovisioned token service, sign out to recover
  if (
    errMessage.includes('token-service-api') ||
    errMessage.includes('securetoken.googleapis.com')
  ) {
    console.warn('[Abbason Hub] Auth token service unavailable, resetting session.');
    try {
      firebaseSignOut(auth);
    } catch {}
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
}

// Connection check on boot with self-healing recovery
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Abbason Hub] Firebase Firestore connected successfully.');
    return true;
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('token-service-api') || msg.includes('securetoken.googleapis.com')) {
      console.warn('[Abbason Hub] Clearing stale token and retrying connection check.');
      try {
        await firebaseSignOut(auth);
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log('[Abbason Hub] Firebase Firestore connected successfully after token reset.');
        return true;
      } catch {}
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Abbason Hub] Running in offline mode; local cache active.');
    } else {
      console.log('[Abbason Hub] Firebase initialized (readiness checked).');
    }
    return false;
  }
}

// Auth Helpers
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToSellerProfiles(onUpdate: (profiles: SellerProfile[]) => void): Unsubscribe {
  const path = 'sellerProfiles';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: SellerProfile[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as SellerProfile);
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function cleanupSellerPhonesFromProducts(): Promise<void> {
  const path = 'products';
  try {
    const snapshot = await getDocs(collection(db, path));
    const promises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if ('sellerPhone' in data) {
        promises.push(updateDoc(doc(db, path, docSnap.id), { sellerPhone: deleteField() }));
      }
    });
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log(`[Abbason Hub] Cleaned up sellerPhone from ${promises.length} legacy products.`);
    }
  } catch (error) {
    console.warn('[Abbason Hub] sellerPhone cleanup info:', error);
  }
}

// Firestore Realtime Subscriptions & Actions with handleFirestoreError

export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  campusId?: string
): Unsubscribe {
  const path = 'products';
  try {
    let q = query(collection(db, path));
    if (campusId && campusId !== 'all') {
      q = query(collection(db, path), where('campusId', '==', campusId));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Product);
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Order sync:
 * Owner admin: limited whole-collection query.
 * Everyone else: two queries, where('buyerId','==',uid) and where('sellerId','==',uid),
 * merged by order id; the remote copy wins. Nothing when signed out.
 */
export function subscribeToUserOrders(
  userId: string,
  isOwnerAdmin: boolean,
  onUpdate: (orders: Order[]) => void
): Unsubscribe {
  if (!userId) return () => {};
  const path = 'orders';

  if (isOwnerAdmin) {
    try {
      const q = query(collection(db, path), limit(150));
      return onSnapshot(
        q,
        (snapshot) => {
          const items: Order[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as Order);
          });
          onUpdate(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return () => {};
    }
  }

  // Regular user: merge buyer and seller queries
  const buyerMap = new Map<string, Order>();
  const sellerMap = new Map<string, Order>();

  const emit = () => {
    const merged = new Map<string, Order>();
    buyerMap.forEach((ord, id) => merged.set(id, ord));
    sellerMap.forEach((ord, id) => merged.set(id, ord));
    onUpdate(Array.from(merged.values()));
  };

  try {
    const qBuyer = query(collection(db, path), where('buyerId', '==', userId), limit(100));
    const unsubBuyer = onSnapshot(
      qBuyer,
      (snap) => {
        buyerMap.clear();
        snap.forEach((d) => buyerMap.set(d.id, d.data() as Order));
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );

    const qSeller = query(collection(db, path), where('sellerId', '==', userId), limit(100));
    const unsubSeller = onSnapshot(
      qSeller,
      (snap) => {
        sellerMap.clear();
        snap.forEach((d) => sellerMap.set(d.id, d.data() as Order));
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );

    return () => {
      unsubBuyer();
      unsubSeller();
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateProductInFirestore(productId: string, partial: Partial<Product>): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrderInFirestore(orderId: string, partial: Partial<Order>): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveReviewToFirestore(review: SellerReview): Promise<void> {
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, 'reviews', review.id), review);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  const path = `complaints/${complaint.id}`;
  try {
    await setDoc(doc(db, 'complaints', complaint.id), complaint);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateComplaintInFirestore(complaintId: string, partial: Partial<Complaint>): Promise<void> {
  const path = `complaints/${complaintId}`;
  try {
    await updateDoc(doc(db, 'complaints', complaintId), partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveVerificationToFirestore(verification: SellerVerificationRequest): Promise<void> {
  const path = `verifications/${verification.id}`;
  try {
    await setDoc(doc(db, 'verifications', verification.id), verification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateVerificationInFirestore(verificationId: string, partial: Partial<SellerVerificationRequest>): Promise<void> {
  const path = `verifications/${verificationId}`;
  try {
    await updateDoc(doc(db, 'verifications', verificationId), partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserInFirestore(userId: string, partial: Partial<User>): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

