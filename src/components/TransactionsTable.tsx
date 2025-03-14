import React, { useState, useMemo, useEffect } from 'react'
import { useFinance } from '@/contexts/FinanceContext'
import { Transaction } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/finance-utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, SortAsc, SortDesc, CreditCard, Coins, Wallet, ArrowLeftRight, Download, ChevronDown, ChevronUp, FileText, Pencil, Trash } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import DateRangePicker from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'
import { parseISO, format as formatFns } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
// Assume you have these Tabs components in your UI library.
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

/* --------------------------------------------------------------------------
   Transaction Form Component
   -------------------------------------------------------------------------- */
function TransactionForm({ transaction, onSuccess }: { transaction?: Transaction, onSuccess?: () => void }) {
  const { addTransaction, updateTransaction } = useFinance()
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString(),
    account: '',
    category: '',
    amount: 0,
    type: 'Expense',
    payment_type: 'CASH',
    notes: '',
    description: '',
    currency: 'USD'
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        account: transaction.account,
        category: transaction.category,
        amount: transaction.amount,
        type: transaction.type,
        payment_type: transaction.payment_type || 'TRANSFER',
        notes: transaction.notes || '',
        description: transaction.description || '',
        currency: transaction.currency || 'USD'
      })
    }
  }, [transaction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (transaction) {
        await updateTransaction({ ...transaction, ...formData })
      } else {
        const newId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        await addTransaction({ id: newId, ...formData })
      }
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Submit Error:', error)
      alert('There was an error processing the transaction.')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) || 0 : value }))
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const selectedDate = new Date(e.target.value)
      setFormData(prev => ({ ...prev, date: selectedDate.toISOString() }))
    } catch (error) {
      console.error('Date Change Error:', error)
      alert('Invalid date selected.')
    }
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as "Income" | "Expense" | "Transfer"
    setFormData(prev => ({ ...prev, type: value }))
  }

  function handlePaymentTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER"
    setFormData(prev => ({ ...prev, payment_type: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
        <Input id="date" type="date" name="date" value={formatFns(parseISO(formData.date), 'yyyy-MM-dd')} onChange={handleDateChange} />
      </div>
      <div>
        <label htmlFor="account" className="block text-sm font-medium mb-1">Account</label>
        <Input id="account" name="account" value={formData.account} onChange={handleChange} placeholder="e.g. Checking Account" />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
        <Input id="category" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Groceries" />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
        <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount.toString()} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">Transaction Type</label>
        <select id="type" name="type" className="border rounded p-2 w-full focus:outline-none text-sm" value={formData.type} onChange={handleTypeChange}>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Transfer">Transfer</option>
        </select>
      </div>
      <div>
        <label htmlFor="payment_type" className="block text-sm font-medium mb-1">Payment Type</label>
        <select id="payment_type" name="payment_type" className="border rounded p-2 w-full focus:outline-none text-sm" value={formData.payment_type} onChange={handlePaymentTypeChange}>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="DEBIT_CARD">Debit Card</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </div>
      <div>
        <label htmlFor="currency" className="block text-sm font-medium mb-1">Currency</label>
        <Input id="currency" name="currency" value={formData.currency} onChange={handleChange} placeholder="e.g. USD" />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
        <Input id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Short notes" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <Input id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Optional longer description" />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit">{transaction ? 'Save Changes' : 'Create Transaction'}</Button>
      </div>
    </form>
  )
}

/* --------------------------------------------------------------------------
   Payment Type Icon Component
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Duplicate Transaction Detection
   -------------------------------------------------------------------------- */

/**
 * Groups transactions by a composite key (date, account, category, amount)
 * and returns an array of groups with more than one transaction.
 */
function detectDuplicateTransactions(transactions: Transaction[]): Transaction[][] {
  const groups: Record<string, Transaction[]> = {}
  transactions.forEach(tx => {
    // Use only the date portion (yyyy-mm-dd) for grouping.
    const date = new Date(tx.date).toISOString().slice(0, 10)
    const key = `${date}-${tx.account.trim().toLowerCase()}-${tx.category.trim().toLowerCase()}-${tx.amount.toFixed(2)}`
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  })
  // Only return groups with more than one transaction.
  return Object.values(groups).filter(group => group.length > 1)
}

