
import React, { createContext, useContext } from 'react';
import { FinanceContextType } from './types';
import { clearUserData } from './firebaseService';
import { clearLocalStorage } from './localStorageService';
import { useAuthManager } from './useAuthManager';
import { useTransactionManager } from './useTransactionManager';
import { useBudgetManager } from './useBudgetManager';
import { useThemeManager } from './useThemeManager';
import { toast } from '@/components/ui/use-toast';
import { getCurrentSubscription } from '@/services/stripeService';

const initialContextValue: FinanceContextType = {} as FinanceContextType;
const FinanceContext = createContext<FinanceContextType>(initialContextValue);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User authentication
  const { user, isAuthLoading, signIn, signUp, logout } = useAuthManager();
  
  // Transaction management
  const { 
    transactions, 
    stats, 
    isLoading, 
    importXLS, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    fetchTransactionsFromFirebase,
    setTransactions,
    setStats
  } = useTransactionManager(user);
  
  // Budget management
  const { 
    budgets, 
    budgetSummaries, 
    addBudget, 
    updateBudget, 
    deleteBudget,
    setBudgets,
    fetchBudgetsFromFirebase
  } = useBudgetManager(user, transactions);
  
  // Theme management
  const { themeMode, setThemeMode } = useThemeManager();

  // Subscription management
  const [subscription, setSubscription] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Check subscription status on context initialization
    setSubscription(getCurrentSubscription());
  }, []);

  // Feature access based on subscription
  const hasFeatureAccess = (featureName: string): boolean => {
    const currentSub = getCurrentSubscription();
    
    // If no active subscription, only allow basic features
    if (!currentSub?.status === 'active') {
      // Allow basic features for everyone
      const basicFeatures = ['basic_reports', 'transactions_basic'];
      return basicFeatures.includes(featureName);
    }
    
    // Feature access based on subscription level
    if (currentSub.name === 'Basic') {
      return ['basic_reports', 'transactions_basic', 'email_support'].includes(featureName);
    }
    
    if (currentSub.name === 'Premium') {
      return ['basic_reports', 'transactions_basic', 'email_support', 
              'advanced_reports', 'unlimited_transactions', 'data_export', 
              'priority_support'].includes(featureName);
    }
    
    if (currentSub.name === 'Business') {
      // Business has access to all features
      return true;
    }
    
    return false;
  };

  // Clear all data
  const clearData = async () => {
    if (user) {
      try {
        await clearUserData(user.uid);
        setTransactions([]);
        setBudgets([]);
        toast({ title: "Data Cleared", description: "All financial data has been removed from Firebase" });
      } catch (error: any) {
        console.error('Error clearing Firebase data:', error);
        toast({ 
          title: "Error", 
          description: "Failed to clear data from Firebase: " + error.message, 
          variant: "destructive" 
        });
      }
    } else {
      setTransactions([]);
      setBudgets([]);
      clearLocalStorage();
      toast({ title: "Data Cleared", description: "All financial data has been removed" });
    }
  };

  // Refresh data
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
          toast({ title: "Data Refreshed", description: "Local data has been refreshed" });
        } else {
          toast({ title: "No Data", description: "No local data available" });
        }
      }
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({ 
        title: "Error", 
        description: "Failed to refresh data: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  // Export data
  const exportData = () => {
    try {
      const data = { transactions, budgets };
      return JSON.stringify(data, null, 2);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({ 
        title: "Error", 
        description: "Failed to export data: " + error.message, 
        variant: "destructive" 
      });
      return "";
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
      setThemeMode,
      subscription: getCurrentSubscription(),
      hasFeatureAccess
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
