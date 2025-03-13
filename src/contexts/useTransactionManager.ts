
import { useState, useEffect } from 'react';
import { Transaction, DashboardStats } from '@/types/finance';
import { calculateDashboardStats } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { 
  saveTransaction, 
  updateTransactionDoc, 
  deleteTransactionDoc, 
  fetchTransactions,
  saveTransactionsBatch
} from './firebaseService';
import { 
  getTransactionsFromLocalStorage, 
  saveTransactionsToLocalStorage 
} from './localStorageService';

const initialStats: DashboardStats = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  byCategory: [],
  byAccount: [],
  byMonth: [],
  recentTransactions: []
};

export const useTransactionManager = (user: any) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchTransactionsFromFirebase();
    } else {
      const savedTransactions = getTransactionsFromLocalStorage();
      if (savedTransactions.length > 0) {
        setTransactions(savedTransactions);
        setStats(calculateDashboardStats(savedTransactions));
      }
    }
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      if (!user) {
        saveTransactionsToLocalStorage(transactions);
      }
      setStats(calculateDashboardStats(transactions));
    }
  }, [transactions, user]);

  const fetchTransactionsFromFirebase = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fetchedTransactions = await fetchTransactions(user.uid);
      setTransactions(fetchedTransactions);
      setStats(calculateDashboardStats(fetchedTransactions));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load transactions from Firebase: " + error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importXLS = async (file: File, transactions: Transaction[]) => {
    setIsLoading(true);
    try {
      if (transactions.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid transactions found in the XLS file",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // For testing, let's import only 4 transactions
      const newTransactions = transactions.slice(0, 1000);

      if (user) {
        await saveTransactionsBatch(user.uid, newTransactions);
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      
      toast({
        title: "Import Successful",
        description: `Imported ${newTransactions.length} transactions from XLS`
      });
    } catch (error: any) {
      console.error('Error importing XLS:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to parse XLS file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        await saveTransaction(user.uid, transaction);
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => [...prev, transaction]);
      }
      
      toast({ 
        title: "Transaction Added", 
        description: "Your transaction has been successfully added" 
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ 
        title: "Error", 
        description: "Failed to add transaction: " + error.message, 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      if (user) {
        await updateTransactionDoc(user.uid, transaction);
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
      }
      
      toast({ 
        title: "Transaction Updated", 
        description: "Your transaction has been updated" 
      });
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update transaction: " + error.message, 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      if (user) {
        await deleteTransactionDoc(user.uid, id);
        await fetchTransactionsFromFirebase();
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
      
      toast({ 
        title: "Transaction Deleted", 
        description: "Transaction has been removed" 
      });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete transaction: " + error.message, 
        variant: "destructive" 
      });
      throw error;
    }
  };

  // Add the missing functions that were in the error messages
  const clearData = () => {
    setTransactions([]);
    setStats(initialStats);
    saveTransactionsToLocalStorage([]);
    toast({ 
      title: "Data Cleared", 
      description: "All transaction data has been cleared" 
    });
  };

  const refreshData = async () => {
    if (user) {
      await fetchTransactionsFromFirebase();
      toast({ 
        title: "Data Refreshed", 
        description: "Your transaction data has been refreshed" 
      });
    } else {
      toast({ 
        title: "Not Logged In", 
        description: "Please log in to refresh your data", 
        variant: "destructive" 
      });
    }
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(transactions);
      toast({ 
        title: "Data Exported", 
        description: "Your transaction data has been exported" 
      });
      return dataStr;
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({ 
        title: "Export Failed", 
        description: "Failed to export data: " + error.message, 
        variant: "destructive" 
      });
      return "";
    }
  };

  return {
    transactions,
    stats,
    isLoading,
    setTransactions,
    setStats,
    fetchTransactionsFromFirebase,
    importXLS,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearData,
    refreshData,
    exportData
  };
};