/**
 * Renders a card with a list of potential duplicate transaction groups.
 */
function DuplicateTransactionsAlert({ transactions }: { transactions: Transaction[] }) {
  const duplicateGroups = useMemo(() => detectDuplicateTransactions(transactions), [transactions])

  if (duplicateGroups.length === 0) return null

  return (
    <Card className="bg-red-50 border border-red-200 p-4 my-4">
      <CardHeader>
        <CardTitle className="text-xl text-red-700">Potential Duplicate Transactions</CardTitle>
        <CardDescription className="text-sm text-red-600">
          We have detected similar transactions that may be duplicates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {duplicateGroups.map((group, idx) => (
          <div key={idx} className="mb-2">
            <h3 className="font-semibold">Group {idx + 1} (Count: {group.length})</h3>
            <ul className="list-disc pl-4">
              {group.map(tx => (
                <li key={tx.id}>
                  {formatDate(tx.date)} - {tx.account} - {tx.category} - {formatCurrency(tx.amount)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* --------------------------------------------------------------------------
   Cash Flow Forecasting
   -------------------------------------------------------------------------- */

/**
 * Groups transactions by month and computes the net flow.
 * Uses the average of the last 3 months as a simple forecast.
 */
function calculateCashFlowForecast(transactions: Transaction[], forecastPeriods = 3) {
  const filtered = transactions.filter(tx => tx.type === 'Income' || tx.type === 'Expense')
  const groups = new Map<string, number>()

  filtered.forEach(tx => {
    const date = new Date(tx.date)
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    const current = groups.get(monthKey) || 0
    groups.set(monthKey, current + (tx.type === 'Income' ? tx.amount : -tx.amount))
  })

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number)
    const [yearB, monthB] = b.split('-').map(Number)
    return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime()
  })

  const history = sortedKeys.map(key => ({
    period: key,
    netFlow: groups.get(key)
  }))

  const lastPeriods = history.slice(-3)
  const avg = lastPeriods.reduce((sum, item) => sum + (item.netFlow || 0), 0) / (lastPeriods.length || 1)

  const forecast = []
  const lastKey = sortedKeys[sortedKeys.length - 1]
  let [year, month] = lastKey.split('-').map(Number)
  for (let i = 0; i < forecastPeriods; i++) {
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    forecast.push({
      period: `${year}-${month}`,
      predictedNetFlow: avg
    })
  }

  return { history, forecast }
}

/**
 * Renders a line chart showing both historical and forecasted net cash flow.
 */
function CashFlowForecast({ transactions }: { transactions: Transaction[] }) {
  const { history, forecast } = useMemo(() => calculateCashFlowForecast(transactions, 3), [transactions])

  const chartData = useMemo(() => {
    const data = history.map(item => ({
      period: item.period,
      netFlow: item.netFlow,
      forecast: null
    }))
    forecast.forEach(item => {
      data.push({
        period: item.period,
        netFlow: null,
        forecast: item.predictedNetFlow
      })
    })
    return data
  }, [history, forecast])

  return (
    <Card className="bg-card/60 backdrop-blur-sm shadow-sm border mt-6">
      <CardHeader className="py-2 px-4 md:px-6">
        <CardTitle className="text-xl">Cash Flow Forecast</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Projection based on past trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={value => formatCurrency(value)} />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="netFlow"
                stroke="#8884d8"
                name="Historical Net Flow"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#82ca9d"
                name="Forecasted Net Flow"
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* --------------------------------------------------------------------------
   Main Transactions Table Component with Nav Tabs
   -------------------------------------------------------------------------- */
export default function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const { deleteTransaction } = useFinance()
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortBy, setSortBy] = useState<keyof Transaction>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

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
        (tx.description || '').toLowerCase()
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
    const sorted = [...filteredTransactions]
    sorted.sort((a, b) => {
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
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
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
    try {
      const headers = ['Date', 'Account', 'Category', 'Amount', 'Type', 'Payment', 'Notes', 'Description']
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
    } catch (error) {
      console.error('CSV Export Error:', error)
      alert('Error exporting CSV.')
    }
  }

  function toggleRowExpansion(id: string) {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  function handleEdit(tx: Transaction) {
    setSelectedTx(tx)
    setEditModalOpen(true)
  }

  function handleDelete(tx: Transaction) {
    setSelectedTx(tx)
    setDeleteModalOpen(true)
  }

  async function confirmDelete() {
    if (!selectedTx) return
    try {
      await deleteTransaction(selectedTx.id)
      setDeleteModalOpen(false)
      setSelectedTx(null)
    } catch (error) {
      console.error('Delete Error:', error)
      alert('Error deleting transaction.')
    }
  }

  function openInvoice(tx: Transaction) {
    setSelectedTx(tx)
    setInvoiceModalOpen(true)
  }

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    filteredTransactions.forEach(tx => {
      if (tx.type === 'Expense') {
        const cat = tx.category || 'Uncategorized'
        map.set(cat, (map.get(cat) || 0) + tx.amount)
      }
    })
    let result = Array.from(map.entries()).map(([category, amount]) => ({ category, amount }))
    result.sort((a, b) => b.amount - a.amount)
    if (result.length > 10) {
      const top10 = result.slice(0, 10)
      const others = result.slice(10)
      const otherSum = others.reduce((sum, r) => sum + r.amount, 0)
      top10.push({ category: 'Other', amount: otherSum })
      result = top10
    }
    return result
  }, [filteredTransactions])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Nav Tabs for a Compact UI */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filter Transactions</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Narrow down your transactions with filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-8 h-9 text-sm"
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
                      <span className="hidden sm:inline">More Filters</span>
                      <span className="sm:hidden">Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[240px]">
                    <DropdownMenuItem onClick={() => { setTypeFilter(null); setCurrentPage(1) }} className="justify-between text-sm">
                      All Types {typeFilter === null && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTypeFilter('Income'); setCurrentPage(1) }} className="justify-between text-sm">
                      Income {typeFilter === 'Income' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTypeFilter('Expense'); setCurrentPage(1) }} className="justify-between text-sm">
                      Expense {typeFilter === 'Expense' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-px my-1 p-0" />
                    <DropdownMenuItem onClick={() => { setPaymentFilter(null); setCurrentPage(1) }} className="justify-between text-sm">
                      All Payments {paymentFilter === null && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPaymentFilter('CASH'); setCurrentPage(1) }} className="justify-between text-sm">
                      <div className="flex items-center">
                        <PaymentTypeIcon type="CASH" />Cash
                      </div>
                      {paymentFilter === 'CASH' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPaymentFilter('CREDIT_CARD'); setCurrentPage(1) }} className="justify-between text-sm">
                      <div className="flex items-center">
                        <PaymentTypeIcon type="CREDIT_CARD" />Credit Card
                      </div>
                      {paymentFilter === 'CREDIT_CARD' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPaymentFilter('DEBIT_CARD'); setCurrentPage(1) }} className="justify-between text-sm">
                      <div className="flex items-center">
                        <PaymentTypeIcon type="DEBIT_CARD" />Debit Card
                      </div>
                      {paymentFilter === 'DEBIT_CARD' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPaymentFilter('TRANSFER'); setCurrentPage(1) }} className="justify-between text-sm">
                      <div className="flex items-center">
                        <PaymentTypeIcon type="TRANSFER" />Transfer
                      </div>
                      {paymentFilter === 'TRANSFER' && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-px my-1 p-0" />
                    <DropdownMenuItem onClick={() => { setAccountFilter(null); setCurrentPage(1) }} className="justify-between text-sm">
                      All Accounts {accountFilter === null && <span>✓</span>}
                    </DropdownMenuItem>
                    {allAccounts.map(acc => (
                      <DropdownMenuItem key={acc} onClick={() => { setAccountFilter(acc); setCurrentPage(1) }} className="justify-between text-sm">
                        {acc} {accountFilter === acc && <span>✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-1 h-4 w-4" />Export CSV
                </Button>
                <select
                  className="h-9 px-3 py-0 border rounded text-sm bg-background"
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
                <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">+ New Transaction</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create a new transaction</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setOpenCreateModal(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
            <CardHeader className="py-2 px-4 md:px-6">
              <CardTitle className="text-xl">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[90px] md:w-[120px] cursor-pointer text-left px-2 md:px-4" onClick={() => handleSort('date')}>
                        <span className="flex items-center justify-start">Date {renderSortIcon('date')}</span>
                      </TableHead>
                      <TableHead className="cursor-pointer text-left px-2 md:px-4" onClick={() => handleSort('account')}>
                        <span className="flex items-center justify-start">Account {renderSortIcon('account')}</span>
                      </TableHead>
                      <TableHead className="cursor-pointer text-left px-2 md:px-4" onClick={() => handleSort('category')}>
                        <span className="flex items-center justify-start">Category {renderSortIcon('category')}</span>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right px-2 md:px-4" onClick={() => handleSort('amount')}>
                        <span className="flex items-center justify-end">Amount {renderSortIcon('amount')}</span>
                      </TableHead>
                      <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-right px-2 md:px-4 hidden sm:table-cell">Payment</TableHead>
                      <TableHead className="text-right px-2 md:px-4">Actions</TableHead>
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
                              <TableCell className={`text-right font-medium ${tx.type === 'Income' ? 'text-green-600' : 'text-red-600'} px-2 md:px-4 text-sm md:text-base`}>
                                {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                              </TableCell>
                              <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell text-sm md:text-base">
                                <Badge variant={tx.type === 'Income' ? 'outline' : 'secondary'} className={`w-fit ml-auto px-2 py-0.5 text-xs ${tx.type === 'Income' ? 'border-green-500/50 bg-green-500/10 text-green-600' : 'border-red-500/50 bg-red-500/10 text-red-600'}`}>
                                  {tx.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right px-2 md:px-4 hidden sm:table-cell">
                                <Badge variant="outline" className="flex items-center justify-center gap-1 w-fit ml-auto px-1 py-0.5 text-xs">
                                  <PaymentTypeIcon type={tx.payment_type || 'TRANSFER'} />
                                  <span className="hidden sm:inline">{(tx.payment_type || 'TRANSFER').replace('_', ' ')}</span>
                                  <span className="sm:hidden text-[0.7rem]">({(tx.payment_type || 'TRANSFER').charAt(0)})</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right px-2 md:px-4 space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(tx.id)} className="p-0 h-auto w-6 inline-flex items-center justify-center">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(tx)} className="p-0 h-auto w-6 inline-flex items-center justify-center" title="Edit Transaction">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(tx)} className="p-0 h-auto w-6 inline-flex items-center justify-center" title="Delete Transaction">
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openInvoice(tx)} className="p-0 h-auto w-6 inline-flex items-center justify-center" title="View Invoice">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-muted/20">
                                <TableCell colSpan={7} className="p-4 text-sm">
                                  <div className="flex flex-col md:flex-row gap-4">
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
                        <TableCell colSpan={7} className="h-24 text-center text-sm">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {sortedTransactions.length > pageSize && (
                <div className="flex justify-between items-center mt-2 gap-2 p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedTransactions.length)} of {sortedTransactions.length} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</Button>
                    <span className="text-sm">{currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates">
          <DuplicateTransactionsAlert transactions={transactions} />
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast">
          <CashFlowForecast transactions={transactions} />
          {/* Optionally, you can also include expense distribution here if desired */}
        </TabsContent>
      </Tabs>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <TransactionForm transaction={selectedTx} onSuccess={() => { setEditModalOpen(false); setSelectedTx(null) }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="p-4 text-sm space-y-3">
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
              <Button variant="outline" className="mt-4 w-full" onClick={() => window.print()}>
                Save as PDF / Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {expenseByCategory.length > 0 && (
        <Card className="bg-card/60 backdrop-blur-sm shadow-sm border mt-6">
          <CardHeader className="py-2 px-4 md:px-6">
            <CardTitle className="text-xl">Expense Distribution</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Where your expenses are going by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Expense']} />
                  <Bar dataKey="amount" fill="#FF595E" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
