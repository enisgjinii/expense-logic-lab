
import React from 'react';
import { TrendingUp, List, PieChart } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
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
  );
};

export default DashboardTabs;
