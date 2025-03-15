
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Plus, FileDown, FilePieChart, ImageDown, Users } from 'lucide-react';
import TransactionFormEnhanced from '@/components/TransactionFormEnhanced';
import { format, subDays, isAfter } from 'date-fns';
import { SplitParticipant } from '@/types/finance';

export const TransactionsTable = () => {
  const { transactions } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get unique categories
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();
  
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const searchMatch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Time filter
    let timeMatch = true;
    const transactionDate = new Date(transaction.date);
    
    if (timeFilter === 'today') {
      const today = new Date();
      timeMatch = transactionDate.toDateString() === today.toDateString();
    } else if (timeFilter === 'week') {
      const weekAgo = subDays(new Date(), 7);
      timeMatch = isAfter(transactionDate, weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = subDays(new Date(), 30);
      timeMatch = isAfter(transactionDate, monthAgo);
    }
    
    // Category filter
    const categoryMatch = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    return searchMatch && timeMatch && categoryMatch;
  }).sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const getAttachmentsInfo = (transaction: any) => {
    const hasImages = transaction.imageAttachments && transaction.imageAttachments.length > 0;
    const hasDetailedNotes = transaction.notes_detailed && transaction.notes_detailed.trim() !== '';
    const hasSplit = transaction.splitWith && transaction.splitWith.length > 0;
    
    return (
      <div className="flex gap-1">
        {hasImages && <ImageDown className="h-3.5 w-3.5 text-blue-500" />}
        {hasDetailedNotes && <FileDown className="h-3.5 w-3.5 text-amber-500" />}
        {hasSplit && <Users className="h-3.5 w-3.5 text-purple-500" />}
      </div>
    );
  };
  
  const getSplitStatus = (splitWith: SplitParticipant[] | undefined) => {
    if (!splitWith || splitWith.length === 0) return null;
    
    const total = splitWith.length;
    const paid = splitWith.filter(p => p.paid).length;
    
    return (
      <div className="text-xs flex items-center gap-1">
        <Users className="h-3 w-3" />
        <span>{paid}/{total} paid</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filters
          </Button>
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-md">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Category</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Additional filters can be added here */}
        </div>
      )}
      
      <div>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 border rounded-md">
            <FilePieChart className="h-10 w-10 mx-auto opacity-20 mb-2" />
            <p className="text-muted-foreground">
              No transactions found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-3 text-sm">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium line-clamp-1">{transaction.description || "Unnamed Transaction"}</div>
                      {transaction.notes && <div className="text-xs text-muted-foreground line-clamp-1">{transaction.notes}</div>}
                      {transaction.splitWith && getSplitStatus(transaction.splitWith)}
                    </td>
                    <td className="py-2 px-3 text-sm">{transaction.category}</td>
                    <td className="py-2 px-3">
                      <div className={`font-medium ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">{transaction.account}</div>
                    </td>
                    <td className="py-2 px-3">
                      {getAttachmentsInfo(transaction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <div className="space-y-4 sm:space-y-8 pb-6 sm:pb-10 animate-in px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage your income and expenses</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <TransactionFormEnhanced onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="border bg-background/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Transaction History</CardTitle>
          <CardDescription>
            View, filter and manage all your transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="mt-2">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="split">Split Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <TransactionsTable />
            </TabsContent>
            <TabsContent value="expense" className="mt-4">
              <p>Expenses content</p>
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <p>Income content</p>
            </TabsContent>
            <TabsContent value="split" className="mt-4">
              <p>Split expenses content</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
