
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionsTable from '@/components/TransactionsTable';
import { useIsMobile, useDeviceSize } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const Transactions: React.FC = () => {
  const { transactions } = useFinance();
  const isMobile = useIsMobile();
  const { width } = useDeviceSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const isSmallScreen = width < 640;

  const filteredTransactions = transactions.filter(tx => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      [tx.category, tx.description, tx.account].some(
        field => (field || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Apply time filter
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();
      
      switch (timeFilter) {
        case 'today':
          matchesTime = txDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          matchesTime = txDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          matchesTime = txDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          matchesTime = txDate >= yearAgo;
          break;
      }
    }
    
    return matchesSearch && matchesTime;
  });
  
  return (
    <div className="space-y-4 sm:space-y-8 pb-6 sm:pb-10 animate-in px-2 sm:px-0">
      <div className="bg-background/60 backdrop-blur-sm p-3 sm:p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-8 h-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[140px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
              
              {isSmallScreen && (
                <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-2 bg-card rounded-md overflow-hidden">
          <TransactionsTable transactions={filteredTransactions} />
        </div>
      </div>
    </div>
  );
};

export default Transactions;
