
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { Transaction, Budget } from '@/types/finance';

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signOutUser = async () => {
  return await signOut(auth);
};

// Firestore functions
export const fetchTransactions = async (userId: string) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const querySnapshot = await getDocs(transactionsRef);
  const fetchedTransactions: Transaction[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
  });
  
  return fetchedTransactions;
};

export const fetchBudgets = async (userId: string) => {
  const budgetsRef = collection(db, 'users', userId, 'budgets');
  const querySnapshot = await getDocs(budgetsRef);
  const fetchedBudgets: Budget[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedBudgets.push({ id: doc.id, ...doc.data() } as Budget);
  });
  
  return fetchedBudgets;
};

export const saveTransaction = async (userId: string, transaction: Transaction) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  await setDoc(doc(transactionsRef, transaction.id), {
    ...transaction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateTransactionDoc = async (userId: string, transaction: Transaction) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  await setDoc(doc(transactionsRef, transaction.id), {
    ...transaction,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteTransactionDoc = async (userId: string, transactionId: string) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  await deleteDoc(doc(transactionsRef, transactionId));
};

export const saveBudget = async (userId: string, budget: Budget) => {
  const budgetsRef = collection(db, 'users', userId, 'budgets');
  await setDoc(doc(budgetsRef, budget.id), {
    ...budget,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const deleteBudgetDoc = async (userId: string, budgetId: string) => {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId);
  await deleteDoc(budgetRef);
};

export const saveTransactionsBatch = async (userId: string, transactions: Transaction[]) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const promises = transactions.map(async (transaction) => {
    await setDoc(doc(transactionsRef, transaction.id), {
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  
  await Promise.all(promises);
};

export const clearUserData = async (userId: string) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const budgetsRef = collection(db, 'users', userId, 'budgets');
  
  const transactionsSnapshot = await getDocs(transactionsRef);
  const transactionPromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  const budgetsSnapshot = await getDocs(budgetsRef);
  const budgetPromises = budgetsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  await Promise.all([...transactionPromises, ...budgetPromises]);
};
