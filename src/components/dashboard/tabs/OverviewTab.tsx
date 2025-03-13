<<<<<<< HEAD
=======

>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import DashboardPanel from '../DashboardPanel';
import StatisticsCard from '@/components/StatisticsCard';
import MonthlyChart from '@/components/MonthlyChart';
import CategoryChart from '@/components/CategoryChart';
import AccountsOverview from '@/components/AccountsOverview';
import RecentTransactions from '@/components/RecentTransactions';
import SpendingAlert from '../SpendingAlert';
import { DashboardStats } from '@/types/finance';
import { ArrowDownRight, ArrowUpRight, WalletCards, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/finance-utils';

interface DashboardPanel {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full';
}

interface OverviewTabProps {
  stats: DashboardStats;
  panels: DashboardPanel[];
  setPanels: React.Dispatch<React.SetStateAction<DashboardPanel[]>>;
  timeRange: string;
  highlightedCategory: string | null;
  setHighlightedCategory: (category: string | null) => void;
  growingExpense: { category: string; growth: number } | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  panels,
  setPanels,
  timeRange,
  highlightedCategory,
  setHighlightedCategory,
  growingExpense
}) => {
<<<<<<< HEAD
  // --- DRAG & DROP HANDLING ---
=======
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(panels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPanels(items);
  };

<<<<<<< HEAD
  // --- TIME RANGE LOGIC ---
  // This function returns just the months needed for the current period based on the timeRange.
  // - 'month'  => last 1 month
  // - 'quarter'=> last 3 months
  // - 'year'   => last 12 months
  const getFilteredData = () => {
    switch (timeRange) {
=======
  const incomeChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].income - stats.byMonth[stats.byMonth.length - 2].income) / 
       (stats.byMonth[stats.byMonth.length - 2].income || 1)) * 100 
    : 0;
  
  const expenseChange = stats.byMonth.length > 1 
    ? ((stats.byMonth[stats.byMonth.length - 1].expense - stats.byMonth[stats.byMonth.length - 2].expense) / 
       (stats.byMonth[stats.byMonth.length - 2].expense || 1)) * 100 
    : 0;

  const savingsRate = stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100) : 0;

  const getFilteredData = () => {
    switch(timeRange) {
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
      case 'quarter':
        return stats.byMonth.slice(-3);
      case 'year':
        return stats.byMonth.slice(-12);
      default:
        return stats.byMonth.slice(-1);
    }
  };

