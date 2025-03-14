
import React, { useState } from 'react';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/finance-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/DateRangePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TransactionsTabProps {
  transactions: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pageSize, setPageSize] = useState('15');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Filter transactions based on search term, date range, and type
  const filteredTransactions = transactions.filter(tx => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      [tx.category, tx.description, tx.account, tx.notes].some(
        field => (field || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Apply date filter
    let matchesDate = true;
    if (dateRange?.from) {
      const txDate = new Date(tx.date);
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        matchesDate = txDate >= from && txDate <= to;
      } else {
        matchesDate = txDate.toDateString() === from.toDateString();
      }
    }

    // Apply type filter
    const matchesType = typeFilter ? tx.type === typeFilter : true;
    
    return matchesSearch && matchesDate && matchesType;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
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

  // Pagination
  const pageCount = Math.ceil(sortedTransactions.length / parseInt(pageSize));
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * parseInt(pageSize),
    currentPage * parseInt(pageSize)
  );

  // Handle sorting
  const handleSort = (column: keyof Transaction) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Date', 'Account', 'Category', 'Amount', 'Type', 'Notes', 'Description'];
      const csvRows = [headers.join(',')];
      
      sortedTransactions.forEach(tx => {
        const row = [
          formatDate(tx.date),
          tx.account,
          tx.category,
          (tx.type === 'Income' ? '+' : '-') + tx.amount,
          tx.type,
          (tx.notes || '').replace(/,/g, ' '),
          (tx.description || '').replace(/,/g, ' ')
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
    } catch (error) {
      console.error('CSV Export Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Transactions Manager</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            View, filter, and export your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text" 
                placeholder="Search transactions..." 
                className="pl-8 h-9 w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col md:flex-row gap-4 animate-in">
              <div className="md:flex-1">
                <p className="text-sm font-medium mb-2">Date Range</p>
                <DateRangePicker 
                  dateRange={dateRange} 
                  onDateRangeChange={(range) => {
                    setDateRange(range);
                    setCurrentPage(1);
                  }} 
                />
              </div>
              <div className="md:w-32">
                <p className="text-sm font-medium mb-2">Type</p>
                <Select 
                  value={typeFilter || ""} 
                  onValueChange={(value) => {
                    setTypeFilter(value || null);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-32">
                <p className="text-sm font-medium mb-2">Page Size</p>
                <Select value={pageSize} onValueChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rows per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 rows</SelectItem>
                    <SelectItem value="25">25 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px] cursor-pointer" onClick={() => handleSort('date')}>
                    <div className="flex items-center">
                      Date
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                    <div className="flex items-center">
                      Category
                      {sortBy === 'category' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort('account')}>
                    <div className="flex items-center">
                      Account
                      {sortBy === 'account' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden lg:table-cell">Description</TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end">
                      Amount
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="group hover:bg-accent/30">
                      <TableCell className="font-medium text-xs md:text-sm">{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium group-hover:text-primary transition-colors text-sm md:text-base">
                            {transaction.category}
                          </span>
                          <Badge className="w-fit mt-1 md:hidden" variant={transaction.type === 'Income' ? 'outline' : 'secondary'}>
                            {transaction.account}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{transaction.account}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm max-w-[200px] truncate">{transaction.description || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'} text-sm md:text-base`}>
                        {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length > 0 && (
            <div className="mt-4 px-4 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                    let pageNumber;
                    
                    if (pageCount <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= pageCount - 2) {
                      pageNumber = pageCount - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    if (pageCount > 5) {
                      if (i === 0 && currentPage > 3) {
                        return (
                          <React.Fragment key={i}>
                            <PaginationItem>
                              <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          </React.Fragment>
                        );
                      }
                      
                      if (i === 4 && currentPage < pageCount - 2) {
                        return (
                          <React.Fragment key={i}>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink onClick={() => setCurrentPage(pageCount)}>
                                {pageCount}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      }
                    }
                    
                    if (pageNumber > 0 && pageNumber <= pageCount && 
                        !(pageCount > 5 && 
                          ((i === 0 && currentPage > 3) || 
                           (i === 4 && currentPage < pageCount - 2)))) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink 
                            isActive={currentPage === pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))}
                      className={currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Transactions:</span>
                  <span className="font-medium">{filteredTransactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Income Transactions:</span>
                  <span className="font-medium text-green-600">
                    {filteredTransactions.filter(t => t.type === 'Income').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expense Transactions:</span>
                  <span className="font-medium text-red-600">
                    {filteredTransactions.filter(t => t.type === 'Expense').length}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Date Range:</span>
                  <span className="text-sm">
                    {dateRange?.from ? formatDate(dateRange.from.toISOString()) : 'All time'} 
                    {dateRange?.to ? ` to ${formatDate(dateRange.to.toISOString())}` : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 md:col-span-2 border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm text-green-600 dark:text-green-400">Total Income</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(filteredTransactions
                        .filter(t => t.type === 'Income')
                        .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(filteredTransactions
                        .filter(t => t.type === 'Expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Net Balance</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      filteredTransactions
                        .filter(t => t.type === 'Income')
                        .reduce((sum, t) => sum + t.amount, 0) -
                      filteredTransactions
                        .filter(t => t.type === 'Expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
