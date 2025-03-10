
import React from 'react';
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
  WalletCards 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { stats } = useFinance();
  
  if (!stats) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading statistics...</div>
      </div>
    );
  }
  
  const incomeChange = stats.byMonth.length > 1 ? 5.2 : 0; // Example
  const expenseChange = stats.byMonth.length > 1 ? -2.8 : 0; // Example
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatisticsCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend={{
            value: incomeChange,
            label: 'since last month'
          }}
          className="sm:col-span-1"
        />
        <StatisticsCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpense)}
          icon={<ArrowDownRight className="h-5 w-5" />}
          trend={{
            value: expenseChange,
            label: 'since last month'
          }}
          className="sm:col-span-1"
        />
        <StatisticsCard
          title="Current Balance"
          value={formatCurrency(stats.balance)}
          icon={<WalletCards className="h-5 w-5" />}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1 lg:col-span-2">
          <MonthlyChart data={stats.byMonth} />
        </div>
        <div className="md:col-span-1">
          <CategoryChart data={stats.byCategory} />
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentTransactions transactions={stats.recentTransactions} />
        </div>
        <div className="md:col-span-1">
          <AccountsOverview accounts={stats.byAccount} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
