
import React from 'react';
import { TrendingUp, List, PieChart, BarChart } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b mb-6">
      <div className="flex flex-wrap space-x-2 sm:space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 font-medium flex items-center ${activeTab === 'overview' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart className="h-4 w-4 mr-2" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-2 px-1 font-medium flex items-center ${activeTab === 'transactions' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <List className="h-4 w-4 mr-2" />
          <span>Transactions</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2 px-1 font-medium flex items-center ${activeTab === 'categories' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <PieChart className="h-4 w-4 mr-2" />
          <span>Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-2 px-1 font-medium flex items-center ${activeTab === 'trends' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          <span>Trends</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardTabs;
