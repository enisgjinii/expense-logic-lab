
import React from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionsTable from '@/components/TransactionsTable';
import { useIsMobile } from '@/hooks/use-mobile';

const Transactions: React.FC = () => {
  const { transactions } = useFinance();
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4 sm:space-y-8 pb-6 sm:pb-10 animate-in px-2 sm:px-0">
      <TransactionsTable transactions={transactions} />
    </div>
  );
};

export default Transactions;
