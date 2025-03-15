
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
  imageAttachments?: string[]; // New field for image attachments
  notes_detailed?: string; // New field for detailed notes
  splitWith?: SplitParticipant[]; // For expense splitting
  merchant?: string;
  createdAt?: any;
  updatedAt?: any;
}

// New interfaces for expense splitting
export interface SplitParticipant {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  email?: string;
}

// Budget definitions
export interface Budget {
  id: string;
  category: string;
  name?: string;
  amount: number;
  period: 'weekly' | 'bi-weekly' | 'monthly' | 'yearly' | 'custom';
  createdAt?: any;
  updatedAt?: any;
  color?: string;
  cycleStart?: string;
  cycleLength?: number;
}

export interface BudgetSummary {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

// Subscription tracker type
export interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  autoRenew: boolean;
  status: 'active' | 'paused' | 'canceled';
  provider: string;
  notes?: string;
  color?: string;
  notificationDays?: number; // Days before to notify
  createdAt?: any;
  updatedAt?: any;
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
  total?: number;
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
