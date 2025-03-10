
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, DashboardStats, Budget, BudgetSummary } from '@/types/finance';
import { parseCSV, calculateDashboardStats } from '@/utils/finance-utils';
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

// Firebase configuration
const firebaseConfig = {
  // This would be filled with your Firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface FinanceContextType {
  transactions: Transaction[];
  stats: DashboardStats | null;
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  importCSV: (csvContent: string) => void;
  clearData: () => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Load data from localStorage on initial render
  useEffect(() => {
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
  }, []);

  // Update localStorage and stats whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('financeTrackerData', JSON.stringify(transactions));
      setStats(calculateDashboardStats(transactions));
    }
  }, [transactions]);

  // Update localStorage whenever budgets change
  useEffect(() => {
    localStorage.setItem('financeTrackerBudgets', JSON.stringify(budgets));
  }, [budgets]);

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

  const importCSV = (csvContent: string) => {
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
      
      setTransactions(prev => {
        const combined = [...prev, ...newTransactions];
        return combined;
      });
      
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

  const clearData = () => {
    setTransactions([]);
    setBudgets([]);
    setStats(initialStats);
    localStorage.removeItem('financeTrackerData');
    localStorage.removeItem('financeTrackerBudgets');
    toast({
      title: "Data Cleared",
      description: "All financial data has been removed",
    });
  };

  const addBudget = (budget: Budget) => {
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
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
    toast({
      title: "Budget Removed",
      description: "Budget has been deleted",
    });
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
      clearData,
      addBudget,
      deleteBudget,
      signIn,
      signUp,
      logout
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
