
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountSummary } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';
import { Progress } from '@/components/ui/progress';

interface AccountsOverviewProps {
  accounts: AccountSummary[];
}

const AccountsOverview: React.FC<AccountsOverviewProps> = ({ accounts }) => {
  return (
    <Card className="bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <CardTitle className="text-xl">Accounts Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length > 0 ? (
          <div className="space-y-4">
            {accounts.map((account, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{account.account}</span>
                  <span 
                    className={account.total >= 0 ? 'text-income' : 'text-expense'}
                  >
                    {formatCurrency(account.total)}
                  </span>
                </div>
                <Progress 
                  value={account.percentage} 
                  className="h-2" 
                  indicatorClassName={account.total >= 0 ? 'bg-income' : 'bg-expense'} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No account data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsOverview;
