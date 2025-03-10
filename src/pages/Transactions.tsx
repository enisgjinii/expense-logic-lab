
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionsTable from '@/components/TransactionsTable';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Transactions: React.FC = () => {
  const { transactions, isLoading } = useFinance();
  const navigate = useNavigate();
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View, search, and manage your financial transactions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-1"
            onClick={() => navigate('/import')}
          >
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          
          <Button 
            className="gap-1"
            onClick={() => navigate('/import')}
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TransactionsTable transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="income" className="mt-6">
          <TransactionsTable 
            transactions={transactions.filter(t => t.type === 'Income')} 
          />
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <TransactionsTable 
            transactions={transactions.filter(t => t.type === 'Expense')} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transactions;
