
// Modifying FinanceContext.tsx to fix the TypeScript error and remove Stripe functionality
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTransactionManager } from './useTransactionManager';
import { useAuthManager } from './useAuthManager';
import { useBudgetManager } from './useBudgetManager';
import { useThemeManager } from './useThemeManager';
import { DashboardStats, Budget, Transaction } from '@/types/finance';

interface FinanceContextProps {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
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
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const FinanceContext = createContext<FinanceContextProps | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    login, 
    signup, 
    loginWithGoogle, 
    logout 
  } = useAuthManager();
  
  const {
    transactions,
    stats,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importXLS,
    fetchTransactionsFromFirebase
  } = useTransactionManager(user);
  
  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetManager(user);
  
  const {
    themeMode,
    setThemeMode
  } = useThemeManager();

  return (
    <FinanceContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        signup,
        loginWithGoogle,
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
        addBudget,
        updateBudget,
        deleteBudget,
        themeMode,
        setThemeMode
      }}
    >
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
