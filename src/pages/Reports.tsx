
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { addMonths, format, subMonths } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Download, BarChart3, PieChart, LineChart, TrendingUp, HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/finance-utils';

// Placeholder components for the actual reports
const IncomeExpenseTrendChart = () => (
  <div className="h-80 flex items-center justify-center border border-dashed rounded-lg">
    <div className="text-center space-y-2">
      <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground" />
      <p className="text-muted-foreground">Income vs Expense Trend Chart</p>
    </div>
  </div>
);

const CategoryBreakdownChart = () => (
  <div className="h-80 flex items-center justify-center border border-dashed rounded-lg">
    <div className="text-center space-y-2">
      <PieChart className="h-10 w-10 mx-auto text-muted-foreground" />
      <p className="text-muted-foreground">Category Breakdown Chart</p>
    </div>
  </div>
);

const MonthlyTrendChart = () => (
  <div className="h-80 flex items-center justify-center border border-dashed rounded-lg">
    <div className="text-center space-y-2">
      <LineChart className="h-10 w-10 mx-auto text-muted-foreground" />
      <p className="text-muted-foreground">Monthly Trend Chart</p>
    </div>
  </div>
);

const Reports = () => {
  const { stats } = useFinance();
  const [reportType, setReportType] = useState("expense-income");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState("month");

  // Generate summary data based on current filters
  const summaryData = {
    totalIncome: 12345.67,
    totalExpense: 8765.43,
    netSavings: 3580.24,
    savingsRate: 29,
    averageMonthlyExpense: 2921.81,
    topCategory: "Housing",
    topCategoryAmount: 2500,
    mostExpensiveMonth: "October",
    mostExpensiveMonthAmount: 3200,
  };

  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Analyze your financial data with customizable reports</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Customize your report view</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense-income">Expense vs. Income</SelectItem>
                <SelectItem value="category-breakdown">Category Breakdown</SelectItem>
                <SelectItem value="monthly-trend">Monthly Trend</SelectItem>
                <SelectItem value="savings-rate">Savings Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Group By</label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>
            {dateRange?.from && dateRange.to
              ? `${format(dateRange.from, "MMM d, yyyy")} to ${format(
                  dateRange.to,
                  "MMM d, yyyy"
                )}`
              : "Summary for the selected period"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-income">
                {formatCurrency(summaryData.totalIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-expense">
                {formatCurrency(summaryData.totalExpense)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Savings</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summaryData.netSavings)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-2xl font-bold">{summaryData.savingsRate}%</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Monthly Expense</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summaryData.averageMonthlyExpense)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-lg font-semibold">
                {summaryData.topCategory} ({formatCurrency(summaryData.topCategoryAmount)})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Highest Expense Month</p>
              <p className="text-lg font-semibold">
                {summaryData.mostExpensiveMonth} ({formatCurrency(summaryData.mostExpensiveMonthAmount)})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Visualizations */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Chart View
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Table View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "expense-income"
                  ? "Income vs Expenses Trend"
                  : reportType === "category-breakdown"
                  ? "Expense Categories Breakdown"
                  : reportType === "monthly-trend"
                  ? "Monthly Financial Trend"
                  : "Savings Rate Trends"}
              </CardTitle>
              <CardDescription>
                {reportType === "expense-income"
                  ? "Visualize your income and expenses over time"
                  : reportType === "category-breakdown"
                  ? "See where your money is being spent"
                  : reportType === "monthly-trend"
                  ? "Track your monthly financial patterns"
                  : "Monitor your savings rate progress"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === "expense-income" && <IncomeExpenseTrendChart />}
              {reportType === "category-breakdown" && <CategoryBreakdownChart />}
              {reportType === "monthly-trend" && <MonthlyTrendChart />}
              {reportType === "savings-rate" && <MonthlyTrendChart />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Data</CardTitle>
              <CardDescription>
                Tabular view of your financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Table view will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
