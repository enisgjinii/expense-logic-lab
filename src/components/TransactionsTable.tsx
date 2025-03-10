
import React, { useState, useMemo } from 'react';
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
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
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
  Trash,
  PenLine,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  CalendarIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useFinance } from '@/contexts/FinanceContext';

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
  const { toast } = useToast();
  const { deleteTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique categories and accounts for filtering
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach(t => uniqueCategories.add(t.category));
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  const accounts = useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach(t => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      const matchesSearch = 
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.note.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter ? transaction.type === typeFilter : true;
      
      // Payment type filter
      const matchesPayment = paymentFilter ? transaction.payment_type === paymentFilter : true;
      
      // Category filter
      const matchesCategory = categoryFilter ? transaction.category === categoryFilter : true;
      
      // Account filter
      const matchesAccount = accountFilter ? transaction.account === accountFilter : true;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const transactionDate = new Date(transaction.date);
        if (dateRange.from && dateRange.to) {
          // Set time to end of day for the to date to include the whole day
          const toDateWithTime = new Date(dateRange.to);
          toDateWithTime.setHours(23, 59, 59, 999);
          matchesDateRange = transactionDate >= dateRange.from && transactionDate <= toDateWithTime;
        } else if (dateRange.from) {
          matchesDateRange = transactionDate >= dateRange.from;
        } else if (dateRange.to) {
          // Set time to end of day for the to date to include the whole day
          const toDateWithTime = new Date(dateRange.to);
          toDateWithTime.setHours(23, 59, 59, 999);
          matchesDateRange = transactionDate <= toDateWithTime;
        }
      }
      
      return matchesSearch && matchesType && matchesPayment && matchesCategory && matchesAccount && matchesDateRange;
    });
  }, [transactions, searchTerm, typeFilter, paymentFilter, categoryFilter, accountFilter, dateRange]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
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
  }, [filteredTransactions, sortBy, sortOrder]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(startIndex, startIndex + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedTransactions.length / pageSize);

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
    setCategoryFilter(null);
    setAccountFilter(null);
    setDateRange({from: undefined, to: undefined});
    setCurrentPage(1);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been successfully removed",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    try {
      // Create CSV header
      let csvContent = "account,category,amount,type,payment_type,note,date\n";
      
      // Add filtered data rows
      filteredTransactions.forEach(t => {
        const note = t.note.includes(',') ? `"${t.note}"` : t.note;
        const row = [
          t.account,
          t.category,
          t.amount,
          t.type,
          t.payment_type,
          note,
          t.date
        ].join(',');
        csvContent += row + "\n";
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredTransactions.length} transactions to CSV`,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions to CSV",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl">Transactions</CardTitle>
            <CardDescription>
              {sortedTransactions.length} transactions found
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-[200px] md:w-[250px]"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {dateRange.from || dateRange.to ? (
                      <>
                        {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Start"} 
                        {" - "}
                        {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "End"}
                      </>
                    ) : (
                      "Date Range"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange(range || {from: undefined, to: undefined});
                    setCurrentPage(1);
                  }}
                  numberOfMonths={2}
                />
                <div className="flex items-center justify-between p-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({from: undefined, to: undefined})}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => (document.activeElement as HTMLElement)?.blur()}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px]">
                <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTypeFilter(null)} className="justify-between">
                  All Types {typeFilter === null && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('Income')} className="justify-between">
                  Income {typeFilter === 'Income' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('Expense')} className="justify-between">
                  Expense {typeFilter === 'Expense' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Payment Method</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setPaymentFilter(null)} className="justify-between">
                  All Payment Methods {paymentFilter === null && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('CASH')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="CASH" /> Cash</div>
                  {paymentFilter === 'CASH' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('CREDIT_CARD')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="CREDIT_CARD" /> Credit Card</div>
                  {paymentFilter === 'CREDIT_CARD' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('DEBIT_CARD')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="DEBIT_CARD" /> Debit Card</div>
                  {paymentFilter === 'DEBIT_CARD' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter('TRANSFER')} className="justify-between">
                  <div className="flex items-center"><PaymentTypeIcon type="TRANSFER" /> Transfer</div>
                  {paymentFilter === 'TRANSFER' && <CheckCircle2 className="h-4 w-4" />}
                </DropdownMenuItem>
                
                {categories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setCategoryFilter(null)} className="justify-between">
                      All Categories {categoryFilter === null && <CheckCircle2 className="h-4 w-4" />}
                    </DropdownMenuItem>
                    <div className="max-h-[200px] overflow-y-auto">
                      {categories.map(category => (
                        <DropdownMenuItem 
                          key={category} 
                          onClick={() => setCategoryFilter(category)}
                          className="justify-between"
                        >
                          {category} {categoryFilter === category && <CheckCircle2 className="h-4 w-4" />}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </>
                )}
                
                {accounts.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Accounts</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setAccountFilter(null)} className="justify-between">
                      All Accounts {accountFilter === null && <CheckCircle2 className="h-4 w-4" />}
                    </DropdownMenuItem>
                    <div className="max-h-[200px] overflow-y-auto">
                      {accounts.map(account => (
                        <DropdownMenuItem 
                          key={account} 
                          onClick={() => setAccountFilter(account)}
                          className="justify-between"
                        >
                          {account} {accountFilter === account && <CheckCircle2 className="h-4 w-4" />}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetFilters}>
                  Reset All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-1"
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="group hover:bg-accent/30">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell 
                      className={`text-right font-medium ${
                        transaction.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={transaction.type === 'Income' ? 'success' : 'destructive'}
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
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex items-center gap-2">
                              <PenLine className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <XCircle className="h-8 w-8 mb-2 opacity-40" />
                      <p>No transactions found.</p>
                      <p className="text-sm">Try adjusting your filters or search criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {sortedTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(currentPage * pageSize, sortedTransactions.length)} of {sortedTransactions.length}
          </span>
        </div>
        
        {sortedTransactions.length > pageSize && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                // Show ellipsis for skipped pages
                if (
                  (page === 2 && currentPage > 3) || 
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <PaginationEllipsis key={page} />;
                }
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
};

export default TransactionsTable;
