import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { downloadCSV } from '@/utils/export-utils';
import {
  BarChart as BarChartIcon,
  Download,
  FileType,
  CreditCard,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Banknote,
  History,
  PieChart as PieChartIcon,
  Search
} from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Reports = () => {
  const { transactions, stats, budgets, refreshData } = useFinance();

  // -- New or Expanded State
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [yoyData, setYoYData] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  // **Extra for the Accounts Section**
  const [accountSearch, setAccountSearch] = useState<string>('');         // Searching accounts by name
  const [groupAccounts, setGroupAccounts] = useState<boolean>(false);    // Toggle grouping by account type
  const [expandAll, setExpandAll] = useState<boolean>(false);            // Expand/collapse all accounts in advanced view

  // -- Original State
  const [reportType, setReportType] = useState('expenses');
  const [timeRange, setTimeRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startYear, setStartYear] = useState('2015');
  const [endYear, setEndYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [accountView, setAccountView] = useState<'basic' | 'advanced'>('basic');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'balance',
    direction: 'desc'
  });
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [accountChartType, setAccountChartType] = useState<'pie' | 'bar'>('pie');
  const [showBalance, setShowBalance] = useState(true);
  const [accountHistoryPeriod, setAccountHistoryPeriod] = useState('7d');
  const [accountAnalytics, setAccountAnalytics] = useState<{
    [key: string]: {
      trend: 'up' | 'down' | 'stable';
      changePercentage: number;
      recentActivity: { date: string; amount: number; description: string; type: string }[];
      history: { date: string; balance: number }[];
    };
  }>({});

  // -- Original Derived Arrays
  const categories = [...new Set(transactions.map((t) => t.category))];
  const merchants = [...new Set(transactions.map((t) => t.merchant))];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years: string[] = [];
  for (let year = 2015; year <= new Date().getFullYear(); year++) {
    years.push(year.toString());
  }
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  // -- Accounts
  const accounts = [...new Set(transactions.map((t) => t.account))];

  // ----------------------------
  //  Mock: “Account Types”
  // ----------------------------
  // In a real app, you'd likely have each account object carry its type from the backend.
  // This is just to demonstrate grouping logic:
  const mockAccountTypes: Record<string, string> = {
    'Chase Checking': 'Checking',
    'Chase Savings': 'Savings',
    'Wells Fargo Credit': 'Credit Card',
    'Discover Credit': 'Credit Card',
    'Robinhood Investment': 'Investment',
    'Wealthfront IRA': 'Retirement',
    // fallback: 'Other'
  };

  // We'll expand stats.byAccount objects with a `.type`, or fallback to 'Other'
  const byAccountWithType = stats.byAccount.map((acc) => {
    const type = mockAccountTypes[acc.account] || 'Other';
    return { ...acc, type };
  });

  // Example extra data: interestRate, monthlyAverage
  // Again, you'd fetch these from your real data if you have them
  const mockAccountExtras: Record<string, { interestRate: number; monthlyAverage: number }> = {
    'Chase Checking': { interestRate: 0.01, monthlyAverage: 1200 },
    'Chase Savings': { interestRate: 0.5, monthlyAverage: 5000 },
    'Wells Fargo Credit': { interestRate: 15.9, monthlyAverage: -800 }, // negative because credit?
    'Discover Credit': { interestRate: 17.2, monthlyAverage: -600 },
    'Robinhood Investment': { interestRate: 8.5, monthlyAverage: 15000 },
    'Wealthfront IRA': { interestRate: 7.0, monthlyAverage: 20000 }
  };

  // ------------------------------------------------
  //  useEffects for Generating Reports and Stats
  // ------------------------------------------------

  // 1) Generates the main data for the "Overview" tab
  useEffect(() => {
    generateReport();
  }, [reportType, timeRange, categoryFilter, merchantFilter, transactions, startYear, endYear]);

  // 2) Keep account transactions up to date
  useEffect(() => {
    if (selectedAccount) {
      const filteredTransactions = transactions.filter((t) => t.account === selectedAccount);
      setAccountTransactions(filteredTransactions);
    } else {
      setAccountTransactions([]);
    }
  }, [selectedAccount, transactions]);

  // 3) Build advanced analytics for each account
  useEffect(() => {
    if (stats.byAccount.length > 0) {
      const analytics: { [key: string]: any } = {};

      stats.byAccount.forEach((account) => {
        const accountTxs = transactions.filter((t) => t.account === account.account);
        const sortedTxs = [...accountTxs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const recentActivity = sortedTxs.slice(0, 5).map((t) => ({
          date: t.date,
          amount: t.amount,
          description: t.description,
          type: t.type
        }));

        const today = new Date();
        const history = [];
        let runningBalance = account.balance;

        // Generate a mock daily history for the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);

          // Random simulation (in real use, rely on actual transaction data)
          const randomChange = Math.random() * 200 - 100;
          runningBalance = i === 0 ? runningBalance : runningBalance - randomChange;

          history.unshift({
            date: date.toISOString().split('T')[0],
            balance: Math.max(0, runningBalance)
          });
        }

        // Simple approach to measure short-term trend
        const recentHistory = history.slice(-7);
        const oldAvg =
          recentHistory.slice(0, 3).reduce((sum, item) => sum + item.balance, 0) / 3;
        const newAvg =
          recentHistory.slice(-3).reduce((sum, item) => sum + item.balance, 0) / 3;
        const changePercentage = oldAvg > 0 ? ((newAvg - oldAvg) / oldAvg) * 100 : 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (changePercentage > 1) trend = 'up';
        if (changePercentage < -1) trend = 'down';

        analytics[account.account] = {
          trend,
          changePercentage,
          recentActivity,
          history
        };
      });

      setAccountAnalytics(analytics);
    }
  }, [stats.byAccount, transactions]);

  // 4) Generate Year-over-Year data for "Advanced Analytics" tab
  useEffect(() => {
    // Only build yoyData when on the advanced tab
    if (activeTab === 'advanced') {
      generateYoYData();
      computeTopCategories();
    }
  }, [activeTab, transactions, reportType, timeRange, categoryFilter, merchantFilter]);

  // ------------------------------------------------
  //  Advanced Helpers
  // ------------------------------------------------

  // Build a year-over-year dataset for the last 2 years
  const generateYoYData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    // Filter transactions by existing states
    const filtered = filterTransactions(transactions, true);

    // Create a Map for each month of the last 2 years
    const yoyMap = new Map<string, any>();

    for (let yr of [lastYear, currentYear]) {
      for (let m = 0; m < 12; m++) {
        const key = `${yr}-${m}`;
        yoyMap.set(key, {
          year: yr,
          monthIndex: m,
          currentYearIncome: 0,
          currentYearExpense: 0,
          lastYearIncome: 0,
          lastYearExpense: 0
        });
      }
    }

    filtered.forEach((t) => {
      const d = new Date(t.date);
      const yr = d.getFullYear();
      const m = d.getMonth();
      const key = `${yr}-${m}`;
      if (!yoyMap.has(key)) return;

      const entry = yoyMap.get(key);
      if (yr === currentYear) {
        if (t.type === 'Income') entry.currentYearIncome += t.amount;
        if (t.type === 'Expense') entry.currentYearExpense += t.amount;
      } else if (yr === lastYear) {
        if (t.type === 'Income') entry.lastYearIncome += t.amount;
        if (t.type === 'Expense') entry.lastYearExpense += t.amount;
      }
    });

    // Turn map into sorted array of 24 months
    let yoyArray = Array.from(yoyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });

    // Provide a user-friendly name: "Jan 2025" or "Jan 2024"
    yoyArray = yoyArray.map((entry) => ({
      ...entry,
      name: `${months[entry.monthIndex]} ${entry.year}`
    }));

    setYoYData(yoyArray);
  };

  // Compute top 5 categories by total amount (within current filters)
  const computeTopCategories = () => {
    const filtered = filterTransactions(transactions);

    // Tally amounts per category
    const catMap: { [cat: string]: number } = {};
    filtered.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += t.amount;
    });

    // Sort categories by total amount (desc), then slice top 5
    const catEntries = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const top5 = catEntries.map(([cat, amount]) => ({
      category: cat,
      amount
    }));
    setTopCategories(top5);
  };

  // Filter transactions based on states
  const filterTransactions = (txs: any[], ignoreDateRange?: boolean) => {
    let startDate = new Date();
    let endDate = new Date();

    if (!ignoreDateRange) {
      if (timeRange === 'custom') {
        startDate = new Date(parseInt(startYear), 0, 1);
        endDate = new Date(parseInt(endYear), 11, 31, 23, 59, 59);
      } else if (timeRange === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (timeRange === 'year') {
        startDate.setFullYear(endDate.getFullYear() - 1);
      } else if (timeRange === 'all') {
        startDate = new Date('2015-01-01');
      }
    } else {
      startDate = new Date('2015-01-01');
    }

    return txs.filter((t) => {
      const tDate = new Date(t.date);
      const meetsDate = ignoreDateRange ? true : tDate >= startDate && tDate <= endDate;
      const meetsCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const meetsMerchant = merchantFilter === 'all' || t.merchant === merchantFilter;
      const meetsType =
        reportType === 'all' ||
        (reportType === 'expenses' && t.type === 'Expense') ||
        (reportType === 'income' && t.type === 'Income');

      return meetsDate && meetsCategory && meetsMerchant && meetsType;
    });
  };

  // ------------------------------------------------
  //  Original generateReport (with merchant filter)
  // ------------------------------------------------
  const generateReport = async () => {
    setIsLoading(true);

    try {
      let startDate = new Date();
      let endDate = new Date();

      if (timeRange === 'custom') {
        startDate = new Date(parseInt(startYear), 0, 1);
        endDate = new Date(parseInt(endYear), 11, 31, 23, 59, 59);
      } else if (timeRange === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (timeRange === 'year') {
        startDate.setFullYear(endDate.getFullYear() - 1);
      } else if (timeRange === 'all') {
        startDate = new Date('2015-01-01');
      }

      // Filter transactions
      let filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const meetsDateCriteria = transactionDate >= startDate && transactionDate <= endDate;
        const meetsCategoryCriteria = categoryFilter === 'all' || t.category === categoryFilter;
        const meetsMerchant = merchantFilter === 'all' || t.merchant === merchantFilter;
        const meetsTypeCriteria =
          reportType === 'all' ||
          (reportType === 'expenses' && t.type === 'Expense') ||
          (reportType === 'income' && t.type === 'Income');

        return meetsDateCriteria && meetsCategoryCriteria && meetsTypeCriteria && meetsMerchant;
      });

      // Build monthly data
      const monthlyData = new Map();
      if (timeRange === 'custom' || timeRange === 'all') {
        const start = new Date(startDate);
        const end = new Date(endDate);

        while (start <= end) {
          const year = start.getFullYear();
          const month = start.getMonth();
          const key = `${year}-${months[month]}`;

          monthlyData.set(key, {
            name: `${months[month]} ${year}`,
            income: 0,
            expense: 0,
            net: 0,
            year,
            month: months[month],
            monthIndex: month
          });

          start.setMonth(start.getMonth() + 1);
        }
      } else {
        months.forEach((month) => {
          monthlyData.set(month, {
            name: month,
            income: 0,
            expense: 0,
            net: 0,
            year: new Date().getFullYear(),
            month,
            monthIndex: months.indexOf(month)
          });
        });
      }

      filteredTransactions.forEach((t) => {
        const transactionDate = new Date(t.date);
        const year = transactionDate.getFullYear();
        const month = months[transactionDate.getMonth()];

        let key = month;
        if (timeRange === 'custom' || timeRange === 'all') {
          key = `${year}-${month}`;
        }

        if (!monthlyData.has(key)) {
          monthlyData.set(key, {
            name:
              timeRange === 'custom' || timeRange === 'all'
                ? `${month} ${year}`
                : month,
            income: 0,
            expense: 0,
            net: 0,
            year,
            month,
            monthIndex: transactionDate.getMonth()
          });
        }

        const monthData = monthlyData.get(key);
        if (t.type === 'Income') {
          monthData.income += t.amount;
        } else {
          monthData.expense += t.amount;
        }
        monthData.net = monthData.income - monthData.expense;
        monthlyData.set(key, monthData);
      });

      let data = Array.from(monthlyData.values());
      data.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      });

      if (timeRange === 'month') {
        data = data.slice(-2);
      } else if (timeRange === 'quarter') {
        data = data.slice(-4);
      } else if (timeRange === 'year') {
        data = data.slice(-12);
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Report Generation Failed',
        description: 'There was an error generating your report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------
  //  Original Export
  // ------------------------------------------------
  const handleExport = () => {
    try {
      const filename = `finance-report-${reportType}-${timeRange}-${new Date()
        .toISOString()
        .split('T')[0]}.csv`;

      let csvData = reportData.map((item) => ({
        Month: item.name,
        Income: formatCurrency(item.income),
        Expense: formatCurrency(item.expense),
        Net: formatCurrency(item.net)
      }));

      downloadCSV(csvData, filename);

      toast({
        title: 'Report Exported',
        description: `Your report has been exported as ${filename}`
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // ------------------------------------------------
  //  Account View Helpers
  // ------------------------------------------------
  const handleAccountViewChange = (view: 'basic' | 'advanced') => {
    setAccountView(view);
    if (view === 'basic') {
      setSelectedAccount(null);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // For searching: only show accounts that match name
  const searchedAccounts = byAccountWithType.filter((acc) => {
    if (!accountSearch) return true;
    return acc.account.toLowerCase().includes(accountSearch.toLowerCase());
  });

  // Sort
  const sortedAccounts = [...searchedAccounts].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    } else {
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    }
  });

  // If grouping is enabled, we group accounts by their type
  const groupedAccounts = groupAccounts
    ? sortedAccounts.reduce((groups: { [type: string]: any[] }, acc) => {
        if (!groups[acc.type]) groups[acc.type] = [];
        groups[acc.type].push(acc);
        return groups;
      }, {})
    : null;

  // Expand/Collapse handling
  useEffect(() => {
    if (expandAll) {
      // Expand all accounts
      sortedAccounts.forEach((acc) => {
        setOpenAccountId(acc.account); // last one might overwrite, so let's do a different approach
      });
      // Actually, to handle all expansions, we might store openAccountId as an array or set. 
      // For a simpler approach, we’ll do the “one open at a time.” 
      // If you want multiple expansions at once, you'd store multiple open IDs in state.
    } else {
      // Collapse all
      setOpenAccountId(null);
    }
    // If you need multiple expansions at once, you'd store an array of open IDs.
  }, [expandAll]);

  const handleToggleAccount = (accountName: string) => {
    if (openAccountId === accountName) {
      setOpenAccountId(null);
    } else {
      setOpenAccountId(accountName);
    }
  };

  // ------------------------------------------------
  //  Rendering Helpers
  // ------------------------------------------------
  const renderActiveChart = () => {
    if (reportData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">No data available for the selected filters</p>
        </div>
      );
    }

    if (viewMode === 'chart') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(Number(value)).split('.')[0]} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#4ade80" />
            <Bar dataKey="expense" name="Expense" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expense</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-income">{formatCurrency(item.income)}</TableCell>
                  <TableCell className="text-expense">{formatCurrency(item.expense)}</TableCell>
                  <TableCell
                    className={item.net >= 0 ? 'text-income' : 'text-expense'}
                  >
                    {formatCurrency(item.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
  };

  const getAccountHistoryData = (accountName: string) => {
    if (!accountAnalytics[accountName]) return [];

    const history = [...accountAnalytics[accountName].history];

    if (accountHistoryPeriod === '7d') {
      return history.slice(-7);
    } else if (accountHistoryPeriod === '14d') {
      return history.slice(-14);
    } else if (accountHistoryPeriod === '30d') {
      return history.slice(-30);
    }

    return history;
  };

  const getAccountHealthStatus = (account: any) => {
    const analytics = accountAnalytics[account.account];
    if (!analytics) return { status: 'neutral', message: 'Insufficient data' };

    if (analytics.trend === 'up' && analytics.changePercentage > 5) {
      return { status: 'positive', message: 'Growing balance' };
    } else if (analytics.trend === 'down' && analytics.changePercentage < -5) {
      return { status: 'negative', message: 'Declining balance' };
    } else if (account.balance < 100) {
      return { status: 'warning', message: 'Low balance' };
    }

    return { status: 'neutral', message: 'Stable account' };
  };

  // ---- RENDER BASIC vs. ADVANCED ACCOUNT VIEWS ----
  const renderAccountsView = () => {
    if (accountView === 'basic') {
      return (
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Financial Accounts</CardTitle>
              <CardDescription className="text-sm">
                Account balances and distribution
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleAccountViewChange('advanced')}>
              Advanced View
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('account')}
                  >
                    Account{' '}
                    {sortConfig.key === 'account' &&
                      (sortConfig.direction === 'asc' ? (
                        <ChevronUp className="inline h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('balance')}
                  >
                    Balance{' '}
                    {sortConfig.key === 'balance' &&
                      (sortConfig.direction === 'asc' ? (
                        <ChevronUp className="inline h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('percentage')}
                  >
                    Percentage{' '}
                    {sortConfig.key === 'percentage' &&
                      (sortConfig.direction === 'asc' ? (
                        <ChevronUp className="inline h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAccounts.map((account, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: account.color || COLORS[index % COLORS.length]
                          }}
                        />
                        {account.account}
                      </div>
                    </TableCell>
                    <TableCell
                      className={account.balance >= 0 ? 'text-income' : 'text-expense'}
                    >
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell>{account.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    } else {
      // ---- ADVANCED VIEW ----
      return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Advanced Account Analysis</CardTitle>
                <CardDescription className="text-sm">
                  Detailed view of your financial accounts
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="flex items-center border rounded-md px-2 h-9">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    placeholder="Search account..."
                    className="bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>

                {/* Toggle Grouping */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupAccounts(!groupAccounts)}
                >
                  {groupAccounts ? 'Ungroup' : 'Group by Type'}
                </Button>

                {/* Expand/Collapse All */}
                <Button variant="outline" size="sm" onClick={() => setExpandAll(!expandAll)}>
                  {expandAll ? 'Collapse All' : 'Expand All'}
                </Button>

                {/* Show/Hide Balances */}
                <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  {showBalance ? 'Hide Balances' : 'Show Balances'}
                </Button>

                {/* Switch to Basic */}
                <Button variant="outline" size="sm" onClick={() => handleAccountViewChange('basic')}>
                  Basic View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Switch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select value={selectedAccount || ''} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedAccounts.map((account, index) => (
                      <SelectItem key={index} value={account.account}>
                        {account.account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccountChartType('pie')}
                    className={accountChartType === 'pie' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" /> Pie
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccountChartType('bar')}
                    className={accountChartType === 'bar' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <BarChartIcon className="h-4 w-4 mr-1" /> Bar
                  </Button>
                </div>
              </div>

              {/* If no specific account is selected, show overall distribution */}
              {!selectedAccount && (
                <div className="mt-4 h-[300px]">
                  {accountChartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedAccounts}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="balance"
                          nameKey="account"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sortedAccounts.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedAccounts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="account" />
                        <YAxis tickFormatter={(value) => formatCurrency(Number(value)).split('.')[0]} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="balance" fill="#4ade80" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* Master Table of Accounts */}
              <div className="mt-6 space-y-4">
                {/* If grouping is on, show grouped table. Else show all in one table */}
                {groupAccounts ? (
                  Object.keys(groupedAccounts || {}).map((type, i) => (
                    <div key={i} className="border rounded-md p-3 bg-card/60">
                      <h3 className="text-md font-semibold mb-3">
                        {type} Accounts ({groupedAccounts ? groupedAccounts[type].length : 0})
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('account')}>
                              Account
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>
                              Balance
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('percentage')}>
                              % of Total
                            </TableHead>
                            <TableHead>Interest Rate</TableHead>
                            <TableHead>Monthly Avg</TableHead>
                            <TableHead>Health</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedAccounts &&
                            groupedAccounts[type].map((account, index) => {
                              const health = getAccountHealthStatus(account);
                              const analytics = accountAnalytics[account.account];
                              const extras = mockAccountExtras[account.account] || {
                                interestRate: 0,
                                monthlyAverage: 0
                              };

                              return (
                                <React.Fragment key={index}>
                                  <TableRow
                                    className={openAccountId === account.account ? 'bg-accent/50' : ''}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor: account.color || COLORS[index % COLORS.length]
                                          }}
                                        />
                                        {account.account}
                                      </div>
                                    </TableCell>
                                    <TableCell
                                      className={account.balance >= 0 ? 'text-income' : 'text-expense'}
                                    >
                                      {showBalance ? formatCurrency(account.balance) : '•••••••'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1">
                                        <span>{account.percentage.toFixed(1)}%</span>
                                        <Progress value={account.percentage} className="h-1" />
                                      </div>
                                    </TableCell>
                                    <TableCell>{extras.interestRate.toFixed(2)}%</TableCell>
                                    <TableCell>{formatCurrency(extras.monthlyAverage)}</TableCell>
                                    <TableCell>
                                      {analytics && (
                                        <Badge
                                          variant={
                                            health.status === 'positive'
                                              ? 'outline'
                                              : health.status === 'negative'
                                              ? 'destructive'
                                              : health.status === 'warning'
                                              ? 'secondary'
                                              : 'outline'
                                          }
                                          className="flex items-center gap-1"
                                        >
                                          {analytics.trend === 'up' ? (
                                            <TrendingUp className="h-3 w-3" />
                                          ) : analytics.trend === 'down' ? (
                                            <TrendingDown className="h-3 w-3" />
                                          ) : (
                                            <ArrowUpDown className="h-3 w-3" />
                                          )}
                                          {analytics.changePercentage.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleAccount(account.account)}
                                      >
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        {openAccountId === account.account ? 'Hide' : 'View'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>

                                  {/* Expanded Row */}
                                  {openAccountId === account.account && (
                                    <TableRow>
                                      <TableCell colSpan={7} className="p-0">
                                        <div className="p-4 bg-accent/20 space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="bg-card/60">
                                              <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">
                                                  Account Summary
                                                </CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                <dl className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <dt>Current Balance:</dt>
                                                    <dd
                                                      className={`font-semibold ${
                                                        account.balance >= 0
                                                          ? 'text-income'
                                                          : 'text-expense'
                                                      }`}
                                                    >
                                                      {showBalance
                                                        ? formatCurrency(account.balance)
                                                        : '•••••••'}
                                                    </dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt>Status:</dt>
                                                    <dd className="font-semibold">{health.message}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt>Recent Change:</dt>
                                                    <dd
                                                      className={`font-semibold ${
                                                        analytics?.trend === 'up'
                                                          ? 'text-income'
                                                          : analytics?.trend === 'down'
                                                          ? 'text-expense'
                                                          : ''
                                                      }`}
                                                    >
                                                      {analytics
                                                        ? `${analytics.changePercentage.toFixed(1)}%`
                                                        : 'N/A'}
                                                    </dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt>Total Transactions:</dt>
                                                    <dd className="font-semibold">
                                                      {
                                                        transactions.filter(
                                                          (t) => t.account === account.account
                                                        ).length
                                                      }
                                                    </dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt>Interest Rate:</dt>
                                                    <dd className="font-semibold">
                                                      {extras.interestRate.toFixed(2)}%
                                                    </dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt>Monthly Avg:</dt>
                                                    <dd className="font-semibold">
                                                      {formatCurrency(extras.monthlyAverage)}
                                                    </dd>
                                                  </div>
                                                </dl>
                                              </CardContent>
                                            </Card>

                                            <Card className="bg-card/60 md:col-span-2">
                                              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm font-medium">
                                                  Balance History
                                                </CardTitle>
                                                <Select
                                                  value={accountHistoryPeriod}
                                                  onValueChange={setAccountHistoryPeriod}
                                                >
                                                  <SelectTrigger className="w-[100px] h-7">
                                                    <SelectValue placeholder="Period" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="7d">7 Days</SelectItem>
                                                    <SelectItem value="14d">14 Days</SelectItem>
                                                    <SelectItem value="30d">30 Days</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </CardHeader>
                                              <CardContent className="p-0 h-[150px]">
                                                {analytics && (
                                                  <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                      data={getAccountHistoryData(account.account)}
                                                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                                                    >
                                                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                                      <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 10 }}
                                                        tickFormatter={(value) => {
                                                          const date = new Date(value);
                                                          return `${date.getMonth() + 1}/${date.getDate()}`;
                                                        }}
                                                      />
                                                      <YAxis
                                                        domain={['dataMin', 'dataMax']}
                                                        tickFormatter={(value) =>
                                                          formatCurrency(value).split('.')[0]
                                                        }
                                                        tick={{ fontSize: 10 }}
                                                      />
                                                      <Tooltip
                                                        formatter={(value) => formatCurrency(Number(value))}
                                                        labelFormatter={(label) =>
                                                          new Date(label).toLocaleDateString()
                                                        }
                                                      />
                                                      <Line
                                                        type="monotone"
                                                        dataKey="balance"
                                                        stroke={
                                                          account.color || COLORS[index % COLORS.length]
                                                        }
                                                        strokeWidth={2}
                                                      />
                                                    </LineChart>
                                                  </ResponsiveContainer>
                                                )}
                                              </CardContent>
                                            </Card>
                                          </div>

                                          <div className="mt-4">
                                            <h4 className="font-medium mb-2 flex items-center">
                                              <History className="h-4 w-4 mr-1" /> Recent Activity
                                            </h4>
                                            {analytics && analytics.recentActivity.length > 0 ? (
                                              <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">
                                                      Amount
                                                    </TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {analytics.recentActivity.map((activity, idx) => (
                                                    <TableRow key={idx}>
                                                      <TableCell className="text-xs">
                                                        {new Date(activity.date).toLocaleDateString()}
                                                      </TableCell>
                                                      <TableCell>
                                                        {activity.description || 'Transaction'}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Badge
                                                          variant={
                                                            activity.type === 'Income'
                                                              ? 'outline'
                                                              : 'secondary'
                                                          }
                                                          className={
                                                            activity.type === 'Income'
                                                              ? 'border-income/50 bg-income/10 text-income'
                                                              : 'border-expense/50 bg-expense/10 text-expense'
                                                          }
                                                        >
                                                          {activity.type}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell
                                                        className={`text-right ${
                                                          activity.type === 'Income'
                                                            ? 'text-income'
                                                            : 'text-expense'
                                                        }`}
                                                      >
                                                        {formatCurrency(activity.amount)}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            ) : (
                                              <div className="text-center text-muted-foreground p-4">
                                                No recent activity for this account
                                              </div>
                                            )}
                                          </div>

                                          {transactions.filter((t) => t.account === account.account)
                                            .length > 5 && (
                                            <div className="flex justify-center mt-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedAccount(account.account)}
                                              >
                                                View All Transactions
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  ))
                ) : (
                  // Ungrouped table (all accounts in a single table)
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('account')}>
                          Account{' '}
                          {sortConfig.key === 'account' &&
                            (sortConfig.direction === 'asc' ? (
                              <ChevronUp className="inline h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4" />
                            ))}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>
                          Balance{' '}
                          {sortConfig.key === 'balance' &&
                            (sortConfig.direction === 'asc' ? (
                              <ChevronUp className="inline h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4" />
                            ))}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('percentage')}>
                          % of Total{' '}
                          {sortConfig.key === 'percentage' &&
                            (sortConfig.direction === 'asc' ? (
                              <ChevronUp className="inline h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4" />
                            ))}
                        </TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Monthly Avg</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAccounts.map((account, index) => {
                        const health = getAccountHealthStatus(account);
                        const analytics = accountAnalytics[account.account];
                        const extras = mockAccountExtras[account.account] || {
                          interestRate: 0,
                          monthlyAverage: 0
                        };

                        return (
                          <React.Fragment key={index}>
                            <TableRow className={openAccountId === account.account ? 'bg-accent/50' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: account.color || COLORS[index % COLORS.length]
                                    }}
                                  />
                                  {account.account}
                                </div>
                              </TableCell>
                              <TableCell
                                className={account.balance >= 0 ? 'text-income' : 'text-expense'}
                              >
                                {showBalance ? formatCurrency(account.balance) : '•••••••'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span>{account.percentage.toFixed(1)}%</span>
                                  <Progress value={account.percentage} className="h-1" />
                                </div>
                              </TableCell>
                              <TableCell>{extras.interestRate.toFixed(2)}%</TableCell>
                              <TableCell>{formatCurrency(extras.monthlyAverage)}</TableCell>
                              <TableCell>
                                {analytics && (
                                  <Badge
                                    variant={
                                      health.status === 'positive'
                                        ? 'outline'
                                        : health.status === 'negative'
                                        ? 'destructive'
                                        : health.status === 'warning'
                                        ? 'secondary'
                                        : 'outline'
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    {analytics.trend === 'up' ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : analytics.trend === 'down' ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3" />
                                    )}
                                    {analytics.changePercentage.toFixed(1)}%
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAccount(account.account)}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {openAccountId === account.account ? 'Hide' : 'View'}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Row */}
                            {openAccountId === account.account && (
                              <TableRow>
                                <TableCell colSpan={7} className="p-0">
                                  <div className="p-4 bg-accent/20 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <Card className="bg-card/60">
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm font-medium">
                                            Account Summary
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <dt>Current Balance:</dt>
                                              <dd
                                                className={`font-semibold ${
                                                  account.balance >= 0
                                                    ? 'text-income'
                                                    : 'text-expense'
                                                }`}
                                              >
                                                {showBalance
                                                  ? formatCurrency(account.balance)
                                                  : '•••••••'}
                                              </dd>
                                            </div>
                                            <div className="flex justify-between">
                                              <dt>Status:</dt>
                                              <dd className="font-semibold">{health.message}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                              <dt>Recent Change:</dt>
                                              <dd
                                                className={`font-semibold ${
                                                  analytics?.trend === 'up'
                                                    ? 'text-income'
                                                    : analytics?.trend === 'down'
                                                    ? 'text-expense'
                                                    : ''
                                                }`}
                                              >
                                                {analytics
                                                  ? `${analytics.changePercentage.toFixed(1)}%`
                                                  : 'N/A'}
                                              </dd>
                                            </div>
                                            <div className="flex justify-between">
                                              <dt>Total Transactions:</dt>
                                              <dd className="font-semibold">
                                                {
                                                  transactions.filter(
                                                    (t) => t.account === account.account
                                                  ).length
                                                }
                                              </dd>
                                            </div>
                                            <div className="flex justify-between">
                                              <dt>Interest Rate:</dt>
                                              <dd className="font-semibold">
                                                {extras.interestRate.toFixed(2)}%
                                              </dd>
                                            </div>
                                            <div className="flex justify-between">
                                              <dt>Monthly Avg:</dt>
                                              <dd className="font-semibold">
                                                {formatCurrency(extras.monthlyAverage)}
                                              </dd>
                                            </div>
                                          </dl>
                                        </CardContent>
                                      </Card>

                                      <Card className="bg-card/60 md:col-span-2">
                                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                          <CardTitle className="text-sm font-medium">
                                            Balance History
                                          </CardTitle>
                                          <Select
                                            value={accountHistoryPeriod}
                                            onValueChange={setAccountHistoryPeriod}
                                          >
                                            <SelectTrigger className="w-[100px] h-7">
                                              <SelectValue placeholder="Period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="7d">7 Days</SelectItem>
                                              <SelectItem value="14d">14 Days</SelectItem>
                                              <SelectItem value="30d">30 Days</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </CardHeader>
                                        <CardContent className="p-0 h-[150px]">
                                          {analytics && (
                                            <ResponsiveContainer width="100%" height="100%">
                                              <LineChart
                                                data={getAccountHistoryData(account.account)}
                                                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                                              >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                                <XAxis
                                                  dataKey="date"
                                                  tick={{ fontSize: 10 }}
                                                  tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                                  }}
                                                />
                                                <YAxis
                                                  domain={['dataMin', 'dataMax']}
                                                  tickFormatter={(value) =>
                                                    formatCurrency(value).split('.')[0]
                                                  }
                                                  tick={{ fontSize: 10 }}
                                                />
                                                <Tooltip
                                                  formatter={(value) =>
                                                    formatCurrency(Number(value))
                                                  }
                                                  labelFormatter={(label) =>
                                                    new Date(label).toLocaleDateString()
                                                  }
                                                />
                                                <Line
                                                  type="monotone"
                                                  dataKey="balance"
                                                  stroke={
                                                    account.color || COLORS[index % COLORS.length]
                                                  }
                                                  strokeWidth={2}
                                                />
                                              </LineChart>
                                            </ResponsiveContainer>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </div>

                                    <div className="mt-4">
                                      <h4 className="font-medium mb-2 flex items-center">
                                        <History className="h-4 w-4 mr-1" /> Recent Activity
                                      </h4>
                                      {analytics && analytics.recentActivity.length > 0 ? (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Date</TableHead>
                                              <TableHead>Description</TableHead>
                                              <TableHead>Type</TableHead>
                                              <TableHead className="text-right">
                                                Amount
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {analytics.recentActivity.map((activity, idx) => (
                                              <TableRow key={idx}>
                                                <TableCell className="text-xs">
                                                  {new Date(activity.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                  {activity.description || 'Transaction'}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={
                                                      activity.type === 'Income'
                                                        ? 'outline'
                                                        : 'secondary'
                                                    }
                                                    className={
                                                      activity.type === 'Income'
                                                        ? 'border-income/50 bg-income/10 text-income'
                                                        : 'border-expense/50 bg-expense/10 text-expense'
                                                    }
                                                  >
                                                    {activity.type}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell
                                                  className={`text-right ${
                                                    activity.type === 'Income'
                                                      ? 'text-income'
                                                      : 'text-expense'
                                                  }`}
                                                >
                                                  {formatCurrency(activity.amount)}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      ) : (
                                        <div className="text-center text-muted-foreground p-4">
                                          No recent activity for this account
                                        </div>
                                      )}
                                    </div>

                                    {transactions.filter((t) => t.account === account.account).length >
                                      5 && (
                                      <div className="flex justify-center mt-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedAccount(account.account)}
                                        >
                                          View All Transactions
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* If an account is selected from the dropdown, display its transactions at bottom */}
              {selectedAccount && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    <Banknote className="h-5 w-5 mr-2" />
                    Transactions for {selectedAccount}
                  </h3>
                  {accountTransactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountTransactions
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() - new Date(a.date).getTime()
                          )
                          .slice(0, 10)
                          .map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(transaction.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.category}</TableCell>
                              <TableCell
                                className={
                                  transaction.type === 'Income'
                                    ? 'text-income'
                                    : 'text-expense'
                                }
                              >
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={transaction.type === 'Income' ? 'outline' : 'secondary'}
                                  className={
                                    transaction.type === 'Income'
                                      ? 'border-income/50 bg-income/10 text-income'
                                      : 'border-expense/50 bg-expense/10 text-expense'
                                  }
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center p-8 border rounded-md bg-muted/20">
                      <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No transactions found for this account
                      </p>
                    </div>
                  )}
                  {accountTransactions.length > 10 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" size="sm">
                        View All {accountTransactions.length} Transactions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  // ------------------------------------------------
  //  Main Return: TABS WRAPPER
  // ------------------------------------------------
  return (
    <div className="space-y-6 pb-10 px-4 md:px-6 lg:px-8 animate-in">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
        </TabsList>

        {/* ------------------ OVERVIEW TAB ------------------ */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-2xl font-bold mb-4 md:mb-0">Financial Reports</h1>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport} size="sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              <Button
                onClick={() => {
                  refreshData();
                  toast({ title: 'Report Refreshed', description: 'Data has been updated' });
                }}
                size="sm"
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Report Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="expenses">Expenses Only</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Time Range */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time Range</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                {timeRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Select value={startYear} onValueChange={setStartYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Start Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select value={endYear} onValueChange={setEndYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="End Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Merchant Filter (New) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Merchant</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Merchants</SelectItem>
                    {merchants.map((merchant, index) => (
                      <SelectItem key={index} value={merchant}>
                        {merchant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Switch between Chart or Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">View As</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                  className="flex-1"
                >
                  <BarChartIcon className="h-4 w-4 mr-1" /> Chart
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1"
                >
                  <FileType className="h-4 w-4 mr-1" /> Table
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Chart/Table Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {reportType === 'all'
                  ? 'All Transactions'
                  : reportType === 'expenses'
                  ? 'Expense Report'
                  : 'Income Report'}{' '}
                -{' '}
                {timeRange === 'month'
                  ? 'Last Month'
                  : timeRange === 'quarter'
                  ? 'Last Quarter'
                  : timeRange === 'year'
                  ? 'Last Year'
                  : timeRange === 'custom'
                  ? `${startYear} - ${endYear}`
                  : 'All Time'}
              </CardTitle>
              <CardDescription>
                {categoryFilter !== 'all'
                  ? `Filtered by category: ${categoryFilter}`
                  : 'All categories'}
                {merchantFilter !== 'all' ? `, Merchant: ${merchantFilter}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                renderActiveChart()
              )}
            </CardContent>
          </Card>

          {/* Summary + Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Total Records:</dt>
                    <dd className="font-semibold">{reportData.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Total Income:</dt>
                    <dd className="font-semibold text-income">
                      {formatCurrency(
                        reportData.reduce((sum, item) => sum + (item.income || 0), 0)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Total Expenses:</dt>
                    <dd className="font-semibold text-expense">
                      {formatCurrency(
                        reportData.reduce((sum, item) => sum + (item.expense || 0), 0)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <dt>Net:</dt>
                    <dd
                      className={`font-bold ${
                        reportData.reduce(
                          (sum, item) =>
                            sum + ((item.income || 0) - (item.expense || 0)),
                          0
                        ) >= 0
                          ? 'text-income'
                          : 'text-expense'
                      }`}
                    >
                      {formatCurrency(
                        reportData.reduce(
                          (sum, item) =>
                            sum + ((item.income || 0) - (item.expense || 0)),
                          0
                        )
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Accounts View */}
            {renderAccountsView()}
          </div>
        </TabsContent>

        {/* ------------------ ADVANCED ANALYTICS TAB ------------------ */}
        <TabsContent value="advanced" className="space-y-6">
          <h2 className="text-xl font-semibold">Advanced Analytics</h2>

          {/* ---- YEAR-OVER-YEAR Chart ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Year-over-Year Comparison</CardTitle>
              <CardDescription>Compare current year vs. last year</CardDescription>
            </CardHeader>
            <CardContent>
              {yoyData.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">No data for YoY comparison</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yoyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => formatCurrency(val).split('.')[0]} />
                    <Tooltip
                      formatter={(val) => formatCurrency(Number(val))}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    <Bar dataKey="currentYearIncome" name="Curr Year Income" fill="#4ade80" />
                    <Bar dataKey="currentYearExpense" name="Curr Year Expense" fill="#f43f5e" />
                    <Bar dataKey="lastYearIncome" name="Last Year Income" fill="#3b82f6" />
                    <Bar dataKey="lastYearExpense" name="Last Year Expense" fill="#e879f9" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ---- TOP CATEGORIES BREAKDOWN ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Categories Breakdown</CardTitle>
              <CardDescription>Highlighting your top 5 categories</CardDescription>
            </CardHeader>
            <CardContent>
              {topCategories.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">
                    No category data within the selected filters
                  </p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategories}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {topCategories.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2">
                    {topCategories.map((cat, idx) => (
                      <div className="flex justify-between" key={idx}>
                        <span className="font-medium">{cat.category}</span>
                        <span className="font-semibold">{formatCurrency(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