<<<<<<< HEAD
  // For calculating "period over period" change, we need:
  // - currentPeriod => the last N months
  // - previousPeriod => the N months before that
  const monthsNeeded = timeRange === 'quarter'
    ? 3
    : timeRange === 'year'
      ? 12
      : 1; // default is 'month'

  const totalMonths = stats.byMonth.length;
  // Current period is the last N months:
  const currentPeriod = stats.byMonth.slice(Math.max(totalMonths - monthsNeeded, 0));
  // Previous period is the N months before that:
  const previousPeriod = stats.byMonth.slice(Math.max(totalMonths - monthsNeeded * 2, 0), Math.max(totalMonths - monthsNeeded, 0));

  // Sum incomes/expenses in each period
  const currentIncome = currentPeriod.reduce((sum, m) => sum + m.income, 0);
  const currentExpense = currentPeriod.reduce((sum, m) => sum + m.expense, 0);
  const previousIncome = previousPeriod.reduce((sum, m) => sum + m.income, 0);
  const previousExpense = previousPeriod.reduce((sum, m) => sum + m.expense, 0);

  // % change calculations
  const incomeChange = previousIncome
    ? ((currentIncome - previousIncome) / previousIncome) * 100
    : 0;

  const expenseChange = previousExpense
    ? ((currentExpense - previousExpense) / previousExpense) * 100
    : 0;

  // Dynamic label for the trend card based on the time range
  const periodLabel = timeRange === 'quarter'
    ? 'since last quarter'
    : timeRange === 'year'
      ? 'since last year'
      : 'since last month';

  // Example: overall savings rate is unaffected by the "timeRange" for now,
  // but you could also slice or filter if you want a time-range-specific rate.
  const savingsRate =
    stats.totalIncome > 0
      ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100
      : 0;

  // Render the correct component by panel type
  const renderPanelContent = (panel: DashboardPanel) => {
    switch (panel.component) {
=======
  const renderPanelContent = (panel: DashboardPanel) => {
    switch(panel.component) {
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
      case 'statistics':
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatisticsCard
              title="Total Income"
<<<<<<< HEAD
              value={formatCurrency(currentIncome)}
              icon={<ArrowUpRight className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: Number(incomeChange.toFixed(1)),
                label: periodLabel,
=======
              value={formatCurrency(stats.totalIncome)}
              icon={<ArrowUpRight className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: Number(incomeChange.toFixed(1)),
                label: 'since last month'
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Total Expenses"
<<<<<<< HEAD
              value={formatCurrency(currentExpense)}
              icon={<ArrowDownRight className="h-5 w-5 text-rose-500" />}
              trend={{
                value: Number(expenseChange.toFixed(1)),
                label: periodLabel,
=======
              value={formatCurrency(stats.totalExpense)}
              icon={<ArrowDownRight className="h-5 w-5 text-rose-500" />}
              trend={{
                value: Number(expenseChange.toFixed(1)),
                label: 'since last month'
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Current Balance"
<<<<<<< HEAD
              // Using entire stats.balance for now; 
              // or you could do a sum of the last period if you want it time-range-based.
=======
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              value={formatCurrency(stats.balance)}
              icon={<WalletCards className="h-5 w-5 text-blue-500" />}
              trend={{
                value: Number(savingsRate.toFixed(1)),
<<<<<<< HEAD
                label: 'savings rate',
=======
                label: 'savings rate'
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Highest Expense"
<<<<<<< HEAD
              value={
                stats.byCategory.length > 0
                  ? stats.byCategory[0].category
                  : 'N/A'
              }
              description={
                stats.byCategory.length > 0
                  ? formatCurrency(stats.byCategory[0].total)
                  : ''
              }
              icon={<CreditCard className="h-5 w-5 text-purple-500" />}
              className="sm:col-span-1"
              onClick={() =>
                stats.byCategory.length > 0 &&
                setHighlightedCategory(stats.byCategory[0].category)
              }
=======
              value={stats.byCategory.length > 0 ? stats.byCategory[0].category : 'N/A'}
              description={stats.byCategory.length > 0 ? formatCurrency(stats.byCategory[0].total) : ''}
              icon={<CreditCard className="h-5 w-5 text-purple-500" />}
              className="sm:col-span-1"
              onClick={() => stats.byCategory.length > 0 && setHighlightedCategory(stats.byCategory[0].category)}
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
            />
          </div>
        );
      case 'monthlyChart':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Income vs Expenses</h2>
<<<<<<< HEAD
              <span className="text-sm text-muted-foreground">
                {timeRange === 'month'
                  ? '30 days'
                  : timeRange === 'quarter'
                    ? '3 months'
                    : '12 months'}
              </span>
=======
              <span className="text-sm text-muted-foreground">{timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '3 months' : '12 months'}</span>
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
            </div>
            <MonthlyChart data={getFilteredData()} />
          </div>
        );
      case 'categoryChart':
        return (
          <div className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Expense Breakdown</h2>
<<<<<<< HEAD
              <button
                onClick={() => setHighlightedCategory(null)}
                className={`text-xs px-2 py-1 rounded-full ${highlightedCategory ? 'bg-muted' : 'hidden'
                  }`}
=======
              <button 
                onClick={() => setHighlightedCategory(null)} 
                className={`text-xs px-2 py-1 rounded-full ${highlightedCategory ? 'bg-muted' : 'hidden'}`}
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              >
                Reset
              </button>
            </div>
<<<<<<< HEAD
            <CategoryChart
=======
            <CategoryChart 
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
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
<<<<<<< HEAD
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {stats.byAccount.length}
              </span>
=======
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{stats.byAccount.length}</span>
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
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
<<<<<<< HEAD
            <RecentTransactions
              transactions={stats.recentTransactions.slice(0, 5)}
            />
=======
            <RecentTransactions transactions={stats.recentTransactions.slice(0, 5)} />
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
          </div>
        );
      default:
        return <div>Unknown panel type</div>;
    }
  };
<<<<<<< HEAD

  return (
    <>
      {/* Optional: show an alert if there's a growing expense category */}
      {growingExpense && (
        <SpendingAlert
          category={growingExpense.category}
          growth={growingExpense.growth}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-panels" direction="vertical">
          {(provided) => (
            <div
              className="grid gap-6 grid-cols-12"
=======
  
  return (
    <>
      {growingExpense && (
        <SpendingAlert 
          category={growingExpense.category} 
          growth={growingExpense.growth} 
        />
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-panels" direction="vertical">
          {(provided) => (
            <div 
              className="grid gap-6 grid-cols-12" 
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {panels.map((panel, index) => (
<<<<<<< HEAD
                <DashboardPanel
                  key={panel.id}
                  id={panel.id}
                  index={index}
=======
                <DashboardPanel 
                  key={panel.id} 
                  id={panel.id} 
                  index={index} 
>>>>>>> b0a20ab2bd659396e777232ab7c9eb04c0939a60
                  size={panel.size}
                >
                  {renderPanelContent(panel)}
                </DashboardPanel>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default OverviewTab;
