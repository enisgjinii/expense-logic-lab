
import React from 'react';

interface DashboardFiltersProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  timeRange,
  setTimeRange,
  isRefreshing,
  handleRefresh
}) => {
  return (
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
  );
};

export default DashboardFilters;
