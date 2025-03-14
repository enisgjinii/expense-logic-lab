
import React, { useState } from 'react';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/finance-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
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

interface TransactionsTabProps {
  transactions: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pageSize, setPageSize] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter transactions based on search term and date range
  const filteredTransactions = transactions.filter(tx => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      [tx.category, tx.description, tx.account].some(
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
    
    return matchesSearch && matchesDate;
  });

  // Pagination
  const pageCount = Math.ceil(filteredTransactions.length / parseInt(pageSize));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * parseInt(pageSize),
    currentPage * parseInt(pageSize)
  );

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">All Transactions</h2>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="md:h-9"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 animate-in">
          <div className="md:flex-1">
            <p className="text-sm font-medium mb-2">Date Range</p>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={(range) => {
                setDateRange(range);
                setCurrentPage(1); // Reset to first page on filter change
              }} 
            />
          </div>
          <div className="md:w-32">
            <p className="text-sm font-medium mb-2">Page Size</p>
            <Select value={pageSize} onValueChange={(value) => {
              setPageSize(value);
              setCurrentPage(1); // Reset to first page on page size change
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{transaction.description || '-'}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'Income' ? 'text-income' : 'text-expense'}>
                      {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </span>
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
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                
                // Logic to show pages around current page
                if (pageCount <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= pageCount - 2) {
                  pageNumber = pageCount - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                // Only show page numbers and ellipsis when needed
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
    </div>
  );
};

export default TransactionsTab;
