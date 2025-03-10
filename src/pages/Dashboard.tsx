import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import StatisticsCard from '@/components/StatisticsCard';
import CategoryChart from '@/components/CategoryChart';
import MonthlyChart from '@/components/MonthlyChart';
import RecentTransactions from '@/components/RecentTransactions';
import AccountsOverview from '@/components/AccountsOverview';
import {
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  WalletCards,
  TrendingUp,
  Calendar,
  PieChart,
  List
} from 'lucide-react';

const Dashboard = () => {
  const { stats, refreshData } = useFinance();
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState(null);

  // Simulate data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [refreshData]);

  if (!stats) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-400 animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Calculate trend values more dynamically
  const incomeChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].income - stats.byMonth[stats.byMonth.length - 2].income) / 
       stats.byMonth[stats.byMonth.length - 2].income) * 100 
    : 0;
  
  const expenseChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].expense - stats.byMonth[stats.byMonth.length - 2].expense) / 
       stats.byMonth[stats.byMonth.length - 2].expense) * 100 
    : 0;

  // Filter data based on timeRange
  const getFilteredData = () => {
    switch(timeRange) {
      case 'quarter':
        return stats.byMonth.slice(-3);
      case 'year':
        return stats.byMonth.slice(-12);
      default:
        return stats.byMonth.slice(-1);
    }
  };

  // Get insights based on current data
  const getInsights = () => {
    // Find highest expense category
    const highestExpenseCategory = [...stats.byCategory].sort((a, b) => b.amount - a.amount)[0];
    
    // Find fastest growing expense
    const growingExpenses = stats.byMonth.length > 2 
      ? stats.byCategory.map(cat => {
          const prevMonth = stats.byMonth[stats.byMonth.length - 2].categories?.find(c => c.name === cat.name)?.amount || 0;
          const growth = prevMonth > 0 ? (cat.amount - prevMonth) / prevMonth * 100 : 0;
          return { ...cat, growth };
        }).sort((a, b) => b.growth - a.growth)[0]
      : null;
    
    return {
      highestExpense: highestExpenseCategory,
      growingExpense: growingExpenses,
      savingsRate: ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)
    };
  };

  const insights = getInsights();

  return (
    <div className="space-y-6 pb-10 animate-in">
      {/* Dashboard Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Financial Dashboard</h1>
        
        <div className="flex space-x-2 items-center">
          <div className="bg-card rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-md text-sm ${timeRange === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 rounded-md text-sm ${timeRange === 'quarter' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Quarter
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded-md text-sm ${timeRange === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Year
            </button>
          </div>
          
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-muted transition-all"
          >
            <svg className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 font-medium ${activeTab === 'overview' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-2 px-1 font-medium ${activeTab === 'transactions' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>Transactions</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2 px-1 font-medium ${activeTab === 'categories' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Categories</span>
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards with Animated Counters */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatisticsCard
              title="Total Income"
              value={formatCurrency(stats.totalIncome)}
              icon={<ArrowUpRight className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: incomeChange.toFixed(1),
                label: 'since last month',
                isPositive: incomeChange >= 0
              }}
              className="sm:col-span-1"
              animated={true}
            />
            <StatisticsCard
              title="Total Expenses"
              value={formatCurrency(stats.totalExpense)}
              icon={<ArrowDownRight className="h-5 w-5 text-rose-500" />}
              trend={{
                value: expenseChange.toFixed(1),
                label: 'since last month',
                isPositive: expenseChange <= 0
              }}
              className="sm:col-span-1"
              animated={true}
            />
            <StatisticsCard
              title="Current Balance"
              value={formatCurrency(stats.balance)}
              icon={<WalletCards className="h-5 w-5 text-blue-500" />}
              trend={{
                value: insights.savingsRate,
                label: 'savings rate',
                isPositive: true
              }}
              className="sm:col-span-1"
              animated={true}
            />
            <StatisticsCard
              title="Highest Expense"
              value={insights.highestExpense ? insights.highestExpense.name : 'N/A'}
              subvalue={insights.highestExpense ? formatCurrency(insights.highestExpense.amount) : ''}
              icon={<CreditCard className="h-5 w-5 text-purple-500" />}
              className="sm:col-span-1"
              onClick={() => setHighlightedCategory(insights.highestExpense?.name)}
              interactive={true}
            />
          </div>
          
          {/* Financial Insights Banner */}
          {insights.growingExpense && insights.growingExpense.growth > 10 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Spending Alert</h3>
                  <div className="mt-1 text-sm text-amber-700">
                    Your spending on <strong>{insights.growingExpense.name}</strong> has increased by {insights.growingExpense.growth.toFixed(1)}% compared to last month.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Charts Section */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Income vs Expenses</h2>
                <span className="text-sm text-muted-foreground">{timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '3 months' : '12 months'}</span>
              </div>
              <MonthlyChart 
                data={getFilteredData()} 
                animate={true} 
                showTooltips={true}
                onHover={(month) => console.log('Hovering month:', month)}
              />
            </div>
            <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Expense Breakdown</h2>
                <button 
                  onClick={() => setHighlightedCategory(null)} 
                  className={`text-xs px-2 py-1 rounded-full ${highlightedCategory ? 'bg-muted' : 'hidden'}`}
                >
                  Reset
                </button>
              </div>
              <CategoryChart 
                data={stats.byCategory} 
                highlightCategory={highlightedCategory}
                onCategoryClick={(category) => setHighlightedCategory(category)}
                animate={true}
                interactive={true}
              />
            </div>
          </div>
          
          {/* Accounts Overview */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Accounts</h2>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{stats.byAccount.length}</span>
              </div>
              <AccountsOverview 
                accounts={stats.byAccount} 
                showActions={true}
                onAccountClick={(account) => console.log('Account clicked:', account)}
              />
            </div>
            <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Recent Transactions</h2>
                <button className="text-sm text-blue-500 hover:underline">
                  View all
                </button>
              </div>
              <RecentTransactions 
                transactions={stats.recentTransactions.slice(0, 5)} 
                interactive={true}
                onTransactionClick={(transaction) => console.log('Transaction clicked:', transaction)}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">All Transactions</h2>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="px-3 py-2 text-sm rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Filter
              </button>
            </div>
          </div>
          <RecentTransactions 
            transactions={stats.recentTransactions} 
            showFilters={true}
            pagination={true}
            itemsPerPage={10}
            interactive={true}
          />
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-1 bg-card rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-medium mb-4">Top Categories</h2>
            <div className="space-y-4">
              {stats.byCategory.slice(0, 5).map((category, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted ${highlightedCategory === category.name ? 'bg-blue-50 border border-blue-200' : ''}`}
                  onClick={() => setHighlightedCategory(category.name === highlightedCategory ? null : category.name)}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: category.color || `hsl(${idx * 50}, 70%, 50%)`}} />
                    <span>{category.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(category.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-medium mb-4">Category Breakdown</h2>
            <CategoryChart 
              data={stats.byCategory}
              highlightCategory={highlightedCategory}
              onCategoryClick={(category) => setHighlightedCategory(category)}
              showLegend={true}
              showPercentages={true}
              animate={true}
              interactive={true}
              layout="full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;