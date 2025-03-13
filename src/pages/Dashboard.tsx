import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/finance-utils';
import StatisticsCard from '@/components/StatisticsCard';
import CategoryChart from '@/components/CategoryChart';
import MonthlyChart from '@/components/MonthlyChart';
import RecentTransactions from '@/components/RecentTransactions';
import AccountsOverview from '@/components/AccountsOverview';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  WalletCards,
  TrendingUp,
  Calendar,
  PieChart,
  List,
  Grip
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface DashboardPanel {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full';
}

const Dashboard = () => {
  const { stats, refreshData } = useFinance();
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  const [panels, setPanels] = useState<DashboardPanel[]>(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        return JSON.parse(savedLayout);
      } catch (e) {
        console.error('Failed to parse saved dashboard layout');
      }
    }
    
    return [
      { id: 'stats', title: 'Key Statistics', component: 'statistics', size: 'full' },
      { id: 'monthly', title: 'Monthly Overview', component: 'monthlyChart', size: 'medium' },
      { id: 'categories', title: 'Expense Categories', component: 'categoryChart', size: 'small' },
      { id: 'accounts', title: 'Accounts', component: 'accounts', size: 'small' },
      { id: 'transactions', title: 'Recent Transactions', component: 'transactions', size: 'medium' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('dashboardLayout', JSON.stringify(panels));
  }, [panels]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Dashboard Refreshed", description: "Latest data has been loaded" });
    }, 800);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 300000);
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(panels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPanels(items);
    toast({ title: "Layout Updated", description: "Dashboard layout has been saved" });
  };

  const incomeChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].income - stats.byMonth[stats.byMonth.length - 2].income) / 
       (stats.byMonth[stats.byMonth.length - 2].income || 1)) * 100 
    : 0;
  
  const expenseChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].expense - stats.byMonth[stats.byMonth.length - 2].expense) / 
       (stats.byMonth[stats.byMonth.length - 2].expense || 1)) * 100 
    : 0;

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

  const getInsights = () => {
    const highestExpenseCategory = [...stats.byCategory].sort((a, b) => b.total - a.total)[0];
    
    const growingExpenses = stats.byMonth.length > 2 
      ? stats.byCategory.map(cat => {
          const prevMonthCategories = stats.byMonth[stats.byMonth.length - 2].categories || [];
          const prevCategory = prevMonthCategories.find(c => c.category === cat.category);
          const prevAmount = prevCategory ? prevCategory.total : 0;
          
          const growth = prevAmount > 0 ? (cat.total - prevAmount) / prevAmount * 100 : 0;
          return { 
            ...cat, 
            growth 
          };
        }).sort((a, b) => b.growth - a.growth)[0]
      : null;
    
    return {
      highestExpense: highestExpenseCategory,
      growingExpense: growingExpenses,
      savingsRate: stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100) : 0
    };
  };

  const insights = getInsights();

  const renderPanelContent = (panel: DashboardPanel) => {
    switch(panel.component) {
      case 'statistics':
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatisticsCard
              title="Total Income"
              value={formatCurrency(stats.totalIncome)}
              icon={<ArrowUpRight className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: Number(incomeChange.toFixed(1)),
                label: 'since last month'
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Total Expenses"
              value={formatCurrency(stats.totalExpense)}
              icon={<ArrowDownRight className="h-5 w-5 text-rose-500" />}
              trend={{
                value: Number(expenseChange.toFixed(1)),
                label: 'since last month'
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Current Balance"
              value={formatCurrency(stats.balance)}
              icon={<WalletCards className="h-5 w-5 text-blue-500" />}
              trend={{
                value: Number(insights.savingsRate.toFixed(1)),
                label: 'savings rate'
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Highest Expense"
              value={insights.highestExpense ? insights.highestExpense.category : 'N/A'}
              description={insights.highestExpense ? formatCurrency(insights.highestExpense.total) : ''}
              icon={<CreditCard className="h-5 w-5 text-purple-500" />}
              className="sm:col-span-1"
              onClick={() => insights.highestExpense && setHighlightedCategory(insights.highestExpense.category)}
            />
          </div>
        );
      case 'monthlyChart':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Income vs Expenses</h2>
              <span className="text-sm text-muted-foreground">{timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '3 months' : '12 months'}</span>
            </div>
            <MonthlyChart data={getFilteredData()} />
          </div>
        );
      case 'categoryChart':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
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
              selectedCategory={highlightedCategory}
              onCategorySelect={(category) => setHighlightedCategory(category)}
            />
          </div>
        );
      case 'accounts':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Accounts</h2>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{stats.byAccount.length}</span>
            </div>
            <AccountsOverview accounts={stats.byAccount} />
          </div>
        );
      case 'transactions':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Transactions</h2>
              <button className="text-sm text-blue-500 hover:underline">
                View all
              </button>
            </div>
            <RecentTransactions transactions={stats.recentTransactions.slice(0, 5)} />
          </div>
        );
      default:
        return <div>Unknown panel type</div>;
    }
  };

  const getPanelClasses = (size: string) => {
    switch(size) {
      case 'small': return 'col-span-12 md:col-span-4';
      case 'medium': return 'col-span-12 md:col-span-8';
      case 'large': return 'col-span-12';
      case 'full': return 'col-span-12';
      default: return 'col-span-12 md:col-span-6';
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-in">
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
                  Your spending on <strong>{insights.growingExpense?.category}</strong> has increased by {insights.growingExpense?.growth.toFixed(1)}% compared to last month.
                </div>
              </div>
            </div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-panels" direction="vertical">
              {(provided) => (
                <div 
                  className="grid gap-6 grid-cols-12" 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {panels.map((panel, index) => (
                    <Draggable key={panel.id} draggableId={panel.id} index={index}>
                      {(provided) => (
                        <div
                          className={`${getPanelClasses(panel.size)} group`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div className="h-full relative">
                            <div 
                              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 rounded-md p-1 cursor-move"
                              {...provided.dragHandleProps}
                            >
                              <Grip className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {renderPanelContent(panel)}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
          <RecentTransactions transactions={stats.recentTransactions} />
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
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted ${highlightedCategory === category.category ? 'bg-blue-50 border border-blue-200' : ''}`}
                  onClick={() => setHighlightedCategory(category.category === highlightedCategory ? null : category.category)}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: category.color || `hsl(${idx * 50}, 70%, 50%)`}} />
                    <span>{category.category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(category.total)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-medium mb-4">Category Breakdown</h2>
            <CategoryChart 
              data={stats.byCategory}
              selectedCategory={highlightedCategory}
              onCategorySelect={(category) => setHighlightedCategory(category)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;