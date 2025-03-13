
import React from 'react';
import RecentTransactions from '@/components/RecentTransactions';
import { Transaction } from '@/types/finance';

interface TransactionsTabProps {
  transactions: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  return (
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
      <RecentTransactions transactions={transactions} />
    </div>
  );
};

export default TransactionsTab;
