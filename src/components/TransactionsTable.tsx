
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/finance-utils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  SlidersHorizontal,
  SortAsc, 
  SortDesc, 
  CreditCard,
  Coins,
  Wallet,
  ArrowLeftRight
} from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const PaymentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'CREDIT_CARD':
      return <CreditCard className="h-4 w-4 mr-1" />;
    case 'DEBIT_CARD':
      return <CreditCard className="h-4 w-4 mr-1" />;
    case 'CASH':
      return <Wallet className="h-4 w-4 mr-1" />;
    case 'TRANSFER':
      return <ArrowLeftRight className="h-4 w-4 mr-1" />;
    default:
      return <Coins className="h-4 w-4 mr-1" />;
  }
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(transaction => {
    // Apply search filter
    const matchesSearch = 
      transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.note.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply type filter
    const matchesType = typeFilter ? transaction.type === typeFilter : true;
    
    // Apply payment type filter
    const matchesPayment = paymentFilter ? transaction.payment_type === paymentFilter : true;
    
    return matchesSearch && matchesType && matchesPayment;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // Special case for dates
    if (sortBy === 'date') {
      valueA = new Date(valueA as string).getTime();
      valueB = new Date(valueB as string).getTime();
    }
    
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: keyof Transaction) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (column: keyof Transaction) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="ml-1 h-4 w-4" /> : 
      <SortDesc className="ml-1 h-4 w-4" />;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setPaymentFilter(null);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">All Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-[200px] md:w-[300px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setTypeFilter(null)} className="justify-between">
                  All Types {typeFilter === null && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('Income')} className="justify-between">
                  Income {typeFilter === 'Income' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('Expense')} className="justify-between">
                  Expense {typeFilter === 'Expense' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem className="h-px my-1 p-0" />
                <DropdownMenuItem onClick={() => setPaymentFilter(null)} className="justify-between">
                  All Payment Methods {paymentFilter === null && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('CASH')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="CASH" /> Cash</div>
                  {paymentFilter === 'CASH' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('CREDIT_CARD')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="CREDIT_CARD" /> Credit Card</div>
                  {paymentFilter === 'CREDIT_CARD' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('DEBIT_CARD')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="DEBIT_CARD" /> Debit Card</div>
                  {paymentFilter === 'DEBIT_CARD' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('TRANSFER')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="TRANSFER" /> Transfer</div>
                  {paymentFilter === 'TRANSFER' && <span>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem className="h-px my-1 p-0" />
                <DropdownMenuItem onClick={resetFilters}>
                  Reset All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[120px] cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <span className="flex items-center">
                    Date {renderSortIcon('date')}
                  </span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('account')}
                >
                  <span className="flex items-center">
                    Account {renderSortIcon('account')}
                  </span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  <span className="flex items-center">
                    Category {renderSortIcon('category')}
                  </span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('amount')}
                >
                  <span className="flex items-center justify-end">
                    Amount {renderSortIcon('amount')}
                  </span>
                </TableHead>
                <TableHead className="text-right">Type</TableHead>
                <TableHead className="text-right">Payment</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="group hover:bg-accent/30">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell 
                      className={`text-right font-medium ${
                        transaction.type === 'Income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={transaction.type === 'Income' ? 'outline' : 'secondary'}
                        className={`
                          ${transaction.type === 'Income' 
                            ? 'border-income/50 bg-income/10 text-income' 
                            : 'border-expense/50 bg-expense/10 text-expense'
                          }
                        `}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="flex items-center justify-center gap-1 w-fit ml-auto">
                        <PaymentTypeIcon type={transaction.payment_type} />
                        <span className="hidden sm:inline">{transaction.payment_type.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {transaction.note || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
