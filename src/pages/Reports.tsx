import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { formatDate, formatCurrency } from '@/utils/finance-utils';
import { 
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Calendar as CalendarIcon,
  ArrowDownUp,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  ArrowRight,
  Check
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const COLORS = [
  '#8B5CF6', '#EC4899', '#F97316', '#22C55E', '#3B82F6', 
  '#A855F7', '#14B8A6', '#F43F5E', '#FACC15', '#64748B',
  '#FB923C', '#22D3EE', '#4ADE80', '#F472B6', '#10B981'
];

const Reports = () => {
  const { transactions, stats, exportData } = useFinance();
  const [reportType, setReportType] = useState('expense-category');
  const [timeframe, setTimeframe] = useState('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    
    switch(newTimeframe) {
      case 'month':
        setDateRange({
          from: startOfMonth(new Date()),
          to: endOfMonth(new Date())
        });
        break;
      case 'quarter':
        setDateRange({
          from: startOfMonth(subMonths(new Date(), 2)),
          to: endOfMonth(new Date())
        });
        break;
      case 'year':
        setDateRange({
          from: startOfYear(new Date()),
          to: endOfYear(new Date())
        });
        break;
      case 'custom':
        break;
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return transactions;
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      if (dateRange.from && dateRange.to) {
        return txDate >= dateRange.from && txDate <= dateRange.to;
      } else if (dateRange.from) {
        return txDate >= dateRange.from;
      }
      
      return true;
    });
  }, [transactions, dateRange]);

  const expenseByCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredTransactions
      .filter(tx => tx.type === 'Expense')
      .forEach(tx => {
        const category = tx.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + tx.amount);
      });
    
    let result = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    if (result.length > 10) {
      const topCategories = result.slice(0, 9);
      const otherSum = result.slice(9).reduce((sum, item) => sum + item.value, 0);
      
      topCategories.push({
        name: 'Other',
        value: otherSum,
        color: '#64748B'
      });
      
      result = topCategories;
    }
    
    return result;
  }, [filteredTransactions]);

  const incomeVsExpenseData = useMemo(() => {
    const monthlyData = new Map<string, { month: string, income: number, expense: number }>();
    
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yyyy');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { month: monthLabel, income: 0, expense: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      
      if (tx.type === 'Income') {
        data.income += tx.amount;
      } else if (tx.type === 'Expense') {
        data.expense += tx.amount;
      }
    });
    
    return Array.from(monthlyData.values())
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredTransactions]);

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(tx => tx.type === 'Income')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalExpense = filteredTransactions
      .filter(tx => tx.type === 'Expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const spendingTrendData = useMemo(() => {
    const dailyData = new Map<string, { date: string, amount: number }>();
    
    filteredTransactions
      .filter(tx => tx.type === 'Expense')
      .forEach(tx => {
        const date = new Date(tx.date);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dateLabel = format(date, 'MMM dd');
        
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { date: dateLabel, amount: 0 });
        }
        
        dailyData.get(dateKey)!.amount += tx.amount;
      });
    
    return Array.from(dailyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const csvContent = exportData();
    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'finance_report.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'All time';
    
    const from = format(dateRange.from, 'MMM d, yyyy');
    
    if (!dateRange.to) return `Since ${from}`;
    
    const to = format(dateRange.to, 'MMM d, yyyy');
    return `${from} - ${to}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-7xl animate-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Analyze your financial data with interactive reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between text-left font-normal w-full sm:w-[240px]">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </div>
                <ArrowDownUp className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col sm:flex-row">
                <div className="border-b sm:border-b-0 sm:border-r border-muted p-2 space-y-2">
                  <Button
                    variant={timeframe === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTimeframeChange('month')}
                  >
                    This Month
                  </Button>
                  <Button
                    variant={timeframe === 'quarter' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTimeframeChange('quarter')}
                  >
                    Last 3 Months
                  </Button>
                  <Button
                    variant={timeframe === 'year' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTimeframeChange('year')}
                  >
                    This Year
                  </Button>
                  <Button
                    variant={timeframe === 'custom' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTimeframeChange('custom')}
                  >
                    Custom Range
                  </Button>
                </div>
                
                <div className="p-2">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
            <p className="text-sm text-muted-foreground">
              From {filteredTransactions.filter(tx => tx.type === 'Income').length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
            <p className="text-sm text-muted-foreground">
              From {filteredTransactions.filter(tx => tx.type === 'Expense').length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </div>
            <p className="text-sm text-muted-foreground">
              Savings rate: {summary.savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="expense-category" value={reportType} onValueChange={setReportType} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="expense-category" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="income-expense" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Income/Expense</span>
            </TabsTrigger>
            <TabsTrigger value="spending-trend" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="expense-category" className="mt-0">
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
              <CardDescription>
                Breakdown of expenses across different categories during {formatDateRange()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenseByCategoryData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={60}
                          fill="#8B5CF6"
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {expenseByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                    {expenseByCategoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No expense data available for this period.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Total expenses for this period: {formatCurrency(summary.totalExpense)}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="income-expense" className="mt-0">
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>
                Monthly comparison of income and expenses during {formatDateRange()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeVsExpenseData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeVsExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No data available for this period.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                <Badge variant="outline" className="px-2 py-1 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span>Income: {formatCurrency(summary.totalIncome)}</span>
                </Badge>
                <Badge variant="outline" className="px-2 py-1 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <span>Expense: {formatCurrency(summary.totalExpense)}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Net balance: {formatCurrency(summary.balance)}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="spending-trend" className="mt-0">
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
              <CardDescription>
                Daily expense pattern during {formatDateRange()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spendingTrendData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Daily Expenses" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No expense data available for this period.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Average daily expense: {formatCurrency(spendingTrendData.length > 0 
                  ? spendingTrendData.reduce((sum, day) => sum + day.amount, 0) / spendingTrendData.length 
                  : 0)}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>
            Key observations from your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium flex items-center mb-2">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                Savings Rate
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Your savings rate is {summary.savingsRate.toFixed(1)}% for this period.
              </p>
              {summary.savingsRate >= 20 ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Excellent</Badge>
              ) : summary.savingsRate >= 10 ? (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Good</Badge>
              ) : summary.savingsRate > 0 ? (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Fair</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Needs Improvement</Badge>
              )}
            </div>
            
            <div className="rounded-lg border p-4">
              <h4 className="font-medium flex items-center mb-2">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Transaction Summary
              </h4>
              <p className="text-sm text-muted-foreground">
                You had a total of {summary.transactionCount} transactions in this period:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">
                  {filteredTransactions.filter(tx => tx.type === 'Income').length} Income
                </Badge>
                <Badge variant="outline">
                  {filteredTransactions.filter(tx => tx.type === 'Expense').length} Expense
                </Badge>
                <Badge variant="outline">
                  {filteredTransactions.filter(tx => tx.type === 'Transfer').length} Transfer
                </Badge>
              </div>
            </div>
            
            {expenseByCategoryData.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <PieChartIcon className="h-5 w-5 mr-2 text-purple-500" />
                  Top Expense Category
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your largest expense category is <strong>{expenseByCategoryData[0].name}</strong> at {formatCurrency(expenseByCategoryData[0].value)}.
                </p>
                <Button variant="link" className="p-0 h-auto mt-1 text-sm" onClick={() => setReportType('expense-category')}>
                  View category breakdown <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
            
            {incomeVsExpenseData.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
                  Income vs Expense Trend
                </h4>
                <p className="text-sm text-muted-foreground">
                  {summary.balance >= 0 
                    ? `You're saving money overall with a positive balance of ${formatCurrency(summary.balance)}.`
                    : `You're spending more than you earn with a negative balance of ${formatCurrency(Math.abs(summary.balance))}.`
                  }
                </p>
                <Button variant="link" className="p-0 h-auto mt-1 text-sm" onClick={() => setReportType('income-expense')}>
                  View income/expense comparison <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
