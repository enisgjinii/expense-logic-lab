import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, DashboardStats, Budget, BudgetSummary } from '@/types/finance';
import { parseXLS, calculateDashboardStats } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
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
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface FinanceContextType {
  transactions: Transaction[];
  stats: DashboardStats | null;
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  importXLS: (file: File) => void;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearData: () => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  exportData: () => string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Theme mode support
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
}

const initialStats: DashboardStats = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  byCategory: [],
  byAccount: [],
  byMonth: [],
  recentTransactions: []
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    const getPreferredTheme = (mode: "light" | "dark" | "system") => {
      if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return mode;
    };

    const appliedTheme = getPreferredTheme(themeMode);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(appliedTheme);
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const appliedTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(appliedTheme);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactionsFromFirebase();
      fetchBudgetsFromFirebase();
    } else {
      const savedData = localStorage.getItem(`${import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'financeTracker'}Data`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setTransactions(parsedData);
          setStats(calculateDashboardStats(parsedData));
        } catch (error: any) {
          console.error('Error loading saved data:', error);
          toast({ title: "Error", description: "Failed to load saved data: " + error.message, variant: "destructive" });
        }
      }
      const savedBudgets = localStorage.getItem(`${import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'financeTracker'}Budgets`);
      if (savedBudgets) {
        try {
          const parsedBudgets = JSON.parse(savedBudgets);
          setBudgets(parsedBudgets);
        } catch (error: any) {
          console.error('Error loading saved budgets:', error);
          toast({ title: "Error", description: "Failed to load saved budgets: " + error.message, variant: "destructive" });
        }
      }
    }
  }, [user]);

  const fetchTransactionsFromFirebase = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const querySnapshot = await getDocs(transactionsRef);
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(fetchedTransactions);
      setStats(calculateDashboardStats(fetchedTransactions));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({ title: "Error", description: "Failed to load transactions from Firebase: " + error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgetsFromFirebase = async () => {
    if (!user) return;
    try {
      const budgetsRef = collection(db, 'users', user.uid, 'budgets');
      const querySnapshot = await getDocs(budgetsRef);
      const fetchedBudgets: Budget[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBudgets.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setBudgets(fetchedBudgets);
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      toast({ title: "Error", description: "Failed to load budgets from Firebase: " + error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      if (!user) {
        localStorage.setItem(`${import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'financeTracker'}Data`, JSON.stringify(transactions));
      }
      setStats(calculateDashboardStats(transactions));
    }
  }, [transactions, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(`${import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'financeTracker'}Budgets`, JSON.stringify(budgets));
    }
  }, [budgets, user]);

  useEffect(() => {
    if (budgets.length === 0) {
      setBudgetSummaries([]);
      return;
    }
    const newBudgetSummaries = budgets.map(budget => {
      const relevantTransactions = transactions.filter(t => {
        if (t.category !== budget.category || t.type !== 'Expense') return false;
        const transactionDate = new Date(t.date);
        const now = new Date();
        if (budget.period === 'monthly') {
          return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
        } else if (budget.period === 'weekly') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return transactionDate >= startOfWeek;
        } else if (budget.period === 'yearly') {
          return transactionDate.getFullYear() === now.getFullYear();
        }
        return false;
      });
      const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;
      return { budget, spent, remaining, percentage };
    });
    setBudgetSummaries(newBudgetSummaries);
  }, [transactions, budgets]);

  const importXLS = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data || typeof data === 'string') throw new Error('Invalid file data.');
        const newTransactions = parseXLS(data);
        if (newTransactions.length === 0) {
          toast({ title: "Import Failed", description: "No valid transactions found in the XLS file", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (user) {
          await saveTransactionsToFirebase(newTransactions);
          await fetchTransactionsFromFirebase();
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
        toast({ title: "Import Successful", description: `Imported ${newTransactions.length} transactions from XLS` });
      } catch (error: any) {
        console.error('Error importing XLS:', error);
        toast({ title: "Import Failed", description: error.message || "Failed to parse XLS file", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = (error) => {
      const err = error as unknown as Error;
      console.error('Error reading file:', err);
      toast({ title: "File Read Error", description: "Failed to read the XLS file: " + err.message, variant: "destructive" });
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const saveTransactionsToFirebase = async (newTransactions: Transaction[]) => {
    if (!user) return;
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const promises = newTransactions.map(async (transaction) => {
        await setDoc(doc(transactionsRef, transaction.id), {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await Promise.all(promises);
    } catch (error: any) {
      console.error('Error saving transactions to Firebase:', error);
      throw error;
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await setDoc(doc(transactionsRef, transaction.id), {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => [...prev, transaction]);
      }
      toast({ title: "Transaction Added", description: "Your transaction has been successfully added" });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ title: "Error", description: "Failed to add transaction: " + error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await setDoc(doc(transactionsRef, transaction.id), {
          ...transaction,
          updatedAt: serverTimestamp()
        }, { merge: true });
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
      }
      toast({ title: "Transaction Updated", description: "Your transaction has been updated" });
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({ title: "Error", description: "Failed to update transaction: " + error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      if (user) {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await deleteDoc(doc(transactionsRef, id));
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
      toast({ title: "Transaction Deleted", description: "Transaction has been removed" });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error", description: "Failed to delete transaction: " + error.message, variant: "destructive" });
      throw error;
    }
  };

  const refreshData = async () => {
    try {
      if (user) {
        await fetchTransactionsFromFirebase();
        await fetchBudgetsFromFirebase();
        toast({ title: "Data Refreshed", description: "Data has been refreshed successfully" });
      } else {
        const savedData = localStorage.getItem('financeTrackerData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setTransactions(parsedData);
          setStats(calculateDashboardStats(parsedData));
          toast({ title: "Data Refreshed", description: "Local data has been refreshed" });
        } else {
          toast({ title: "No Data", description: "No local data available" });
        }
      }
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({ title: "Error", description: "Failed to refresh data: " + error.message, variant: "destructive" });
    }
  };

  const exportData = () => {
    try {
      const data = { transactions, budgets };
      return JSON.stringify(data, null, 2);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({ title: "Error", description: "Failed to export data: " + error.message, variant: "destructive" });
      return "";
    }
  };

  const clearData = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const transactionsSnapshot = await getDocs(transactionsRef);
        const transactionPromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        const budgetsSnapshot = await getDocs(budgetsRef);
        const budgetPromises = budgetsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all([...transactionPromises, ...budgetPromises]);
        setTransactions([]);
        setBudgets([]);
        setStats(initialStats);
        toast({ title: "Data Cleared", description: "All financial data has been removed from Firebase" });
      } catch (error: any) {
        console.error('Error clearing Firebase data:', error);
        toast({ title: "Error", description: "Failed to clear data from Firebase: " + error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setTransactions([]);
      setBudgets([]);
      setStats(initialStats);
      localStorage.removeItem('financeTrackerData');
      localStorage.removeItem('financeTrackerBudgets');
      toast({ title: "Data Cleared", description: "All financial data has been removed" });
    }
  };

  const addBudget = async (budget: Budget) => {
    try {
      if (user) {
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const q = query(budgetsRef, where("category", "==", budget.category));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, { ...budget, updatedAt: serverTimestamp() });
        } else {
          await setDoc(doc(budgetsRef, budget.id), { ...budget, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        await fetchBudgetsFromFirebase();
        toast({ title: "Budget Updated", description: `Updated budget for ${budget.category}` });
      } else {
        const existingIndex = budgets.findIndex(b => b.category === budget.category);
        if (existingIndex >= 0) {
          const updatedBudgets = [...budgets];
          updatedBudgets[existingIndex] = budget;
          setBudgets(updatedBudgets);
          toast({ title: "Budget Updated", description: `Updated budget for ${budget.category}` });
        } else {
          setBudgets(prev => [...prev, budget]);
        }
      }
    } catch (error: any) {
      console.error('Error adding/updating budget:', error);
      toast({ title: "Error", description: "Failed to update budget: " + error.message, variant: "destructive" });
    }
  };

  const updateBudget = addBudget;

  const deleteBudget = async (id: string) => {
    try {
      if (user) {
        const budgetRef = doc(db, 'users', user.uid, 'budgets', id);
        await deleteDoc(budgetRef);
        await fetchBudgetsFromFirebase();
      } else {
        setBudgets(prev => prev.filter(budget => budget.id !== id));
      }
      toast({ title: "Budget Removed", description: "Budget has been deleted" });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({ title: "Error", description: "Failed to delete budget: " + error.message, variant: "destructive" });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Signed In", description: "Welcome back!" });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({ title: "Sign In Failed", description: error.message || "Failed to sign in", variant: "destructive" });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Account Created", description: "Your account has been created successfully" });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({ title: "Sign Up Failed", description: error.message || "Failed to create account", variant: "destructive" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been signed out" });
      setTransactions([]);
      setBudgets([]);
      setStats(initialStats);
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: "Sign Out Failed", description: error.message || "Failed to sign out", variant: "destructive" });
      throw error;
    }
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      stats,
      budgets,
      budgetSummaries,
      user,
      isLoading,
      isAuthLoading,
      importXLS,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearData,
      addBudget,
      updateBudget,
      deleteBudget,
      refreshData,
      exportData,
      signIn,
      signUp,
      logout,
      themeMode,
      setThemeMode
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
