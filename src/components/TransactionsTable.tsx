import React, { useState, useMemo } from 'react'
import { useFinance } from '@/contexts/FinanceContext'
import { Transaction } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/finance-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Search,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  CreditCard,
  Coins,
  Wallet,
  ArrowLeftRight,
  Download,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import DateRangePicker from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'
import TransactionForm from '@/components/TransactionForm'

function PaymentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return <CreditCard className="h-4 w-4 mr-1" />
    case 'CASH':
      return <Wallet className="h-4 w-4 mr-1" />
    case 'TRANSFER':
      return <ArrowLeftRight className="h-4 w-4 mr-1" />
    default:
      return <Coins className="h-4 w-4 mr-1" />
  }
}

export default function TransactionsTable() {
  const { transactions } = useFinance()
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortBy, setSortBy] = useState<keyof Transaction>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const allAccounts = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach(tx => set.add(tx.account))
    return Array.from(set).sort()
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const query = searchTerm.toLowerCase()
      const matchesSearch = [
        tx.account.toLowerCase(),
        tx.category.toLowerCase(),
        (tx.notes || '').toLowerCase(),
        (tx.description || '').toLowerCase(),
      ].some(str => str.includes(query))
      const matchesType = typeFilter ? tx.type === typeFilter : true
      const matchesPayment = paymentFilter ? tx.payment_type === paymentFilter : true
      const matchesAccount = accountFilter ? tx.account === accountFilter : true
      let matchesDate = true
      const txDate = new Date(tx.date)
      if (dateRange?.from) matchesDate = txDate >= dateRange.from
      if (dateRange?.to) matchesDate = matchesDate && txDate <= dateRange.to
      return matchesSearch && matchesType && matchesPayment && matchesAccount && matchesDate
    })
  }, [transactions, searchTerm, typeFilter, paymentFilter, accountFilter, dateRange])

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let valA: any = a[sortBy]
      let valB: any = b[sortBy]
      if (sortBy === 'date') {
        valA = new Date(a.date).getTime()
        valB = new Date(b.date).getTime()
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredTransactions, sortBy, sortOrder])

  const startIndex = (currentPage - 1) * pageSize
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize)
  const totalPages = Math.ceil(sortedTransactions.length / pageSize)

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0)
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  }, [filteredTransactions])

  const accountsSummary = useMemo(() => {
    const map = new Map<string, { account: string; totalIncome: number; totalExpense: number; count: number }>()
    filteredTransactions.forEach(tx => {
      if (!map.has(tx.account)) {
        map.set(tx.account, { account: tx.account, totalIncome: 0, totalExpense: 0, count: 0 })
      }
      const data = map.get(tx.account)!
      data.count += 1
      if (tx.type === 'Income') data.totalIncome += tx.amount
      else data.totalExpense += tx.amount
    })
    const result = Array.from(map.values()).map(a => ({ ...a, net: a.totalIncome - a.totalExpense }))
    result.sort((a, b) => b.net - a.net)
    return result
  }, [filteredTransactions])

  function handleSort(column: keyof Transaction) {
    if (sortBy === column) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  function renderSortIcon(column: keyof Transaction) {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
  }

  function resetFilters() {
    setSearchTerm('')
    setTypeFilter(null)
    setPaymentFilter(null)
    setAccountFilter(null)
    setDateRange(undefined)
    setCurrentPage(1)
  }

  function handleExportCSV() {
    const headers = ['Date','Account','Category','Amount','Type','Payment','Notes','Description']
    const csvRows = [headers.join(',')]
    sortedTransactions.forEach(tx => {
      const row = [
        formatDate(tx.date),
        tx.account,
        tx.category,
        (tx.type === 'Income' ? '+' : '-') + tx.amount,
        tx.type,
        (tx.payment_type || 'TRANSFER').replace('_', ' '),
        tx.notes || '',
        tx.description || ''
      ]
      csvRows.push(row.join(','))
    })
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'transactions.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function toggleRowExpansion(id: string) {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  function openInvoice(tx: Transaction) {
    setSelectedTx(tx)
    setInvoiceModalOpen(true)
  }

  function handlePrintInvoice() {
    window.print()
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {accountsSummary.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Accounts Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountsSummary.map(acc => (
              <Card key={acc.account} className="border bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-1 px-4 pt-4">
                  <CardTitle className="text-lg truncate">{acc.account}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 text-sm space-y-1">
                  <p>Transactions: <span className="font-medium">{acc.count}</span></p>
                  <p>Income: <span className="font-medium">{formatCurrency(acc.totalIncome)}</span></p>
                  <p>Expense: <span className="font-medium">{formatCurrency(acc.totalExpense)}</span></p>
                  <p>
                    Net: <span className={`font-semibold ${acc.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {formatCurrency(acc.net)}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div>
          <h2 className="text-2xl font-bold">Transactions Summary</h2>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="px-2 py-0.5 text-sm md:text-base">
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
        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                + New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create a new transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setOpenCreateModal(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 h-9 w-full sm:w-[200px] md:w-[300px] text-sm"
          />
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={range => {
            setDateRange(range)
            setCurrentPage(1)
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto justify-center text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            <DropdownMenuItem
              onClick={() => { setTypeFilter(null); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              All Types {typeFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setTypeFilter('Income'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              Income {typeFilter === 'Income' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setTypeFilter('Expense'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              Expense {typeFilter === 'Expense' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-px my-1 p-0" />
            <DropdownMenuItem
              onClick={() => { setPaymentFilter(null); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              All Payments {paymentFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('CASH'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="CASH" />
                Cash
              </div>
              {paymentFilter === 'CASH' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('CREDIT_CARD'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="CREDIT_CARD" />
                Credit Card
              </div>
              {paymentFilter === 'CREDIT_CARD' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('DEBIT_CARD'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="DEBIT_CARD" />
                Debit Card
              </div>
              {paymentFilter === 'DEBIT_CARD' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setPaymentFilter('TRANSFER'); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              <div className="flex items-center">
                <PaymentTypeIcon type="TRANSFER" />
                Transfer
              </div>
              {paymentFilter === 'TRANSFER' && <span>✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-px my-1 p-0" />
            <DropdownMenuItem
              onClick={() => { setAccountFilter(null); setCurrentPage(1) }}
              className="justify-between text-sm"
            >
              All Accounts {accountFilter === null && <span>✓</span>}
            </DropdownMenuItem>
            {allAccounts.map(acc => (
              <DropdownMenuItem
                key={acc}
                onClick={() => {
                  setAccountFilter(acc)
                  setCurrentPage(1)
                }}
                className="justify-between text-sm"
              >
                {acc} {accountFilter === acc && <span>✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
        <CardHeader className="py-2 px-4 md:px-6">
          <CardTitle className="text-xl">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[90px] md:w-[120px] cursor-pointer text-left px-2 md:px-4"
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center justify-start">
                      Date {renderSortIcon('date')}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-left px-2 md:px-4"
                    onClick={() => handleSort('account')}
                  >
                    <span className="flex items-center justify-start">
                      Account {renderSortIcon('account')}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-left px-2 md:px-4"
                    onClick={() => handleSort('category')}
                  >
                    <span className="flex items-center justify-start">
                      Category {renderSortIcon('category')}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right px-2 md:px-4"
                    onClick={() => handleSort('amount')}
                  >
                    <span className="flex items-center justify-end">
                      Amount {renderSortIcon('amount')}
                    </span>
                  </TableHead>
                  <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell">
                    Type
                  </TableHead>
                  <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell">
                    Payment
                  </TableHead>
                  <TableHead className="text-right px-2 md:px-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map(tx => {
                    const isExpanded = expandedRows.has(tx.id)
                    return (
                      <React.Fragment key={tx.id}>
                        <TableRow className="group hover:bg-accent/30 transition-colors">
                          <TableCell className="font-medium group-hover:text-primary px-2 md:px-4 text-sm md:text-base">
                            {formatDate(tx.date)}
                          </TableCell>
                          <TableCell className="px-2 md:px-4 text-sm md:text-base">
                            {tx.account}
                          </TableCell>
                          <TableCell className="px-2 md:px-4 text-sm md:text-base">
                            {tx.category}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              tx.type === 'Income' ? 'text-income' : 'text-expense'
                            } px-2 md:px-4 text-sm md:text-base`}
                          >
                            {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell text-sm md:text-base">
                            <Badge
                              variant={tx.type === 'Income' ? 'outline' : 'secondary'}
                              className={`w-fit ml-auto px-2 py-0.5 text-xs md:text-xs ${
                                tx.type === 'Income'
                                  ? 'border-income/50 bg-income/10 text-income'
                                  : 'border-expense/50 bg-expense/10 text-expense'
                              }`}
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell">
                            <Badge
                              variant="outline"
                              className="flex items-center justify-center gap-1 w-fit ml-auto px-1 py-0.5 text-xs"
                            >
                              <PaymentTypeIcon type={tx.payment_type || 'TRANSFER'} />
                              <span className="hidden sm:inline">
                                {(tx.payment_type || 'TRANSFER').replace('_', ' ')}
                              </span>
                              <span className="sm:hidden text-[0.7rem]">
                                ({(tx.payment_type || 'TRANSFER').charAt(0)})
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-2 md:px-4 space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(tx.id)}
                              className="p-0 h-auto w-6 inline-flex items-center justify-center"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTx(tx)
                                setInvoiceModalOpen(true)
                              }}
                              className="p-0 h-auto w-6 inline-flex items-center justify-center"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="p-4 text-sm">
                              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                <div className="flex-1">
                                  <h4 className="font-semibold">Notes:</h4>
                                  <p>{tx.notes || '-'}</p>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Description:</h4>
                                  <p>{tx.description || '-'}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm md:text-base">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {sortedTransactions.length > pageSize && (
            <div className="flex justify-center sm:justify-end items-center mt-2 gap-2 p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className="text-sm md:text-base">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="p-4 text-sm space-y-3 print:block">
              <div className="border-b pb-2 mb-2">
                <h2 className="text-lg font-semibold">Transaction ID: {selectedTx.id}</h2>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Date:</p>
                <p>{formatDate(selectedTx.date)}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Account:</p>
                <p>{selectedTx.account}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Category:</p>
                <p>{selectedTx.category}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Type:</p>
                <p>{selectedTx.type}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Payment Type:</p>
                <p>{(selectedTx.payment_type || 'TRANSFER').replace('_', ' ')}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Amount:</p>
                <p>{(selectedTx.type === 'Income' ? '+' : '-') + formatCurrency(selectedTx.amount)}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Notes:</p>
                <p>{selectedTx.notes || '-'}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Description:</p>
                <p>{selectedTx.description || '-'}</p>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.print()}
              >
                Save as PDF / Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
