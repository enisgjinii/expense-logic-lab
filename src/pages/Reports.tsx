import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, Filter, RefreshCw, PieChart as PieChartIcon, BarChart as BarChartIcon, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { CategorySummary, MonthlyData } from '@/types/finance';

const Reports = () => {
  const { stats, transactions, refreshData } = useFinance();
  const [activeTab, setActiveTab] = useState<"overview" | "advanced">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
    to: new Date()
  });
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([]);
  const [topCategories, setTopCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    if (stats) {
      // Filter data based on date range
      const filtered = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
      });

      // Process data for charts
      processData(filtered);
    }
  }, [stats, transactions, dateRange, categoryFilter]);

  const processData = (filteredTransactions: any[]) => {
    // Group by month
    const monthlyData: { [key: string]: { income: number; expense: number; balance: number } } = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (t.type === 'Income') {
        monthlyData[monthYear].income += t.amount;
      } else if (t.type === 'Expense') {
        monthlyData[monthYear].expense += t.amount;
      }
      
      monthlyData[monthYear].balance = monthlyData[monthYear].income - monthlyData[monthYear].expense;
    });
    
    // Convert to array and sort by date
    const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({
      month: month,
      income: data.income,
      expense: data.expense,
      balance: data.balance,
      displayMonth: new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    setMonthlyTrend(monthlyArray);
    
    // Group by category
    const categoryData: { [key: string]: { total: number; count: number } } = {};
    
    filteredTransactions.filter(t => t.type === 'Expense').forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = { total: 0, count: 0 };
      }
      
      categoryData[t.category].total += t.amount;
      categoryData[t.category].count += 1;
    });
    
    // Convert to array and sort by total
    const totalExpense = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
    
    const categoryArray = Object.entries(categoryData).map(([category, data]) => ({
      category: category,
      total: data.total,
      count: data.count,
      percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      color: getCategoryColor(category)
    })).sort((a, b) => b.total - a.total);
    
    setTopCategories(categoryArray);
    
    // Apply category filter if needed
    if (categoryFilter !== 'all') {
      const filtered = filteredTransactions.filter((t: any) => t.category === categoryFilter);
      setFilteredData(filtered);
    } else {
      setFilteredData(filteredTransactions);
    }
  };

  const getCategoryColor = (category: string) => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await refreshData();
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Reports Refreshed", description: "Latest data has been loaded" });
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Date,Type,Category,Amount,Description\n";
    
    // Add data rows
    filteredData.forEach(t => {
      const row = [
        new Date(t.date).toISOString().split('T')[0],
        t.type,
        t.category,
        t.amount,
        t.description || t.notes || ""
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `Exported ${filteredData.length} transactions to CSV`
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
        
        <div className="flex flex-wrap gap-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "advanced")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
                  <div className="bg-emerald-100 text-emerald-800 p-1 rounded-full">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {monthlyTrend.length > 0 && `${formatCurrency(monthlyTrend[monthlyTrend.length - 1]?.income || 0)} in the last month`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalExpense)}</div>
                  <div className="bg-rose-100 text-rose-800 p-1 rounded-full">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {monthlyTrend.length > 0 && `${formatCurrency(monthlyTrend[monthlyTrend.length - 1]?.expense || 0)} in the last month`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(stats.balance)}</div>
                  <div className={`p-1 rounded-full ${stats.balance >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {stats.balance >= 0 ? <TrendingUp className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalIncome > 0 && `Saving rate: ${((stats.balance / stats.totalIncome) * 100).toFixed(1)}%`}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Monthly Trend</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant={chartType === 'bar' ? 'default' : 'outline'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChartIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={chartType === 'pie' ? 'default' : 'outline'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setChartType('pie')}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {chartType === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyTrend}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayMonth" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#4ade80" />
                        <Bar dataKey="expense" name="Expense" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategories.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                          nameKey="category"
                        >
                          {topCategories.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Top Expense Categories</CardTitle>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {topCategories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                        />
                        <span>{category.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </span>
                        <span className="font-medium">{formatCurrency(category.total)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {topCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No expense data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Financial Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Average Monthly Income</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        monthlyTrend.length > 0
                          ? monthlyTrend.reduce((sum, month) => sum + month.income, 0) / monthlyTrend.length
                          : 0
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Average Monthly Expense</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        monthlyTrend.length > 0
                          ? monthlyTrend.reduce((sum, month) => sum + month.expense, 0) / monthlyTrend.length
                          : 0
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Average Monthly Savings</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        monthlyTrend.length > 0
                          ? monthlyTrend.reduce((sum, month) => sum + month.balance, 0) / monthlyTrend.length
                          : 0
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrend}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayMonth" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#4ade80" />
                      <Bar dataKey="expense" name="Expense" fill="#f87171" />
                      <Bar dataKey="balance" name="Balance" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Income vs Expense Ratio</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Income', value: stats.totalIncome },
                              { name: 'Expense', value: stats.totalExpense }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                          >
                            <Cell fill="#4ade80" />
                            <Cell fill="#f87171" />
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-4">Expense Breakdown</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topCategories.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="total"
                            nameKey="category"
                          >
                            {topCategories.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
