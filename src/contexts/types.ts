
import { Budget, BudgetSummary, DashboardStats, Transaction } from '@/types/finance';
import { User as FirebaseUser } from 'firebase/auth';

export interface FinanceContextType {
  transactions: Transaction[];
  stats: DashboardStats | null;
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  importXLS: (file: File, transactions: Transaction[]) => Promise<void>;
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
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  subscription: {
    id: string;
    name: string;
    status: 'active' | 'canceled' | 'past_due' | null;
    renewalDate: Date | null;
  } | null;
  hasFeatureAccess: (featureName: string) => boolean;
}
