
import React from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionsTable from '@/components/TransactionsTable';

const Transactions: React.FC = () => {
  const { transactions } = useFinance();
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <TransactionsTable transactions={transactions} />
    </div>
  );
};

export default Transactions;
