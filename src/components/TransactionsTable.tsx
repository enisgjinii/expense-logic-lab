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
    <div className="space-y-6 p-4 md:p-6 lg:p-8"> {/* Added padding to the main container */}
      {/* Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 md:mb-6"> {/* Added margin bottom */}
        <div>
          <h2 className="text-2xl font-bold">Transactions Summary</h2>
          <div className="flex gap-2 mt-2 flex-wrap justify-start md:justify-start"> {/* Adjusted badge layout */}
            <Badge variant="outline" className="px-2 py-0.5 text-sm md:text-base"> {/* Reduced padding and font size on smaller screens */}
              Income: {formatCurrency(summary.totalIncome)}
            </Badge>
            <Badge variant="outline" className="px-2 py-0.5 text-sm md:text-base">
              Expense: {formatCurrency(summary.totalExpense)}
            </Badge>
            <Badge variant="outline" className="px-2 py-0.5 text-sm md:text-base">
              Balance: {formatCurrency(summary.balance)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-start md:justify-end"> {/* Adjusted button layout */}
          <Button variant="outline" size="sm" className="text-sm md:text-base px-2 py-1" onClick={handleExportCSV}> {/* Adjusted button size and text size */}
            <Download className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">CSV</span> {/* Hide text on very small screens if needed */}
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="text-sm md:text-base px-2 py-1" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 md:mb-6"> {/* Added margin bottom and flex direction for mobile */}
        {/* Search Input */}
        <div className="relative w-full sm:w-auto"> {/* Full width on mobile, auto on larger */}
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 w-full sm:w-[200px] md:w-[300px] text-sm" // Adjusted width and text size
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-center"> {/* Flex wrap for mobile date inputs */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full sm:w-auto text-sm" // Adjusted width and text size
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full sm:w-auto text-sm" // Adjusted width and text size
          />
        </div>

        {/* Dropdown Filters */}
        <div className="w-full sm:w-auto flex justify-start sm:justify-end"> {/* Full width on mobile, auto on larger, alignment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto justify-center text-sm"> {/* Full width button on mobile, auto on larger, alignment */}
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span> {/* Shorter text on small screens */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              {/* Type */}
              <DropdownMenuItem
                onClick={() => { setTypeFilter(null); setCurrentPage(1); }}
                className="justify-between text-sm" // Adjusted text size
              >
                All Types {typeFilter === null && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setTypeFilter('Income'); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                Income {typeFilter === 'Income' && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setTypeFilter('Expense'); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                Expense {typeFilter === 'Expense' && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="h-px my-1 p-0" />

              {/* Payment */}
              <DropdownMenuItem
                onClick={() => { setPaymentFilter(null); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                All Payments {paymentFilter === null && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setPaymentFilter('CASH'); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                <div className="flex items-center">
                  <PaymentTypeIcon type="CASH" />
                  Cash
                </div>
                {paymentFilter === 'CASH' && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setPaymentFilter('CREDIT_CARD'); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                <div className="flex items-center">
                  <PaymentTypeIcon type="CREDIT_CARD" />
                  Credit Card
                </div>
                {paymentFilter === 'CREDIT_CARD' && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setPaymentFilter('DEBIT_CARD'); setCurrentPage(1); }}
                className="justify-between text-sm"
              >
                <div className="flex items-center">
                  <PaymentTypeIcon type="DEBIT_CARD" />
                  Debit Card
                </div>
                {paymentFilter === 'DEBIT_CARD' && <span>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setPaymentFilter('TRANSFER'); setCurrentPage(1); }}
                className="justify-between text-sm"
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
                className="justify-between text-sm"
              >
                All Accounts {accountFilter === null && <span>✓</span>}
              </DropdownMenuItem>
              {allAccounts.map(acc => (
                <DropdownMenuItem
                  key={acc}
                  onClick={() => { setAccountFilter(acc); setCurrentPage(1); }}
                  className="justify-between text-sm"
                >
                  {acc} {accountFilter === acc && <span>✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
        <CardHeader className="py-2 px-4 md:px-6"> {/* Reduced header padding on smaller screens */}
          <CardTitle className="text-xl">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[80px] md:w-[120px] cursor-pointer text-left px-2 md:px-4" // Adjusted width and padding
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center justify-start"> {/* Left align header text */}
                      <span className="text-sm md:text-base">Date</span> {renderSortIcon('date')} {/* Adjusted text size */}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-left px-2 md:px-4" // Adjusted padding and text alignment
                    onClick={() => handleSort('account')}
                  >
                    <span className="flex items-center justify-start">
                      <span className="text-sm md:text-base">Account</span> {renderSortIcon('account')} {/* Adjusted text size */}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-left px-2 md:px-4" // Adjusted padding and text alignment
                    onClick={() => handleSort('category')}
                  >
                    <span className="flex items-center justify-start">
                      <span className="text-sm md:text-base">Category</span> {renderSortIcon('category')} {/* Adjusted text size */}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right px-2 md:px-4" // Adjusted padding and text alignment
                    onClick={() => handleSort('amount')}
                  >
                    <span className="flex items-center justify-end">
                      <span className="text-sm md:text-base">Amount</span> {renderSortIcon('amount')} {/* Adjusted text size */}
                    </span>
                  </TableHead>
                  <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell"> {/* Hide on xs screens */}
                    <span className="text-sm md:text-base">Type</span> {/* Adjusted text size */}
                  </TableHead>
                  <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell"> {/* Hide on xs screens */}
                    <span className="text-sm md:text-base">Payment</span> {/* Adjusted text size */}
                  </TableHead>
                  <TableHead className="hidden md:table-cell px-2 md:px-4"> {/* Keep hidden on mobile but show on md+ */}
                    <span className="text-sm md:text-base">Notes</span> {/* Adjusted text size */}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map(tx => (
                    <TableRow
                      key={tx.id}
                      className="group hover:bg-accent/30 transition-colors"
                    >
                      <TableCell className="font-medium group-hover:text-primary px-2 md:px-4 text-sm md:text-base"> {/* Adjusted padding and text size */}
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="px-2 md:px-4 text-sm md:text-base">{tx.account}</TableCell> {/* Adjusted padding and text size */}
                      <TableCell className="px-2 md:px-4 text-sm md:text-base">{tx.category}</TableCell> {/* Adjusted padding and text size */}
                      <TableCell
                        className={`text-right font-medium ${
                          tx.type === 'Income' ? 'text-income' : 'text-expense'
                        } px-2 md:px-4 text-sm md:text-base`} // Adjusted padding and text size
                      >
                        {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell text-sm md:text-base"> {/* Hide on xs screens, adjusted padding and text size */}
                        <Badge
                          variant={tx.type === 'Income' ? 'outline' : 'secondary'}
                          className={
                            `w-fit ml-auto px-2 py-0.5 text-xs md:text-xs ${ // Adjusted badge size and text size
                              tx.type === 'Income'
                                ? 'border-income/50 bg-income/10 text-income'
                                : 'border-expense/50 bg-expense/10 text-expense'
                            }`
                          }
                        >
                          <span className="text-sm md:text-base">{tx.type}</span> {/* Adjusted text size */}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell"> {/* Hide on xs screens, adjusted padding */}
                        <Badge
                          variant="outline"
                          className="flex items-center justify-center gap-1 w-fit ml-auto px-1 py-0.5 text-xs" // Adjusted badge size and text size
                        >
                          <PaymentTypeIcon type={tx.payment_type ?? 'TRANSFER'} />
                          <span className="hidden sm:inline text-sm md:text-base"> {/* Adjusted text size */}
                            {(tx.payment_type ?? 'TRANSFER').replace('_', ' ')}
                          </span>
                          <span className="sm:hidden text-[0.7rem]">{/* Smaller text on very small screens */}
                            ( {(tx.payment_type ?? 'TRANSFER').charAt(0)} )
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-2 md:px-4 text-muted-foreground text-sm truncate"> {/* Keep hidden on mobile but show on md+, adjusted padding, text size and truncate */}
                        {tx.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm md:text-base"> {/* Adjusted text size */}
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {sortedTransactions.length > pageSize && (
            <div className="flex justify-center sm:justify-end items-center mt-2 gap-2 p-2"> {/* Center pagination on mobile */}
              <Button
                variant="outline"
                size="sm"
                className="text-sm md:text-base px-2 py-1" // Adjusted button size and text size
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className="text-sm md:text-base"> {/* Adjusted text size */}
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-sm md:text-base px-2 py-1" // Adjusted button size and text size
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
