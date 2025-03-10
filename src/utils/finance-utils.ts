import { v4 as uuidv4 } from 'uuid';
import { 
  Transaction, 
  DashboardStats, 
  CategorySummary, 
  AccountSummary,
  MonthlyData
} from '@/types/finance';

// Colors for category charts
const categoryColors = [
  '#9b87f5', '#7E69AB', '#6E59A5', '#1A1F2C', '#D6BCFA',
  '#F2FCE2', '#FEF7CD', '#FEC6A1', '#E5DEFF', '#FFDEE2',
  '#FDE1D3', '#D3E4FD', '#F1F0FB'
];

// Parse CSV content and return array of transactions
export const parseCSV = (csvContent: string): Transaction[] => {
  const lines = csvContent.trim().split('\n');
  
  // Skip header row if present, detect by checking if first row contains headers
  const firstRowItems = lines[0].split(',').map(item => item.trim().toLowerCase());
  const skipHeader = firstRowItems.some(item => 
    ['account', 'category', 'amount', 'type', 'payment_type', 'note', 'date'].includes(item)
  );
  
  const startIndex = skipHeader ? 1 : 0;
  
  // Parse remaining rows
  return lines.slice(startIndex).map(line => {
    const [account, category, amount, type, payment_type, note, date] = line.split(',').map(item => item.trim());
    
    // Basic validation
    if (!account || !category || !amount || !type || !payment_type || !date) {
      throw new Error(`Invalid CSV row: ${line}`);
    }
    
    return {
      id: uuidv4(),
      account,
      category,
      amount: parseFloat(amount),
      type: type as 'Income' | 'Expense',
      payment_type: payment_type as 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH',
      note: note || '',
      date: date
    };
  });
};

// Calculate summary statistics from transactions
export const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;
  
  // Group by category for expense categories
  const expensesByCategory = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
  // Create category summaries with percentages and colors
  const byCategory: CategorySummary[] = Object.entries(expensesByCategory)
    .map(([category, total], index) => ({
      category,
      total,
      percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      color: categoryColors[index % categoryColors.length]
    }))
    .sort((a, b) => b.total - a.total);
    
  // Group by account
  const totalsByAccount = transactions.reduce((acc, t) => {
    acc[t.account] = (acc[t.account] || 0) + (t.type === 'Income' ? t.amount : -t.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const totalAccountsSum = Object.values(totalsByAccount)
    .reduce((sum, value) => sum + Math.abs(value), 0);
    
  const byAccount: AccountSummary[] = Object.entries(totalsByAccount)
    .map(([account, total]) => ({
      account,
      total,
      percentage: totalAccountsSum > 0 ? (Math.abs(total) / totalAccountsSum) * 100 : 0
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    
  // Group by month
  const byMonth: MonthlyData[] = groupTransactionsByMonth(transactions);
  
  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  return {
    totalIncome,
    totalExpense,
    balance,
    byCategory,
    byAccount,
    byMonth,
    recentTransactions
  };
};

// Helper to group transactions by month
function groupTransactionsByMonth(transactions: Transaction[]): MonthlyData[] {
  const monthlyData: Record<string, { income: number; expense: number; month: string }> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { 
        income: 0, 
        expense: 0,
        month: monthYear 
      };
    }
    
    if (t.type === 'Income') {
      monthlyData[monthYear].income += t.amount;
    } else {
      monthlyData[monthYear].expense += t.amount;
    }
  });
  
  return Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Format currency with proper locale
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date for consistent display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Generate example CSV data for demonstration
export const getExampleCSV = (): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const formatDateForCSV = (date: Date): string => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  return `account,category,amount,type,payment_type,note,date
Bank Account,Salary,3000,Income,TRANSFER,Monthly salary,${formatDateForCSV(today)}
Credit Card,Groceries,120.50,Expense,CREDIT_CARD,Weekly shopping,${formatDateForCSV(yesterday)}
Cash,Entertainment,45.99,Expense,CASH,Movie tickets,${formatDateForCSV(yesterday)}
Bank Account,Rent,1200,Expense,TRANSFER,Monthly rent,${formatDateForCSV(lastWeek)}
Savings,Investment,500,Expense,TRANSFER,Stock purchase,${formatDateForCSV(lastWeek)}`;
};
