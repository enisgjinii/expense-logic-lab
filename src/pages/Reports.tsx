import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, LineChart, BarChart, ComposedChart, Area, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Line } from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { downloadCSV } from '@/utils/export-utils';
import { CalendarIcon, Download, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, FileType } from 'lucide-react';

const Reports = () => {
  const { transactions, stats, budgets, refreshData } = useFinance();
  const [reportType, setReportType] = useState('expenses');
  const [timeRange, setTimeRange] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  const categories = [...new Set(transactions.map(t => t.category))];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    generateReport();
  }, [reportType, timeRange, categoryFilter, transactions]);

  const generateReport = async () => {
    setIsLoading(true);
    
    try {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (timeRange === 'all') {
        startDate = new Date(0);
      }
      
      let filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const meetsDateCriteria = transactionDate >= startDate && transactionDate <= now;
        const meetsCategoryCriteria = categoryFilter === 'all' || t.category === categoryFilter;
        const meetsTypeCriteria = reportType === 'all' || 
                                 (reportType === 'expenses' && t.type === 'Expense') ||
                                 (reportType === 'income' && t.type === 'Income');
        
        return meetsDateCriteria && meetsCategoryCriteria && meetsTypeCriteria;
      });
      
      let data: any[] = [];
      
      if (chartType === 'pie') {
        const categoryMap = new Map();
        
        filteredTransactions.forEach(t => {
          const amount = t.type === 'Expense' ? -t.amount : t.amount;
          if (categoryMap.has(t.category)) {
            categoryMap.set(t.category, categoryMap.get(t.category) + amount);
          } else {
            categoryMap.set(t.category, amount);
          }
        });
        
        categoryMap.forEach((amount, category) => {
          data.push({
            name: category,
            value: Math.abs(amount),
            originalValue: amount
          });
        });
        
        data.sort((a, b) => b.value - a.value);
        
      } else {
        const monthlyData = new Map();
        
        if (timeRange === 'year' || timeRange === 'all') {
          months.forEach(month => {
            monthlyData.set(month, { 
              name: month, 
              income: 0, 
              expense: 0, 
              net: 0 
            });
          });
        }
        
        filteredTransactions.forEach(t => {
          const transactionDate = new Date(t.date);
          const month = months[transactionDate.getMonth()];
          const amount = t.amount;
          
          if (!monthlyData.has(month)) {
            monthlyData.set(month, { 
              name: month, 
              income: 0, 
              expense: 0, 
              net: 0 
            });
          }
          
          const monthData = monthlyData.get(month);
          
          if (t.type === 'Income') {
            monthData.income += amount;
          } else {
            monthData.expense += amount;
          }
          
          monthData.net = monthData.income - monthData.expense;
          monthlyData.set(month, monthData);
        });
        
        data = Array.from(monthlyData.values());
        const currentMonthIndex = now.getMonth();
        
        data.sort((a, b) => {
          const aIndex = months.indexOf(a.name);
          const bIndex = months.indexOf(b.name);
          
          const adjustedAIndex = aIndex <= currentMonthIndex ? aIndex + 12 : aIndex;
          const adjustedBIndex = bIndex <= currentMonthIndex ? bIndex + 12 : bIndex;
          
          return adjustedAIndex - adjustedBIndex;
        });
        
        if (timeRange === 'month') {
          data = data.slice(-2);
        } else if (timeRange === 'quarter') {
          data = data.slice(-4);
        }
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
      
      let csvData: any[] = [];
      
      if (chartType === 'pie') {
        csvData = reportData.map(item => ({
          Category: item.name,
          Amount: formatCurrency(item.originalValue)
        }));
      } else {
        csvData = reportData.map(item => ({
          Month: item.name,
          Income: formatCurrency(item.income),
          Expense: formatCurrency(item.expense),
          Net: formatCurrency(item.net)
        }));
      }
      
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
    
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={reportData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {reportData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatCurrency(Number(value))}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{payload[0].name}</p>
                      <p className="text-lg font-semibold">{formatCurrency(Number(payload[0].value))}</p>
                      <p className="text-xs text-muted-foreground">
                        {(Number(payload[0].payload.value) / reportData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value: any) => formatCurrency(Number(value)).split('.')[0]} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} activeDot={{ r: 8 }} name="Expense" />
            <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Net" />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#4ade80" />
            <Bar dataKey="expense" name="Expense" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
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
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
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
            <CardTitle className="text-sm font-medium">Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setChartType('bar')}
                className="flex-1"
              >
                <BarChartIcon className="h-4 w-4 mr-1" /> Bar
              </Button>
              <Button 
                variant={chartType === 'line' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setChartType('line')}
                className="flex-1"
              >
                <LineChartIcon className="h-4 w-4 mr-1" /> Line
              </Button>
              <Button 
                variant={chartType === 'pie' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setChartType('pie')}
                className="flex-1"
              >
                <PieChartIcon className="h-4 w-4 mr-1" /> Pie
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
                timeRange === 'year' ? 'Last Year' : 'All Time'
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
                <dt>Total Transactions:</dt>
                <dd className="font-semibold">{reportData.length}</dd>
              </div>
              
              {chartType !== 'pie' && (
                <>
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
                </>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {reportType === 'expenses' ? 'Top Expenses' : 'Top Income Sources'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {chartType === 'pie' && reportData.slice(0, 5).map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Report Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartType !== 'pie' && reportData.length > 1 && (
                <div>
                  <h4 className="font-medium mb-1">Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const firstValue = reportData[0].expense || 0;
                      const lastValue = reportData[reportData.length - 1].expense || 0;
                      
                      if (firstValue === 0) return "No previous data to compare";
                      
                      const percentChange = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
                      const direction = lastValue > firstValue ? 'increased' : 'decreased';
                      
                      return `Your expenses have ${direction} by ${Math.abs(Number(percentChange))}% compared to the beginning of the period.`;
                    })()}
                  </p>
                </div>
              )}
              
              {reportType === 'expenses' && chartType === 'pie' && reportData.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Spending Distribution</h4>
                  <p className="text-sm text-muted-foreground">
                    Your largest spending category is <span className="font-medium">{reportData[0]?.name || 'N/A'}</span>, 
                    representing {reportData[0] ? ((reportData[0].value / reportData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1) : 0}% of your total expenses.
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-1">Recommendations</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {reportType === 'expenses' && (
                    <>
                      <li>Consider setting a budget for your top spending categories</li>
                      <li>Look for recurring expenses that could be reduced</li>
                    </>
                  )}
                  {reportType === 'income' && (
                    <>
                      <li>Diversify your income sources for financial security</li>
                      <li>Consider saving or investing a portion of your income</li>
                    </>
                  )}
                  <li>Review your transactions regularly to stay on top of your finances</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
