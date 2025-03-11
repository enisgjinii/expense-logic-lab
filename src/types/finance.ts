
// Transaction type definitions
export interface Transaction {
  id: string;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: number;
  currency: string;
  date: string;
  description: string;
  category: string;
  account: string;
  payment_type?: 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH';
  payee?: string;
  notes?: string;
  note?: string; // Adding for backward compatibility
  recurring?: boolean;
  interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  attachments?: string[];
  createdAt?: any;
  updatedAt?: any;
}

// Budget definitions
export interface Budget {
  id: string;
  category: string;
  name?: string; // Adding name property for budget
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  createdAt?: any;
  updatedAt?: any;
  color?: string;
}

export interface BudgetSummary {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

// Dashboard/Stats definitions
export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface AccountSummary {
  account: string;
  balance: number;
  percentage: number;
  color: string;
  total?: number; // Adding for compatibility with AccountsOverview
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categories?: CategorySummary[];
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: CategorySummary[];
  byAccount: AccountSummary[];
  byMonth: MonthlyData[];
  recentTransactions: Transaction[];
}

// Firebase types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// User settings
export interface UserSettings {
  themeMode: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  dateFormat: string;
  defaultAccount: string;
  defaultCategory: string;
  firebaseConfig?: FirebaseConfig;
}

// Export format types
export type ExportFormat = 'csv' | 'json' | 'xlsx';

// Import format types
export type ImportFormat = 'csv' | 'xls' | 'xlsx' | 'json';
