
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import OverviewTab from '@/components/dashboard/tabs/OverviewTab';
import { getInsights } from '@/utils/dashboard-utils';

interface DashboardPanel {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full';
}

const Dashboard = () => {
  const { stats, refreshData } = useFinance();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('month');
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
      { id: 'stats', title: t('dashboard.keyStats'), component: 'statistics', size: 'full' },
      { id: 'monthly', title: t('dashboard.monthlyOverview'), component: 'monthlyChart', size: 'medium' },
      { id: 'categories', title: t('dashboard.expenseCategories'), component: 'categoryChart', size: 'small' },
      { id: 'accounts', title: t('dashboard.accounts'), component: 'accounts', size: 'small' },
      { id: 'transactions', title: t('dashboard.recentTransactions'), component: 'transactions', size: 'medium' },
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
      toast({ 
        title: "Dashboard Refreshed", 
        description: "Latest data has been loaded" 
      });
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
          <p className="mt-4 text-muted-foreground">{t('general.loading')}</p>
        </div>
      </div>
    );
  }

  const insights = getInsights(stats);

  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">{t('dashboard.title')}</h1>
        <DashboardFilters 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isRefreshing={isRefreshing}
          handleRefresh={handleRefresh}
        />
      </div>
      
      <OverviewTab
        stats={stats}
        panels={panels}
        setPanels={setPanels}
        timeRange={timeRange}
        highlightedCategory={highlightedCategory}
        setHighlightedCategory={setHighlightedCategory}
        growingExpense={insights.growingExpense}
      />
    </div>
  );
};

export default Dashboard;
