
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, DashboardStats } from '@/types/finance';
import { parseCSV, calculateDashboardStats } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';

interface FinanceContextType {
  transactions: Transaction[];
  stats: DashboardStats | null;
  isLoading: boolean;
  importCSV: (csvContent: string) => void;
  clearData: () => void;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  }, []);

  // Update localStorage and stats whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('financeTrackerData', JSON.stringify(transactions));
      setStats(calculateDashboardStats(transactions));
    }
  }, [transactions]);

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
    setStats(initialStats);
    localStorage.removeItem('financeTrackerData');
    toast({
      title: "Data Cleared",
      description: "All financial data has been removed",
    });
  };

  return (
    <FinanceContext.Provider value={{ 
      transactions, 
      stats, 
      isLoading, 
      importCSV, 
      clearData 
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
