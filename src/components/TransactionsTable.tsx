import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  DropdownMenuTrigger
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
  ArrowLeftRight,
  Download
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/finance-utils';

// Render a small icon based on payment type
const PaymentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'CREDIT_CARD':
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

interface TransactionsTableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Precompute summary totals
  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'Expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  // Gather all distinct accounts for the Account filter dropdown
  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => set.add(tx.account));
    return Array.from(set).sort();
  }, [transactions]);

  // Filter transactions based on search, type/payment, date range, and account
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = [
        tx.account.toLowerCase(),
        tx.category.toLowerCase(),
        (tx.note ?? '').toLowerCase()
      ].some(str => str.includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter ? tx.type === typeFilter : true;
      const matchesPayment = paymentFilter ? tx.payment_type === paymentFilter : true;
      const matchesAccount = accountFilter ? tx.account === accountFilter : true;

      let matchesDate = true;
      if (startDate) {
        matchesDate = new Date(tx.date) >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(tx.date) <= new Date(endDate);
      }
      return matchesSearch && matchesType && matchesPayment && matchesAccount && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, paymentFilter, accountFilter, startDate, endDate]);

  // Sort the filtered list
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTransactions, sortBy, sortOrder]);

  // Paginate
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);

  // Sorting logic
  const handleSort = (column: keyof Transaction) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  const renderSortIcon = (column: keyof Transaction) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc'
      ? <SortAsc className="ml-1 h-4 w-4" />
      : <SortDesc className="ml-1 h-4 w-4" />;
  };

  // Clear all filters
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setPaymentFilter(null);
    setAccountFilter(null);
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Date', 'Account', 'Category', 'Amount', 'Type', 'Payment', 'Notes'];
    const csvRows = [headers.join(',')];
    sortedTransactions.forEach(tx => {
      const row = [
        formatDate(tx.date),
        tx.account,
        tx.category,
        (tx.type === 'Income' ? '+' : '-') + tx.amount,
        tx.type,
        (tx.payment_type ?? 'TRANSFER').replace('_', ' '),
        tx.note ?? ''
      ];
      csvRows.push(row.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transactions Summary</h2>
          <div className="flex gap-4 mt-2 flex-wrap">
            <Badge variant="outline" className="px-3 py-1">
              Income: {formatCurrency(summary.totalIncome)}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Expense: {formatCurrency(summary.totalExpense)}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Balance: {formatCurrency(summary.balance)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 w-[200px] md:w-[300px]"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9"
          />
        </div>

        {/* Dropdown Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            {/* Type */}
            <DropdownMenuItem
              onClick={() => { setTypeFilter(null); setCurrentPage(1); }}
              className="justify-between"
            >
              All Types {typeFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setTypeFilter('Income'); setCurrentPage(1); }}
              className="justify-between"
            >
              Income {typeFilter === 'Income' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setTypeFilter('Expense'); setCurrentPage(1); }}
              className="justify-between"
            >
              Expense {typeFilter === 'Expense' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-px my-1 p-0" />

            {/* Payment */}
            <DropdownMenuItem
              onClick={() => { setPaymentFilter(null); setCurrentPage(1); }}
              className="justify-between"
            >
              All Payments {paymentFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('CASH'); setCurrentPage(1); }}
              className="justify-between"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="CASH" />
                Cash
              </div>
              {paymentFilter === 'CASH' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('CREDIT_CARD'); setCurrentPage(1); }}
              className="justify-between"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="CREDIT_CARD" />
                Credit Card
              </div>
              {paymentFilter === 'CREDIT_CARD' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('DEBIT_CARD'); setCurrentPage(1); }}
              className="justify-between"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="DEBIT_CARD" />
                Debit Card
              </div>
              {paymentFilter === 'DEBIT_CARD' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('TRANSFER'); setCurrentPage(1); }}
              className="justify-between"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="TRANSFER" />
                Transfer
              </div>
              {paymentFilter === 'TRANSFER' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-px my-1 p-0" />

            {/* Accounts */}
            <DropdownMenuItem
              onClick={() => { setAccountFilter(null); setCurrentPage(1); }}
              className="justify-between"
            >
              All Accounts {accountFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            {allAccounts.map(acc => (
              <DropdownMenuItem
                key={acc}
                onClick={() => { setAccountFilter(acc); setCurrentPage(1); }}
                className="justify-between"
              >
                {acc} {accountFilter === acc && <span>✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions Table */}
      <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
        <CardHeader>
          <CardTitle className="text-xl">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
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
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map(tx => (
                    <TableRow
                      key={tx.id}
                      className="group hover:bg-accent/30 transition-colors"
                    >
                      <TableCell className="font-medium group-hover:text-primary">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>{tx.account}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.type === 'Income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={tx.type === 'Income' ? 'outline' : 'secondary'}
                          className={
                            tx.type === 'Income'
                              ? 'border-income/50 bg-income/10 text-income'
                              : 'border-expense/50 bg-expense/10 text-expense'
                          }
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="flex items-center justify-center gap-1 w-fit ml-auto"
                        >
                          <PaymentTypeIcon type={tx.payment_type ?? 'TRANSFER'} />
                          <span className="hidden sm:inline">
                            {(tx.payment_type ?? 'TRANSFER').replace('_', ' ')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {tx.note || '-'}
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

          {/* Pagination */}
          {sortedTransactions.length > pageSize && (
            <div className="flex justify-end items-center mt-2 gap-2 p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span>
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(prev => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsTable;
