
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTransactionManager } from './useTransactionManager';
import { useAuthManager } from './useAuthManager';
import { useBudgetManager } from './useBudgetManager';
import { useThemeManager } from './useThemeManager';
import { DashboardStats, Budget, Transaction, BudgetSummary, Subscription } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';

interface FinanceContextProps {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  transactions: Transaction[];
  stats: DashboardStats;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importXLS: (file: File, transactions: Transaction[]) => Promise<void>;
  fetchTransactionsFromFirebase: () => Promise<void>;
  isLoading: boolean;
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  clearData: () => void;
  refreshData: () => Promise<void>;
  exportData: () => string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  twoFactorQRCode: string;
  generateTwoFactorSecret: () => Promise<{ secret: string; qrCode: string; } | undefined>;
  enableTwoFactor: (code: string) => Promise<boolean>;
  disableTwoFactor: (code: string) => Promise<boolean>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  // New subscription management functionality
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => Promise<void>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextProps | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuthManager();
  const { 
    user, 
    isAuthLoading, 
    signIn, 
    signUp, 
    logout 
  } = auth;
  const { 
    twoFactorEnabled, 
    twoFactorSecret, 
    twoFactorQRCode, 
    generateTwoFactorSecret,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactorCode 
  } = auth;
  
  const {
    transactions,
    stats,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importXLS,
    fetchTransactionsFromFirebase,
    clearData,
    refreshData,
    exportData
  } = useTransactionManager(user);
  
  const {
    budgets,
    budgetSummaries,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetManager(user, transactions);
  
  const {
    themeMode,
    setThemeMode
  } = useThemeManager();

  // Subscriptions management
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    // In a real app, this would fetch subscriptions from Firebase
    // For now, we'll just use local state
    if (user) {
      // Mock fetching subscriptions
      const mockSubscriptions: Subscription[] = [
        {
          id: uuidv4(),
          name: 'Netflix',
          description: 'Streaming service',
          amount: 15.99,
          currency: 'USD',
          category: 'Entertainment',
          billingCycle: 'monthly',
          nextBillingDate: '2023-12-15',
          autoRenew: true,
          status: 'active',
          provider: 'Netflix, Inc.',
          notificationDays: 5
        },
        {
          id: uuidv4(),
          name: 'Spotify',
          description: 'Music streaming',
          amount: 9.99,
          currency: 'USD',
          category: 'Entertainment',
          billingCycle: 'monthly',
          nextBillingDate: '2023-12-10',
          autoRenew: true,
          status: 'active',
          provider: 'Spotify AB',
          notificationDays: 3
        }
      ];
      setSubscriptions(mockSubscriptions);
    }
  }, [user]);

  const addSubscription = async (subscription: Subscription): Promise<void> => {
    // In a real app, this would save to Firebase
    setSubscriptions(prev => [...prev, subscription]);
    return Promise.resolve();
  };

  const updateSubscription = async (subscription: Subscription): Promise<void> => {
    // In a real app, this would update in Firebase
    setSubscriptions(prev => 
      prev.map(s => s.id === subscription.id ? subscription : s)
    );
    return Promise.resolve();
  };

  const deleteSubscription = async (id: string): Promise<void> => {
    // In a real app, this would delete from Firebase
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    return Promise.resolve();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading: isLoading || isAuthLoading,
    isAuthLoading,
    login: signIn,
    signIn,
    signup: signUp,
    signUp,
    loginWithGoogle: () => Promise.resolve(),
    logout,
    transactions,
    stats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importXLS,
    fetchTransactionsFromFirebase,
    isLoading,
    budgets,
    budgetSummaries,
    addBudget,
    updateBudget,
    deleteBudget,
    themeMode,
    setThemeMode,
    clearData,
    refreshData,
    exportData,
    twoFactorEnabled,
    twoFactorSecret,
    twoFactorQRCode,
    generateTwoFactorSecret,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactorCode,
    // New subscription properties
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription
  };

  return (
    <FinanceContext.Provider value={value}>
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
