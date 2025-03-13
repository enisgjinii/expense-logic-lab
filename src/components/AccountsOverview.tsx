
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/finance-utils';
import { AccountSummary } from '@/types/finance';

interface AccountsOverviewProps {
  accounts: AccountSummary[];
}

const AccountsOverview: React.FC<AccountsOverviewProps> = ({ accounts }) => {
  const total = accounts.reduce((sum, account) => sum + account.total, 0);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Accounts Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No account data available
          </div>
        ) : (
          accounts.map((account, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{account.account}</span>
                <span className="text-sm">{formatCurrency(account.total)}</span>
              </div>
              <Progress 
                value={account.percentage} 
                className="h-2" 
                // Remove the indicatorClassName property
              />
              <div className="text-xs text-muted-foreground">
                {account.percentage.toFixed(1)}% of total
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsOverview;
