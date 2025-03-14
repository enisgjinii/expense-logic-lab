
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionsTable from '@/components/TransactionsTable';
import { useIsMobile, useDeviceSize } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const Transactions: React.FC = () => {
  const { transactions } = useFinance();
  const isMobile = useIsMobile();
  const { width } = useDeviceSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const isSmallScreen = width < 640;
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4 sm:space-y-8 pb-6 sm:pb-10 animate-in px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('transactions.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('transactions.description')}</p>
      </div>
      
      <Card className="border bg-background/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl">{t('transactions.management')}</CardTitle>
          <CardDescription>
            {t('transactions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <TransactionsTable transactions={transactions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
