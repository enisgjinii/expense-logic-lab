
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, DashboardStats, Budget, BudgetSummary } from '@/types/finance';
import { parseCSV, calculateDashboardStats } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { initializeApp, FirebaseApp } from 'firebase/app';
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
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Get Firebase config from localStorage or use default
const getFirebaseConfig = (): FirebaseConfig => {
  const savedConfig = localStorage.getItem('firebaseConfig');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error parsing saved Firebase config:', error);
    }
  }
  
  // Default config (can be empty or with placeholder values)
  return {
    apiKey: "AIzaSyBl83QJGd2xdamHmfgC4jhxW3nIxFkm9Q0",
    authDomain: "channelanalyzer-f8b10.firebaseapp.com",
    projectId: "channelanalyzer-f8b10",
    storageBucket: "channelanalyzer-f8b10.firebasestorage.app",
    messagingSenderId: "368302555628",
    appId: "1:368302555628:web:f63747c8831ae916dd80c9"
  };
};

// Initialize Firebase with config from localStorage or default
let firebaseConfig = getFirebaseConfig();
let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  toast({
    title: "Firebase Error",
    description: "Failed to initialize Firebase. Please check your configuration.",
    variant: "destructive"
  });
}

interface FinanceContextType {
  transactions: Transaction[];
  stats: DashboardStats | null;
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  importCSV: (csvContent: string) => void;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  clearData: () => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateFirebaseConfig: (config: FirebaseConfig) => Promise<void>;
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Load data from Firebase or localStorage based on authentication state
  useEffect(() => {
    if (user) {
      // User is logged in, fetch from Firebase
      fetchTransactionsFromFirebase();
      fetchBudgetsFromFirebase();
    } else {
      // User is not logged in, load from localStorage
      const savedData = localStorage.getItem('financeTrackerData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setTransactions(parsedData);
          setStats(calculateDashboardStats(parsedData));
        } catch (error) {
          console.error('Error loading saved data:', error);
          toast({
            title: "Error",
            description: "Failed to load saved data",
            variant: "destructive"
          });
        }
      }

      // Load budgets
      const savedBudgets = localStorage.getItem('financeTrackerBudgets');
      if (savedBudgets) {
        try {
          const parsedBudgets = JSON.parse(savedBudgets);
          setBudgets(parsedBudgets);
        } catch (error) {
          console.error('Error loading saved budgets:', error);
        }
      }
    }
  }, [user]);

  // Fetch transactions from Firebase
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
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions from Firebase",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch budgets from Firebase
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
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({
        title: "Error",
        description: "Failed to load budgets from Firebase",
        variant: "destructive"
      });
    }
  };

  // Update localStorage and stats whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      // Only save to localStorage if user is not logged in
      if (!user) {
        localStorage.setItem('financeTrackerData', JSON.stringify(transactions));
      }
      setStats(calculateDashboardStats(transactions));
    }
  }, [transactions, user]);

  // Update localStorage whenever budgets change
  useEffect(() => {
    // Only save to localStorage if user is not logged in
    if (!user) {
      localStorage.setItem('financeTrackerBudgets', JSON.stringify(budgets));
    }
  }, [budgets, user]);

  // Calculate budget summaries when transactions or budgets change
  useEffect(() => {
    if (budgets.length === 0) {
      setBudgetSummaries([]);
      return;
    }

    const newBudgetSummaries = budgets.map(budget => {
      // Filter transactions by category and period
      const relevantTransactions = transactions.filter(t => {
        if (t.category !== budget.category || t.type !== 'Expense') {
          return false;
        }

        const transactionDate = new Date(t.date);
        const now = new Date();
        
        if (budget.period === 'monthly') {
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        } else if (budget.period === 'weekly') {
          // Get start of current week (Sunday)
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

      return {
        budget,
        spent,
        remaining,
        percentage
      };
    });

    setBudgetSummaries(newBudgetSummaries);
  }, [transactions, budgets]);

  const importCSV = async (csvContent: string) => {
    setIsLoading(true);
    try {
      const newTransactions = parseCSV(csvContent);
      if (newTransactions.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid transactions found in the CSV data",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (user) {
        // User is logged in, save to Firebase
        await saveTransactionsToFirebase(newTransactions);
        await fetchTransactionsFromFirebase(); // Refresh the transactions
      } else {
        // User is not logged in, save to localStorage
        setTransactions(prev => {
          const combined = [...prev, ...newTransactions];
          return combined;
        });
      }
      
      toast({
        title: "Import Successful",
        description: `Imported ${newTransactions.length} transactions`,
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Failed",
        description: "Failed to parse CSV data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save transactions to Firebase
  const saveTransactionsToFirebase = async (newTransactions: Transaction[]) => {
    if (!user) return;
    
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      
      // Save each transaction to Firebase
      const promises = newTransactions.map(async (transaction) => {
        await setDoc(doc(transactionsRef, transaction.id), {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving transactions to Firebase:', error);
      throw error;
    }
  };

  // Add a single transaction
  const addTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        // User is logged in, save to Firebase
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await setDoc(doc(transactionsRef, transaction.id), {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Refresh transactions
        await fetchTransactionsFromFirebase();
      } else {
        // User is not logged in, save to localStorage
        setTransactions(prev => [...prev, transaction]);
      }
      
      toast({
        title: "Transaction Added",
        description: "Your transaction has been successfully added",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Delete a transaction
  const deleteTransaction = async (id: string) => {
    try {
      if (user) {
        // User is logged in, delete from Firebase
        const transactionRef = doc(db, 'users', user.uid, 'transactions', id);
        await deleteDoc(transactionRef);
        
        // Refresh transactions
        await fetchTransactionsFromFirebase();
      } else {
        // User is not logged in, delete from localStorage
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      }
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been successfully removed",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update a transaction
  const updateTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        // User is logged in, update in Firebase
        const transactionRef = doc(db, 'users', user.uid, 'transactions', transaction.id);
        await updateDoc(transactionRef, {
          ...transaction,
          updatedAt: serverTimestamp()
        });
        
        // Refresh transactions
        await fetchTransactionsFromFirebase();
      } else {
        // User is not logged in, update in localStorage
        setTransactions(prev => 
          prev.map(t => t.id === transaction.id ? transaction : t)
        );
      }
      
      toast({
        title: "Transaction Updated",
        description: "Transaction has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
      throw error;
    }
  };

  const clearData = async () => {
    if (user) {
      // User is logged in, clear from Firebase
      try {
        setIsLoading(true);
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        
        // Get all transactions
        const transactionsSnapshot = await getDocs(transactionsRef);
        const transactionPromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Get all budgets
        const budgetsSnapshot = await getDocs(budgetsRef);
        const budgetPromises = budgetsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Execute all deletes
        await Promise.all([...transactionPromises, ...budgetPromises]);
        
        // Refresh the data
        setTransactions([]);
        setBudgets([]);
        setStats(initialStats);
        
        toast({
          title: "Data Cleared",
          description: "All financial data has been removed from Firebase",
        });
      } catch (error) {
        console.error('Error clearing Firebase data:', error);
        toast({
          title: "Error",
          description: "Failed to clear data from Firebase",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // User is not logged in, clear localStorage
      setTransactions([]);
      setBudgets([]);
      setStats(initialStats);
      localStorage.removeItem('financeTrackerData');
      localStorage.removeItem('financeTrackerBudgets');
      toast({
        title: "Data Cleared",
        description: "All financial data has been removed",
      });
    }
  };

  const addBudget = async (budget: Budget) => {
    try {
      if (user) {
        // User is logged in, save to Firebase
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        
        // Check if budget for this category already exists
        const q = query(budgetsRef, where("category", "==", budget.category));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Update existing budget
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            ...budget,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add new budget
          await setDoc(doc(budgetsRef, budget.id), {
            ...budget,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Refresh budgets
        await fetchBudgetsFromFirebase();
        
        toast({
          title: "Budget Updated",
          description: `Updated budget for ${budget.category}`,
        });
      } else {
        // User is not logged in, save to localStorage
        // Check if budget for this category already exists
        const existingIndex = budgets.findIndex(b => b.category === budget.category);
        
        if (existingIndex >= 0) {
          // Update existing budget
          const updatedBudgets = [...budgets];
          updatedBudgets[existingIndex] = budget;
          setBudgets(updatedBudgets);
          toast({
            title: "Budget Updated",
            description: `Updated budget for ${budget.category}`,
          });
        } else {
          // Add new budget
          setBudgets(prev => [...prev, budget]);
        }
      }
    } catch (error) {
      console.error('Error adding/updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      if (user) {
        // User is logged in, delete from Firebase
        const budgetRef = doc(db, 'users', user.uid, 'budgets', id);
        await deleteDoc(budgetRef);
        
        // Refresh budgets
        await fetchBudgetsFromFirebase();
      } else {
        // User is not logged in, delete from localStorage
        setBudgets(prev => prev.filter(budget => budget.id !== id));
      }
      
      toast({
        title: "Budget Removed",
        description: "Budget has been deleted",
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive"
      });
    }
  };

  // Update Firebase configuration
  const updateFirebaseConfig = async (config: FirebaseConfig) => {
    try {
      // Store the new config in localStorage
      localStorage.setItem('firebaseConfig', JSON.stringify(config));
      
      // Reinitialize Firebase with the new config
      // Note: This is a bit hacky and might not fully work without a page refresh
      // A full app restart is generally recommended after changing Firebase config
      try {
        const newApp = initializeApp(config, 'updated-app');
        auth = getAuth(newApp);
        db = getFirestore(newApp);
      } catch (error) {
        console.error('Error reinitializing Firebase with new config:', error);
        toast({
          title: "Warning",
          description: "Firebase configuration updated, but you'll need to refresh the page for changes to take effect",
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating Firebase config:', error);
      throw error;
    }
  };

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Signed In",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to sign in",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account Created",
        description: "Your account has been created successfully",
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been signed out",
      });
      
      // Clear in-memory data when logging out
      setTransactions([]);
      setBudgets([]);
      setStats(initialStats);
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
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
      importCSV, 
      addTransaction,
      deleteTransaction,
      updateTransaction,
      clearData,
      addBudget,
      deleteBudget,
      signIn,
      signUp,
      logout,
      updateFirebaseConfig
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
