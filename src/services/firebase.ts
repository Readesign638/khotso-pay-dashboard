import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QuerySnapshot
} from "firebase/firestore";

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  type User 
} from "firebase/auth";

import type { Transaction } from "../types/schema";

// Helper type for new transactions
export type TransactionInput = Omit<Transaction, 'id'>;

// Define this only ONCE
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 1. Initialize App
const app = initializeApp(firebaseConfig);

// 2. Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTH FUNCTIONS ---

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logoutUser = () => signOut(auth);

// --- DATABASE FUNCTIONS ---

export const createTransaction = async (userId: string, data: TransactionInput) => {
  return await addDoc(collection(db, "transactions"), {
    ...data,
    userId,
    createdAt: serverTimestamp()
  });
};

export const editTransaction = async (id: string, data: Partial<TransactionInput>) => {
  const docRef = doc(db, "transactions", id);
  return await updateDoc(docRef, data);
};

export const subscribeToTransactions = (
  userId: string, 
  callback: (data: Transaction[]) => void
) => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data() 
    })) as Transaction[];
    callback(items);
  });
};

export const removeTransaction = async (id: string) => {
  return await deleteDoc(doc(db, "transactions", id));
};