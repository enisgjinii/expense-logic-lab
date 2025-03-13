
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

// Firestore functions - Transactions
export const fetchTransactions = async (userId: string) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const querySnapshot = await getDocs(transactionsRef);
  const fetchedTransactions: Transaction[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
  });
  
  return fetchedTransactions;
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

// Firestore functions - Budgets
export const fetchBudgets = async (userId: string) => {
  const budgetsRef = collection(db, 'users', userId, 'budgets');
  const querySnapshot = await getDocs(budgetsRef);
  const fetchedBudgets: Budget[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedBudgets.push({ id: doc.id, ...doc.data() } as Budget);
  });
  
  return fetchedBudgets;
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

// New Firestore functions - Categories
export const fetchCategories = async (userId: string) => {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  const querySnapshot = await getDocs(categoriesRef);
  const fetchedCategories: { id: string; name: string }[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedCategories.push({ id: doc.id, ...doc.data() } as { id: string; name: string });
  });
  
  return fetchedCategories;
};

export const saveCategory = async (userId: string, category: { id: string; name: string }) => {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  await setDoc(doc(categoriesRef, category.id), {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateCategoryDoc = async (userId: string, category: { id: string; name: string }) => {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  await setDoc(doc(categoriesRef, category.id), {
    ...category,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteCategoryDoc = async (userId: string, categoryId: string) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(categoryRef);
};

// New Firestore functions - Accounts
export const fetchAccounts = async (userId: string) => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  const querySnapshot = await getDocs(accountsRef);
  const fetchedAccounts: { id: string; name: string }[] = [];
  
  querySnapshot.forEach((doc) => {
    fetchedAccounts.push({ id: doc.id, ...doc.data() } as { id: string; name: string });
  });
  
  return fetchedAccounts;
};

export const saveAccount = async (userId: string, account: { id: string; name: string }) => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  await setDoc(doc(accountsRef, account.id), {
    ...account,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateAccountDoc = async (userId: string, account: { id: string; name: string }) => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  await setDoc(doc(accountsRef, account.id), {
    ...account,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteAccountDoc = async (userId: string, accountId: string) => {
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  await deleteDoc(accountRef);
};

export const clearUserData = async (userId: string) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const budgetsRef = collection(db, 'users', userId, 'budgets');
  const categoriesRef = collection(db, 'users', userId, 'categories');
  const accountsRef = collection(db, 'users', userId, 'accounts');
  
  const transactionsSnapshot = await getDocs(transactionsRef);
  const transactionPromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  const budgetsSnapshot = await getDocs(budgetsRef);
  const budgetPromises = budgetsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  const categoriesSnapshot = await getDocs(categoriesRef);
  const categoryPromises = categoriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  const accountsSnapshot = await getDocs(accountsRef);
  const accountPromises = accountsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  
  await Promise.all([...transactionPromises, ...budgetPromises, ...categoryPromises, ...accountPromises]);
};
