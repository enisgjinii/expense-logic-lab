import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { downloadCSV } from '@/utils/export-utils';
import { BarChart as BarChartIcon, Download, CalendarIcon, FileType } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const Reports = () => {
  const { transactions, stats, budgets, refreshData } = useFinance();
  const [reportType, setReportType] = useState('expenses');
  const [timeRange, setTimeRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startYear, setStartYear] = useState('2015');
  const [endYear, setEndYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const categories = [...new Set(transactions.map(t => t.category))];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  
  const years = [];
  for (let year = 2015; year <= new Date().getFullYear(); year++) {
    years.push(year.toString());
  }

  useEffect(() => {
    generateReport();
  }, [reportType, timeRange, categoryFilter, transactions, startYear, endYear]);

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
      
      let filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const meetsDateCriteria = transactionDate >= startDate && transactionDate <= endDate;
        const meetsCategoryCriteria = categoryFilter === 'all' || t.category === categoryFilter;
        const meetsTypeCriteria = reportType === 'all' || 
                                 (reportType === 'expenses' && t.type === 'Expense') ||
                                 (reportType === 'income' && t.type === 'Income');
        
        return meetsDateCriteria && meetsCategoryCriteria && meetsTypeCriteria;
      });
      
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
        months.forEach(month => {
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
      
      filteredTransactions.forEach(t => {
        const transactionDate = new Date(t.date);
        const year = transactionDate.getFullYear();
        const month = months[transactionDate.getMonth()];
        
        let key = month;
        if (timeRange === 'custom' || timeRange === 'all') {
          key = `${year}-${month}`;
        }
        
        if (!monthlyData.has(key)) {
          monthlyData.set(key, { 
            name: timeRange === 'custom' || timeRange === 'all' ? `${month} ${year}` : month, 
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
        if (a.year !== b.year) {
          return a.year - b.year;
        }
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
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = () => {
    try {
      const filename = `finance-report-${reportType}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      
      let csvData = reportData.map(item => ({
        Month: item.name,
        Income: formatCurrency(item.income),
        Expense: formatCurrency(item.expense),
        Net: formatCurrency(item.net)
      }));
      
      downloadCSV(csvData, filename);
      
      toast({
        title: "Report Exported",
        description: `Your report has been exported as ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report. Please try again.",
        variant: "destructive"
      });
    }
  };

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
                  <TableCell className={item.net >= 0 ? "text-income" : "text-expense"}>
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

  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Financial Reports</h1>
        
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          
          <Button onClick={() => {
            refreshData();
            toast({ title: "Report Refreshed", description: "Data has been updated" });
          }} size="sm">
            Refresh Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
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
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
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
                  <SelectItem key={index} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {reportType === 'all' ? 'All Transactions' : 
              reportType === 'expenses' ? 'Expense Report' : 'Income Report'} - {
                timeRange === 'month' ? 'Last Month' : 
                timeRange === 'quarter' ? 'Last Quarter' : 
                timeRange === 'year' ? 'Last Year' :
                timeRange === 'custom' ? `${startYear} - ${endYear}` :
                'All Time'
              }
          </CardTitle>
          <CardDescription>
            {categoryFilter !== 'all' ? `Filtered by category: ${categoryFilter}` : 'All categories'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : renderActiveChart()}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {formatCurrency(reportData.reduce((sum, item) => sum + (item.income || 0), 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Total Expenses:</dt>
                <dd className="font-semibold text-expense">
                  {formatCurrency(reportData.reduce((sum, item) => sum + (item.expense || 0), 0))}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <dt>Net:</dt>
                <dd className={`font-bold ${reportData.reduce((sum, item) => sum + ((item.income || 0) - (item.expense || 0)), 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(reportData.reduce((sum, item) => sum + ((item.income || 0) - (item.expense || 0)), 0))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Financial Accounts</CardTitle>
            <CardDescription>
              Account balances and distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byAccount.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: account.color || COLORS[index % COLORS.length] }}
                          />
                          {account.account}
                        </div>
                      </TableCell>
                      <TableCell className={account.balance >= 0 ? "text-income" : "text-expense"}>
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>{account.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
