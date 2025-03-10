
import { Transaction, TransactionType, PaymentType, DashboardStats, CategorySummary, AccountSummary, MonthlyData } from '@/types/finance';
import { format, parseISO, getMonth, getYear } from 'date-fns';

// Generate random colors for categories
const generateColor = (): string => {
  const colors = [
    '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12', 
    '#1abc9c', '#d35400', '#c0392b', '#8e44ad', '#16a085',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#34495e',
    '#4834d4', '#6ab04c', '#be2edd', '#eb4d4b', '#f0932b'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Parse CSV data into transactions
export const parseCSV = (csvContent: string): Transaction[] => {
  const lines = csvContent.trim().split('\n');
  
  // Skip header row if present
  const startIndex = lines[0].toLowerCase().includes('account') ? 1 : 0;
  
  return lines.slice(startIndex).map((line, index) => {
    const values = line.split(',').map(value => value.trim());
    
    if (values.length < 6) {
      console.error(`Line ${index + startIndex + 1} has fewer than expected columns:`, line);
      return null;
    }
    
    const [account, category, amountStr, type, payment_type, note, dateStr] = values;
    
    // Validate transaction type
    const validType = type === 'Income' || type === 'Expense' 
      ? type as TransactionType
      : 'Expense';
    
    // Validate payment type
    const validPaymentType = ['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'CASH'].includes(payment_type)
      ? payment_type as PaymentType
      : 'CASH';

    // Attempt to parse amount, defaulting to 0 if invalid
    const amount = parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;

    return {
      id: `tx-${Date.now()}-${index}`,
      account,
      category,
      amount,
      type: validType,
      payment_type: validPaymentType,
      note,
      date: dateStr || new Date().toISOString()
    };
  }).filter(Boolean) as Transaction[];
};

// Format currency amounts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date strings
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

// Calculate dashboard statistics
export const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
  // Calculate income and expense totals
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;
  
  // Group by category (for expenses only)
  const expensesByCategory = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      const existing = acc.find(c => c.category === t.category);
      if (existing) {
        existing.total += t.amount;
      } else {
        acc.push({
          category: t.category,
          total: t.amount,
          percentage: 0, // Will calculate after
          color: generateColor()
        });
      }
      return acc;
    }, [] as CategorySummary[]);
  
  // Calculate percentages
  if (totalExpense > 0) {
    expensesByCategory.forEach(cat => {
      cat.percentage = (cat.total / totalExpense) * 100;
    });
  }
  
  // Sort categories by total (descending)
  expensesByCategory.sort((a, b) => b.total - a.total);
  
  // Group by account
  const byAccount = transactions.reduce((acc, t) => {
    const existing = acc.find(a => a.account === t.account);
    const amount = t.type === 'Income' ? t.amount : -t.amount;
    
    if (existing) {
      existing.total += amount;
    } else {
      acc.push({
        account: t.account,
        total: amount,
        percentage: 0 // Will calculate after
      });
    }
    return acc;
  }, [] as AccountSummary[]);
  
  // Calculate percentages for accounts
  const totalAccountMovement = byAccount.reduce((sum, a) => sum + Math.abs(a.total), 0);
  if (totalAccountMovement > 0) {
    byAccount.forEach(acc => {
      acc.percentage = (Math.abs(acc.total) / totalAccountMovement) * 100;
    });
  }
  
  // Monthly data
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  
  transactions.forEach(t => {
    try {
      const date = parseISO(t.date);
      const key = `${getYear(date)}-${getMonth(date) + 1}`;
      const monthName = format(date, 'MMM yyyy');
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { 
          month: monthName, 
          income: 0, 
          expense: 0 
        });
      }
      
      const monthData = monthlyMap.get(key)!;
      if (t.type === 'Income') {
        monthData.income += t.amount;
      } else {
        monthData.expense += t.amount;
      }
    } catch (error) {
      console.error('Error parsing date:', t.date);
    }
  });
  
  // Convert to array and sort by month
  const byMonth = Array.from(monthlyMap.values()) as MonthlyData[];
  
  // Recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  return {
    totalIncome,
    totalExpense,
    balance,
    byCategory: expensesByCategory,
    byAccount,
    byMonth,
    recentTransactions
  };
};

// Export example/sample CSV content
export const getExampleCSV = (): string => {
  return `account,category,amount,type,payment_type,note,date
Bank of America,Salary,5000,Income,TRANSFER,Monthly salary,2025-03-01 09:00:00
Chase,Groceries,125.45,Expense,DEBIT_CARD,Weekly groceries,2025-03-03 14:30:15
Bank of America,Rent,1500,Expense,TRANSFER,Monthly rent,2025-03-05 10:00:00
Cash Wallet,Coffee,4.75,Expense,CASH,Morning coffee,2025-03-05 08:15:30
Chase,Dining,78.20,Expense,CREDIT_CARD,Dinner with friends,2025-03-06 19:45:22
Bank of America,Utilities,145.30,Expense,TRANSFER,Electricity bill,2025-03-07 09:17:42
Chase,Transportation,35.00,Expense,DEBIT_CARD,Uber rides,2025-03-07 18:22:10
Bank of America,Freelance,1200,Income,TRANSFER,Design project,2025-03-10 15:00:00
Cash Wallet,Snacks,7.50,Expense,CASH,Office snacks,2025-03-12 13:10:05
Chase,Shopping,89.99,Expense,CREDIT_CARD,New headphones,2025-03-15 11:30:45`;
};
