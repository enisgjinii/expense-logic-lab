
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/finance-utils';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, BanknoteIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const TransactionIcon = ({ paymentType, type }: { paymentType: string; type: string }) => {
  if (type === 'Income') {
    return <ArrowUpRight className="h-5 w-5 text-income" />;
  }
  
  switch (paymentType) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    case 'CASH':
      return <BanknoteIcon className="h-5 w-5 text-muted-foreground" />;
    case 'TRANSFER':
    default:
      return <ArrowDownRight className="h-5 w-5 text-expense" />;
  }
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <Card className="h-full bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6">
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex justify-between items-center py-3 border-b last:border-b-0 group transition-all hover:bg-accent/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full p-2 bg-background">
                      <TransactionIcon paymentType={transaction.payment_type || 'TRANSFER'} type={transaction.type} />
                    </div>
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {transaction.category}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{transaction.account}</span>
                        <span className="text-xs">•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${transaction.type === 'Income' ? 'text-income' : 'text-expense'}`}>
                      {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </div>
                    <Badge variant="outline" className="text-xs font-normal bg-background/50">
                      {(transaction.payment_type || 'TRANSFER').replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No recent transactions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
