import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTransactionManager } from './useTransactionManager';
import { useAuthManager } from './useAuthManager';
import { useBudgetManager } from './useBudgetManager';
import { useThemeManager } from './useThemeManager';
import { DashboardStats, Budget, Transaction, BudgetSummary } from '@/types/finance';

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
    verifyTwoFactorCode
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
