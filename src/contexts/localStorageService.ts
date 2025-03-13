
import { Transaction, Budget, DashboardStats } from '@/types/finance';
import { calculateDashboardStats } from '@/utils/finance-utils';

const getStoragePrefix = () => import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'financeTracker';

export const saveTransactionsToLocalStorage = (transactions: Transaction[]) => {
  localStorage.setItem(`${getStoragePrefix()}Data`, JSON.stringify(transactions));
};

export const saveBudgetsToLocalStorage = (budgets: Budget[]) => {
  localStorage.setItem(`${getStoragePrefix()}Budgets`, JSON.stringify(budgets));
};

export const getTransactionsFromLocalStorage = (): Transaction[] => {
  const savedData = localStorage.getItem(`${getStoragePrefix()}Data`);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (error) {
      console.error('Error loading saved transactions:', error);
      return [];
    }
  }
  return [];
};

export const getBudgetsFromLocalStorage = (): Budget[] => {
  const savedBudgets = localStorage.getItem(`${getStoragePrefix()}Budgets`);
  if (savedBudgets) {
    try {
      return JSON.parse(savedBudgets);
    } catch (error) {
      console.error('Error loading saved budgets:', error);
      return [];
    }
  }
  return [];
};

export const getStatsFromLocalStorage = (): DashboardStats | null => {
  const transactions = getTransactionsFromLocalStorage();
  if (transactions.length > 0) {
    return calculateDashboardStats(transactions);
  }
  return null;
};

export const clearLocalStorage = () => {
  localStorage.removeItem(`${getStoragePrefix()}Data`);
  localStorage.removeItem(`${getStoragePrefix()}Budgets`);
};

export const saveThemeMode = (mode: "light" | "dark" | "system") => {
  localStorage.setItem("themeMode", mode);
};

export const getThemeMode = (): "light" | "dark" | "system" => {
  return (localStorage.getItem("themeMode") as "light" | "dark" | "system") || "system";
};
