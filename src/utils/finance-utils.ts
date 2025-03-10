
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
  const results: Transaction[] = [];
  
  // Skip header row if present, detect by checking if first row contains headers
  const firstRowItems = lines[0].split(',').map(item => item.trim().toLowerCase());
  const skipHeader = firstRowItems.some(item => 
    ['account', 'category', 'amount', 'type', 'payment_type', 'note', 'date'].includes(item)
  );
  
  const startIndex = skipHeader ? 1 : 0;
  let errors: string[] = [];
  
  // Parse remaining rows
  for (let i = startIndex; i < lines.length; i++) {
    try {
      // Handle quoted values with commas inside
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }
      
      const values: string[] = [];
      let insideQuote = false;
      let currentValue = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue.trim());
      
      // Remove quotes from values if present
      const cleanedValues = values.map(val => val.replace(/^"|"$/g, ''));
      
      if (cleanedValues.length < 6) {
        let errorMessage = `Row ${i + 1}: Insufficient columns (expected at least 6, got ${cleanedValues.length})`;
        
        // Add more context to help the user find the problem
        errorMessage += ` | Raw data: ${line.substring(0, 40)}${line.length > 40 ? '...' : ''}`;
        
        // Check for common problems
        if (line.includes('"') && line.split('"').length % 2 !== 1) {
          errorMessage += " | Possible issue: Unmatched quotes in this row.";
        }
        
        errors.push(errorMessage);
        continue;
      }
      
      const [account, category, amountStr, typeStr, payment_type, note, dateStr] = cleanedValues;
      
      // Basic validation
      if (!account || !category || !amountStr) {
        const missingFields = [];
        if (!account) missingFields.push('account');
        if (!category) missingFields.push('category');
        if (!amountStr) missingFields.push('amount');
        
        errors.push(
          `Row ${i + 1}: Missing required fields (${missingFields.join(', ')}) | Raw data: ${line.substring(0, 40)}${line.length > 40 ? '...' : ''}`
        );
        continue;
      }
      
      // Parse amount (handle negative values for expenses if needed)
      // Support for various number formats (commas, parentheses for negative)
      let amountNormalized = amountStr
        .replace(/\(([^)]+)\)/, '-$1') // Convert (123.45) to -123.45
        .replace(/,/g, ''); // Remove thousands separators
      
      let amount = parseFloat(amountNormalized);
      
      if (isNaN(amount)) {
        errors.push(`Row ${i + 1}: Invalid amount format "${amountStr}" | Raw data: ${line.substring(0, 40)}${line.length > 40 ? '...' : ''}`);
        continue;
      }
      
      // Convert amount to positive for proper type handling
      let type: 'Income' | 'Expense' = 'Expense';
      if (typeStr) {
        // More flexible type detection
        const normalizedType = typeStr.toLowerCase().trim();
        if (['income', 'revenue', 'deposit', 'credit'].includes(normalizedType)) {
          type = 'Income';
          amount = Math.abs(amount);
        } else if (['expense', 'expenses', 'payment', 'debit', 'withdrawal'].includes(normalizedType)) {
          type = 'Expense';
          amount = Math.abs(amount);
        } else {
          // Use the sign of the amount to determine type if type field is unclear
          if (amount < 0) {
            type = 'Expense';
            amount = Math.abs(amount);
          } else {
            type = 'Income';
          }
          errors.push(`Row ${i + 1}: Unclear transaction type "${typeStr}", using ${type} based on amount sign`);
        }
      } else {
        // Use the sign of the amount as fallback
        if (amount < 0) {
          type = 'Expense';
          amount = Math.abs(amount);
        }
      }
      
      // Validate payment type
      const validPaymentTypes = ['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'CASH'];
      let normalizedPaymentType = payment_type.toUpperCase().trim().replace(/ /g, '_');
      
      // Handle common variations
      if (normalizedPaymentType === 'DEBIT') normalizedPaymentType = 'DEBIT_CARD';
      if (normalizedPaymentType === 'CREDIT') normalizedPaymentType = 'CREDIT_CARD';
      if (['BANK', 'WIRE', 'ACH'].includes(normalizedPaymentType)) normalizedPaymentType = 'TRANSFER';
      
      if (!validPaymentTypes.includes(normalizedPaymentType)) {
        errors.push(`Row ${i + 1}: Invalid payment type "${payment_type}" (using TRANSFER as default)`);
        normalizedPaymentType = 'TRANSFER';
      }
      
      // Parse date or use current date as fallback
      let date = new Date();
      let dateParseError = false;
      
      if (dateStr) {
        // Try multiple date formats
        const dateToParse = dateStr.trim();
        const formats = [
          // ISO format
          /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/,
          // US format
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
          // European format
          /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
        ];
        
        let parsed = false;
        
        // Try direct Date parsing first
        const directParse = new Date(dateToParse);
        if (!isNaN(directParse.getTime())) {
          date = directParse;
          parsed = true;
        }
        
        // Try regex formats if direct parse failed
        if (!parsed) {
          for (const regex of formats) {
            const match = dateToParse.match(regex);
            if (match) {
              let year, month, day, hours = 0, minutes = 0, seconds = 0;
              
              if (regex === formats[0]) { // ISO
                [, year, month, day, hours, minutes, seconds] = match.map(v => v ? parseInt(v, 10) : 0);
              } else if (regex === formats[1]) { // US
                [, month, day, year, hours, minutes, seconds] = match.map(v => v ? parseInt(v, 10) : 0);
              } else { // European
                [, day, month, year, hours, minutes, seconds] = match.map(v => v ? parseInt(v, 10) : 0);
              }
              
              // JavaScript months are 0-indexed
              date = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
              parsed = true;
              break;
            }
          }
        }
        
        if (!parsed || isNaN(date.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}" (using current date as default)`);
          date = new Date();
          dateParseError = true;
        }
      }
      
      // Create transaction object
      results.push({
        id: uuidv4(),
        account,
        category,
        amount,
        type,
        payment_type: validPaymentTypes.includes(normalizedPaymentType) 
          ? normalizedPaymentType as any 
          : 'TRANSFER',
        note: note || '',
        date: dateParseError ? new Date().toISOString().slice(0, 19).replace('T', ' ')
             : date.toISOString().slice(0, 19).replace('T', ' ')
      });
    } catch (error) {
      errors.push(`Error processing row ${i + 1}: ${(error as Error).message}`);
    }
  }
  
  // If we have errors but also some valid data, we proceed but return the errors
  if (errors.length > 0) {
    console.error('CSV import warnings:', errors);
    // Store errors in sessionStorage for display
    sessionStorage.setItem('csvImportErrors', JSON.stringify(errors));
  }
  
  return results;
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
Credit Card,"Groceries, Food",120.50,Expense,CREDIT_CARD,Weekly shopping,${formatDateForCSV(yesterday)}
Cash,"Entertainment",45.99,Expense,CASH,Movie tickets,${formatDateForCSV(yesterday)}
Bank Account,Rent,1200,Expense,TRANSFER,Monthly rent,${formatDateForCSV(lastWeek)}
Savings,Investment,500,Expense,TRANSFER,Stock purchase,${formatDateForCSV(lastWeek)}`;
};

// Analyze CSV format to try to detect column positions
export const analyzeCSVFormat = (csvContent: string): { 
  detectedFormat: boolean;
  columnMap: Record<string, number>;
  headerRow?: string;
  suggestedCorrections?: string;
} => {
  // If empty content, return default mapping
  if (!csvContent.trim()) {
    return {
      detectedFormat: false,
      columnMap: {},
      suggestedCorrections: "CSV content is empty."
    };
  }
  
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) {
    return {
      detectedFormat: false,
      columnMap: {},
      suggestedCorrections: "CSV content is empty."
    };
  }
  
  // Try to detect header
  const headerRow = lines[0];
  const headerColumns = headerRow.toLowerCase()
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Expected column names and their possible variations
  const expectedColumns = {
    account: ['account', 'bank', 'source', 'from', 'account name'],
    category: ['category', 'categories', 'type', 'spending category'],
    amount: ['amount', 'sum', 'value', 'price', 'cost', 'balance'],
    type: ['transaction type', 'type', 'direction', 'income/expense', 'in/out', 'flow'],
    payment_type: ['payment type', 'payment method', 'method', 'payment', 'medium'],
    note: ['note', 'notes', 'description', 'memo', 'details', 'comment'],
    date: ['date', 'time', 'transaction date', 'datetime', 'when']
  };
  
  const columnMap: Record<string, number> = {};
  let detectedFormat = false;
  
  // Try to map columns based on header
  for (const [key, variations] of Object.entries(expectedColumns)) {
    const foundIndex = headerColumns.findIndex(h => 
      variations.some(v => h.includes(v))
    );
    
    if (foundIndex !== -1) {
      columnMap[key] = foundIndex;
      detectedFormat = true;
    }
  }
  
  // If no format detected from header, try to analyze the first data row
  if (!detectedFormat && lines.length > 1) {
    const firstDataRow = lines[1];
    const firstDataValues = parseCsvLine(firstDataRow);
    
    // Try to detect date columns
    const potentialDateColumns = firstDataValues
      .map((val, idx) => ({ value: val, index: idx }))
      .filter(({ value }) => {
        // Check for date-like formats
        return /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(value) || 
               /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
      });
    
    if (potentialDateColumns.length > 0) {
      columnMap['date'] = potentialDateColumns[0].index;
    }
    
    // Try to detect amount columns
    const potentialAmountColumns = firstDataValues
      .map((val, idx) => ({ value: val, index: idx }))
      .filter(({ value }) => {
        // Check for currency/amount-like formats
        return /^-?\$?\d+(\.\d+)?$/.test(value.replace(',', '')) || 
               /^-?\d+(\.\d+)?$/.test(value.replace(',', ''));
      });
    
    if (potentialAmountColumns.length > 0) {
      columnMap['amount'] = potentialAmountColumns[0].index;
    }
  }
  
  // Generate suggestions if format detection is incomplete
  let suggestedCorrections = undefined;
  const missingColumns = Object.keys(expectedColumns).filter(k => !(k in columnMap));
  
  if (missingColumns.length > 0) {
    suggestedCorrections = "Detected CSV format is incomplete. ";
    
    if (missingColumns.length === Object.keys(expectedColumns).length) {
      suggestedCorrections += "Could not identify any column headers. Ensure the CSV has a header row with these columns: account, category, amount, type, payment_type, note, date.";
    } else {
      suggestedCorrections += `Missing columns: ${missingColumns.join(', ')}. Consider adding these columns or renaming existing ones.`;
    }
  }
  
  return {
    detectedFormat,
    columnMap,
    headerRow,
    suggestedCorrections
  };
};

// Helper function to parse a CSV line handling quoted values with commas
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let insideQuote = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue.trim());
  return values.map(val => val.replace(/^"|"$/g, ''));
}

// Validate a single transaction object
export const validateTransaction = (transaction: Partial<Transaction>): { 
  valid: boolean; 
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!transaction.account || transaction.account.trim() === '') {
    errors.push('Account is required');
  }
  
  if (!transaction.category || transaction.category.trim() === '') {
    errors.push('Category is required');
  }
  
  if (transaction.amount === undefined || isNaN(transaction.amount)) {
    errors.push('Amount must be a valid number');
  }
  
  if (transaction.type !== 'Income' && transaction.type !== 'Expense') {
    errors.push('Type must be either "Income" or "Expense"');
  }
  
  const validPaymentTypes = ['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'CASH'];
  if (!transaction.payment_type || !validPaymentTypes.includes(transaction.payment_type)) {
    errors.push(`Payment type must be one of: ${validPaymentTypes.join(', ')}`);
  }
  
  if (transaction.date) {
    const dateObj = new Date(transaction.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Date must be a valid date format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

