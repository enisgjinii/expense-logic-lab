
/**
 * Finance utility functions for data calculation and formatting
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  Transaction, 
  DashboardStats, 
  CategorySummary, 
  AccountSummary, 
  MonthlyData 
} from '@/types/finance';
import * as XLSX from 'xlsx';

// Default currency formatting
const defaultCurrency = 'USD';
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: defaultCurrency,
  minimumFractionDigits: 2
});

/**
 * Format a number as currency
 * @param amount Number to format as currency
 * @param currency Currency code (defaults to USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = defaultCurrency): string => {
  try {
    return currencyFormatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Format a date string
 * @param dateString Date string to format
 * @param format Format to use (default: 'medium')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  try {
    const date = new Date(dateString);
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'medium':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Get color for a category based on its name (consistent colors)
 */
export const getCategoryColor = (categoryName: string): string => {
  // List of colors for categories
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', 
    '#66BB6A', '#7E57C2', '#EC407A', '#5C6BC0',
    '#26A69A', '#FFD54F', '#F06292', '#9CCC65'
  ];
  
  // Generate a consistent index based on the category name
  const index = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return colors[index];
};

/**
 * Get a gradient color based on percentage (red to green)
 * @param percentage Value between 0 and 100
 * @returns CSS color string
 */
export const getGradientColor = (percentage: number): string => {
  // Convert percentage to a value between 0 and 1
  const value = Math.max(0, Math.min(100, percentage)) / 100;
  
  // Calculate RGB components
  const r = Math.round(255 * (1 - value));
  const g = Math.round(255 * value);
  const b = 80;
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Parse an XLS file and extract transactions
 * @param data File data as ArrayBuffer
 * @returns Extracted transactions
 */
export const parseXLS = (data: ArrayBuffer): Transaction[] => {
  try {
    // Parse the XLS file
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet);
    
    // Track errors
    const errors: string[] = [];
    
    // Map to transactions
    const transactions: Transaction[] = rows.map((row: any, index: number) => {
      // Validate required fields
      const requiredFields = ['account', 'category', 'amount', 'type', 'date'];
      for (const field of requiredFields) {
        if (!row[field]) {
          const error = `Row ${index + 2}: Missing required field '${field}'`;
          errors.push(error);
          console.error(error);
        }
      }
      
      // Process the row into a transaction
      const transaction: Transaction = {
        id: uuidv4(),
        account: row.account || 'Unknown Account',
        category: row.category || 'Uncategorized',
        amount: parseFloat(row.amount) || 0,
        type: row.type && ['Income', 'Expense'].includes(row.type) ? row.type : 'Expense',
        date: row.date || new Date().toISOString(),
        description: row.description || '',
        currency: row.currency || 'USD',
        payment_type: row.payment_type || 'TRANSFER',
        notes: row.notes || row.note || '',
        payee: row.payee || '',
      };
      
      return transaction;
    });
    
    // Store errors in session storage for the UI to display
    if (errors.length > 0) {
      sessionStorage.setItem('xlsImportErrors', JSON.stringify(errors));
    }
    
    return transactions;
  } catch (error) {
    console.error('Error parsing XLS file:', error);
    throw new Error('Failed to parse XLS file. Please check the file format.');
  }
};

/**
 * Calculate dashboard statistics from transactions
 * @param transactions List of transactions
 * @returns Dashboard statistics
 */
export const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
  try {
    // Calculate income and expense totals
    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    // Group by category
    const categories = transactions
      .filter(t => t.type === 'Expense')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
    
    // Calculate category percentages and create summaries
    const categoryEntries = Object.entries(categories);
    const totalCategoryAmount = categoryEntries.reduce((sum, [_, amount]) => sum + amount, 0);
    
    const byCategory: CategorySummary[] = categoryEntries
      .map(([category, total]) => {
        const percentage = totalCategoryAmount > 0 ? (total / totalCategoryAmount) * 100 : 0;
        return {
          category,
          total,
          percentage,
          color: getCategoryColor(category)
        };
      })
      .sort((a, b) => b.total - a.total);
    
    // Group by account
    const accounts = transactions.reduce((acc: Record<string, number>, t) => {
      const amount = t.type === 'Income' ? t.amount : -t.amount;
      acc[t.account] = (acc[t.account] || 0) + amount;
      return acc;
    }, {});
    
    // Calculate account percentages and create summaries
    const accountEntries = Object.entries(accounts);
    const totalAccountBalance = accountEntries.reduce((sum, [_, balance]) => sum + Math.max(0, balance), 0);
    
    const byAccount: AccountSummary[] = accountEntries
      .map(([account, balance]) => {
        const percentage = totalAccountBalance > 0 ? (Math.max(0, balance) / totalAccountBalance) * 100 : 0;
        return {
          account,
          balance,
          total: balance,
          percentage,
          color: getCategoryColor(account)
        };
      })
      .sort((a, b) => b.balance - a.balance);
    
    // Group by month
    const months: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'Income') {
        months[monthKey].income += t.amount;
      } else if (t.type === 'Expense') {
        months[monthKey].expense += t.amount;
      }
    });
    
    // Create monthly data summaries
    const byMonth: MonthlyData[] = Object.entries(months)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Get recent transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    return {
      totalIncome,
      totalExpense,
      balance,
      byCategory,
      byAccount,
      byMonth,
      recentTransactions
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      byCategory: [],
      byAccount: [],
      byMonth: [],
      recentTransactions: []
    };
  }
};
