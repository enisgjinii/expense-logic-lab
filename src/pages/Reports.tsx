import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DateRangePicker from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Download, Filter, ArrowUpDown, BarChart2, PieChart as PieChartIcon, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parse, isWithinInterval } from 'date-fns';
import { CategorySummary, Transaction } from '@/types/finance';

const getRandomColor = () => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC926', '#6A4C93', '#1982C4', '#FFCA3A',
    '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Reports = () => {
  const { transactions, stats } = useFinance();
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [accountData, setAccountData] = useState<any[]>([]);
  const [timeframeData, setTimeframeData] = useState<any[]>([]);
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account))).sort();
  
  useEffect(() => {
    if (!transactions.length) return;
    
    let filtered = [...transactions];
    
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, {
          start: dateRange.from as Date,
          end: dateRange.to as Date,
        });
      });
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    if (accountFilter !== 'all') {
      filtered = filtered.filter(t => t.account === accountFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(term) || 
        t.notes?.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term) || 
        t.account.toLowerCase().includes(term) || 
        t.merchant?.toLowerCase().includes(term)
      );
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredTransactions(filtered);
    prepareChartData(filtered);
  }, [transactions, dateRange, categoryFilter, accountFilter, typeFilter, sortOrder, searchTerm, timeframe]);
  
  const prepareChartData = (filtered: Transaction[]) => {
    const categoryMap = new Map<string, number>();
    
    filtered.forEach(t => {
      const amount = t.type === 'Expense' ? -t.amount : t.amount;
      const category = t.category || 'Uncategorized';
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category)! + amount);
      } else {
        categoryMap.set(category, amount);
      }
    });
    
    const categoryChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.abs(value),
      color: getRandomColor(),
    }));
    
    setCategoryData(categoryChartData);
    
    const accountMap = new Map<string, number>();
    
    filtered.forEach(t => {
      const amount = t.amount;
      const account = t.account || 'Unknown';
      
      if (accountMap.has(account)) {
        accountMap.set(account, accountMap.get(account)! + (t.type === 'Expense' ? -amount : amount));
      } else {
        accountMap.set(account, t.type === 'Expense' ? -amount : amount);
      }
    });
    
    const accountChartData = Array.from(accountMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: getRandomColor(),
    }));
    
    setAccountData(accountChartData);
    
    const timeMap = new Map<string, { income: number; expense: number; balance: number }>();
    const formatStr = timeframe === 'daily' ? 'yyyy-MM-dd' : timeframe === 'weekly' ? 'yyyy-ww' : 'yyyy-MM';
    
    filtered.forEach(t => {
      let timePeriod;
      const transactionDate = new Date(t.date);
      
      if (timeframe === 'daily') {
        timePeriod = format(transactionDate, 'yyyy-MM-dd');
      } else if (timeframe === 'weekly') {
        timePeriod = format(transactionDate, 'yyyy-ww');
      } else {
        timePeriod = format(transactionDate, 'yyyy-MM');
      }
      
      if (!timeMap.has(timePeriod)) {
        timeMap.set(timePeriod, { income: 0, expense: 0, balance: 0 });
      }
      
      const current = timeMap.get(timePeriod)!;
      
      if (t.type === 'Income') {
        current.income += t.amount;
        current.balance += t.amount;
      } else if (t.type === 'Expense') {
        current.expense += t.amount;
        current.balance -= t.amount;
      }
      
      timeMap.set(timePeriod, current);
    });
    
    const timeChartData = Array.from(timeMap.entries())
      .map(([time, data]) => {
        let displayTime;
        
        if (timeframe === 'daily') {
          displayTime = format(parse(time, 'yyyy-MM-dd', new Date()), 'MMM dd');
        } else if (timeframe === 'weekly') {
          const [year, week] = time.split('-');
          displayTime = `Week ${week}`;
        } else {
          displayTime = format(parse(time + '-01', 'yyyy-MM-dd', new Date()), 'MMM yyyy');
        }
        
        return {
          time: displayTime,
          income: data.income,
          expense: data.expense,
          balance: data.balance,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
    
    setTimeframeData(timeChartData);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netBalance = totalIncome - totalExpense;
  
  const renderCustomizedLabel = ({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`;
  
  const resetFilters = () => {
    setCategoryFilter('all');
    setAccountFilter('all');
    setTypeFilter('all');
    setSortOrder('desc');
    setSearchTerm('');
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
  };
  
  const exportReport = () => {
    console.log('Exporting report data...');
  };
  
  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 pb-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Financial Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Analyze your transactions and financial patterns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters} className="flex gap-2 items-center text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" onClick={exportReport} className="flex gap-2 items-center text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      <Card className="mb-4 sm:mb-6 overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Filter Options</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Customize your report view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="date-range" className="text-xs sm:text-sm">Date Range</Label>
              <DateRangePicker 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category" className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="account" className="text-xs sm:text-sm">Account</Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger id="account" className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {uniqueAccounts.map(account => (
                    <SelectItem key={account} value={account}>{account}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="type" className="text-xs sm:text-sm">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type" className="text-xs sm:text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="search" className="text-xs sm:text-sm">Search Transactions</Label>
              <Input 
                id="search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by description, category, etc."
                className="text-xs sm:text-sm"
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="timeframe" className="text-xs sm:text-sm">Time Grouping</Label>
              <Select 
                value={timeframe} 
                onValueChange={(value) => setTimeframe(value as 'daily' | 'weekly' | 'monthly')}
              >
                <SelectTrigger id="timeframe" className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="sort" className="text-xs sm:text-sm">Sort Order</Label>
              <Button 
                variant="outline" 
                className="w-full justify-between text-xs sm:text-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                Date {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">No transactions found matching the current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Total Income</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalIncome)}</h3>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpense)}</h3>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <BarChart2 className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn(
              "border",
              netBalance >= 0 
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50" 
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50"
            )}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={cn(
                      "text-xs sm:text-sm font-medium",
                      netBalance >= 0 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-amber-600 dark:text-amber-400"
                    )}>Net Balance</p>
                    <h3 className={cn(
                      "text-lg sm:text-2xl font-bold",
                      netBalance >= 0 
                        ? "text-blue-700 dark:text-blue-300" 
                        : "text-amber-700 dark:text-amber-300"
                    )}>{formatCurrency(netBalance)}</h3>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-3 rounded-full",
                    netBalance >= 0 
                      ? "bg-blue-100 dark:bg-blue-900/30" 
                      : "bg-amber-100 dark:bg-amber-900/30"
                  )}>
                    <PieChartIcon className={cn(
                      "h-4 w-4 sm:h-6 sm:w-6",
                      netBalance >= 0 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-amber-600 dark:text-amber-400"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'advanced')}>
            <TabsList className="grid grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs sm:text-sm">Advanced Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Spending by Category</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Distribution of expenses across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[300px] w-full overflow-x-auto">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              labelLine
                              label={renderCustomizedLabel}
                              outerRadius={window.innerWidth < 640 ? 70 : 100}
                              fill="#8884d8"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                            <Legend layout={window.innerWidth < 640 ? "horizontal" : "vertical"} verticalAlign="bottom" align="center" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground text-xs sm:text-sm">No category data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Cash Flow Over Time</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Income vs expenses over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[300px] w-full overflow-x-auto">
                      {timeframeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timeframeData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <YAxis tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                            <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Bar dataKey="income" name="Income" fill="#4BC0C0" />
                            <Bar dataKey="expense" name="Expense" fill="#FF6384" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground text-xs sm:text-sm">No time-based data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Balance Trend</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">How your balance changed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[300px] w-full overflow-x-auto">
                      {timeframeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeframeData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <YAxis tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                            <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Line type="monotone" dataKey="balance" name="Balance" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground text-xs sm:text-sm">No balance trend data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Account Distribution</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">How your money is distributed among accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[300px] w-full overflow-x-auto">
                      {accountData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={accountData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              labelLine
                              label={renderCustomizedLabel}
                              outerRadius={window.innerWidth < 640 ? 70 : 100}
                              fill="#8884d8"
                            >
                              {accountData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                            <Legend layout={window.innerWidth < 640 ? "horizontal" : "vertical"} verticalAlign="bottom" align="center" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground text-xs sm:text-sm">No account data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Income vs Expense</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Compare income and expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[300px] w-full overflow-x-auto">
                      {filteredTransactions.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Income', amount: totalIncome, fill: '#4BC0C0' },
                              { name: 'Expenses', amount: totalExpense, fill: '#FF6384' },
                            ]}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <YAxis tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                            <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                            <Bar dataKey="amount" name="Amount">
                              {[
                                { name: 'Income', amount: totalIncome, fill: '#4BC0C0' },
                                { name: 'Expenses', amount: totalExpense, fill: '#FF6384' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground text-xs sm:text-sm">No data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Transaction Statistics</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Key metrics about your transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Transactions</p>
                        <h4 className="text-base sm:text-2xl font-bold">{filteredTransactions.length}</h4>
                      </div>
                      <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Avg. Transaction</p>
                        <h4 className="text-base sm:text-2xl font-bold">
                          {formatCurrency(
                            filteredTransactions.length 
                              ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length 
                              : 0
                          )}
                        </h4>
                      </div>
                      <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Largest Expense</p>
                        <h4 className="text-base sm:text-2xl font-bold">
                          {formatCurrency(Math.max(...filteredTransactions
                            .filter(t => t.type === 'Expense')
                            .map(t => t.amount), 0)
                          )}
                        </h4>
                      </div>
                      <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Largest Income</p>
                        <h4 className="text-base sm:text-2xl font-bold">
                          {formatCurrency(Math.max(...filteredTransactions
                            .filter(t => t.type === 'Income')
                            .map(t => t.amount), 0)
                          )}
                        </h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Reports;
