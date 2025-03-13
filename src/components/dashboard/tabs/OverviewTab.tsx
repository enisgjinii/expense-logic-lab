
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
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(panels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPanels(items);
  };

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
      case 'quarter':
        return stats.byMonth.slice(-3);
      case 'year':
        return stats.byMonth.slice(-12);
      default:
        return stats.byMonth.slice(-1);
    }
  };

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
                value: Number(savingsRate.toFixed(1)),
                label: 'savings rate'
              }}
              className="sm:col-span-1"
            />
            <StatisticsCard
              title="Highest Expense"
              value={stats.byCategory.length > 0 ? stats.byCategory[0].category : 'N/A'}
              description={stats.byCategory.length > 0 ? formatCurrency(stats.byCategory[0].total) : ''}
              icon={<CreditCard className="h-5 w-5 text-purple-500" />}
              className="sm:col-span-1"
              onClick={() => stats.byCategory.length > 0 && setHighlightedCategory(stats.byCategory[0].category)}
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
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {panels.map((panel, index) => (
                <DashboardPanel 
                  key={panel.id} 
                  id={panel.id} 
                  index={index} 
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
