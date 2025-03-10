
export type TransactionType = 'Income' | 'Expense';

export type PaymentType = 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH';

export interface Transaction {
  id: string;
  account: string;
  category: string;
  amount: number;
  type: TransactionType;
  payment_type: PaymentType;
  note: string;
  date: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface AccountSummary {
  account: string;
  total: number;
  percentage: number;
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

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: string;
}

export interface BudgetSummary {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
