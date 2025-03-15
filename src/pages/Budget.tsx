import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { useFinance } from '@/contexts/FinanceContext'
import { Budget, Transaction } from '@/types/finance'
import { formatCurrency, getCategoryColor } from '@/utils/finance-utils'
import { v4 as uuidv4 } from 'uuid'
import {
  Plus, Pencil, Trash, X, Check, DollarSign, CalendarDays, Clock,
  AlertCircle, Search, Filter, RefreshCw, Download, BarChart4, PieChart
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { motion } from 'framer-motion'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

type ExtendedBudget = Omit<Budget, 'id'> & {
  cycleStart?: string
  cycleLength?: number
}

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';

const BudgetPage: React.FC = () => {
  const { budgets, budgetSummaries, transactions, addBudget, deleteBudget, updateBudget } = useFinance()
  const [newBudget, setNewBudget] = useState<ExtendedBudget>({
    category: '', name: '', amount: 0, period: 'monthly', color: '#6366f1'
  })
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false)
  const [dialogSearchQuery, setDialogSearchQuery] = useState('')
  const [dialogDateRange, setDialogDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [dialogCurrentPage, setDialogCurrentPage] = useState(1)
  const itemsPerPage = 6
  const dialogItemsPerPage = 5
  const uniqueCategories = Array.from(new Set(transactions.filter(t => t.type === 'Expense').map(t => t.category))).sort()
  const availableCategories = uniqueCategories.filter(
    c =>
      !budgets.some(b => b.category === c) ||
      (editingBudgetId && budgets.find(b => b.id === editingBudgetId)?.category === c)
  )
  const filteredBudgetSummaries = budgetSummaries.filter(s => {
    const n = s.budget.name.toLowerCase().includes(searchQuery.toLowerCase())
    const c = s.budget.category.toLowerCase().includes(searchQuery.toLowerCase())
    const p = filterPeriod === 'all' || s.budget.period === filterPeriod
    return (n || c) && p
  })
  const totalPages = Math.ceil(filteredBudgetSummaries.length / itemsPerPage)
  const currentItems = filteredBudgetSummaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (filteredBudgetSummaries.length > 0 && currentPage > totalPages) setCurrentPage(1)
  }, [filteredBudgetSummaries.length, currentPage, totalPages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewBudget(p => ({
      ...p,
      [name]: name === 'amount' || name === 'cycleLength' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewBudget(p => ({
      ...p,
      [name]: value,
      color: name === 'category' ? getCategoryColor(value) : p.color,
      ...(name === 'period' && value === 'custom' ? { cycleStart: '', cycleLength: 0 } : {})
    }))
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBudget(p => ({ ...p, color: e.target.value }))
  }

  const validateBudget = () => {
    if (!newBudget.category) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' })
      return false
    }
    if (!newBudget.name) {
      toast({ title: 'Error', description: 'Please provide a budget name', variant: 'destructive' })
      return false
    }
    if (newBudget.amount <= 0) {
      toast({ title: 'Error', description: 'Budget amount must be greater than zero', variant: 'destructive' })
      return false
    }
    if (newBudget.period === 'custom') {
      if (!newBudget.cycleStart) {
        toast({
          title: 'Error',
          description: 'Please select a cycle start date for your custom budget',
          variant: 'destructive'
        })
        return false
      }
      if (!newBudget.cycleLength || newBudget.cycleLength <= 0) {
        toast({ title: 'Error', description: 'Cycle length must be greater than zero', variant: 'destructive' })
        return false
      }
    }
    return true
  }

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateBudget()) return
    if (editingBudgetId) {
      try {
        const updated: Budget = {
          id: editingBudgetId,
          category: newBudget.category,
          name: newBudget.name || newBudget.category,
          amount: newBudget.amount,
          period: newBudget.period,
          color: newBudget.color,
          ...(newBudget.period === 'custom' && {
            cycleStart: newBudget.cycleStart,
            cycleLength: newBudget.cycleLength
          })
        }
        updateBudget(updated)
        toast({
          title: 'Budget Updated',
          description: `Budget for ${newBudget.name || newBudget.category} has been updated`
        })
        resetForm()
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to update budget: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
          variant: 'destructive'
        })
      }
    } else {
      try {
        const id = uuidv4()
        const b: Budget = {
          id,
          category: newBudget.category,
          name: newBudget.name || newBudget.category,
          amount: newBudget.amount,
          period: newBudget.period,
          color: newBudget.color,
          ...(newBudget.period === 'custom' && {
            cycleStart: newBudget.cycleStart,
            cycleLength: newBudget.cycleLength
          })
        }
        addBudget(b)
        toast({
          title: 'Budget Created',
          description: `Budget for ${newBudget.name || newBudget.category} has been created`
        })
        resetForm()
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
          variant: 'destructive'
        })
      }
    }
  }

  const resetForm = () => {
    setNewBudget({ category: '', name: '', amount: 0, period: 'monthly', color: '#6366f1' })
    setEditingBudgetId(null)
    setCreateDialogOpen(false)
  }

  const handleEdit = (b: Budget, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBudgetId(b.id)
    setNewBudget({
      category: b.category,
      name: b.name || b.category,
      amount: b.amount,
      period: b.period,
      color: b.color || getCategoryColor(b.category),
      cycleStart: (b as any).cycleStart,
      cycleLength: (b as any).cycleLength
    })
    setCreateDialogOpen(true)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(id)
  }

  const confirmDeleteBudget = () => {
    if (confirmDelete) {
      try {
        deleteBudget(confirmDelete)
        toast({ title: 'Budget Deleted', description: 'The budget has been removed' })
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to delete budget: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
          variant: 'destructive'
        })
      } finally {
        setConfirmDelete(null)
      }
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterPeriod('all')
    setDate({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    })
    setCurrentPage(1)
  }

  const exportBudgets = () => {
    try {
      const data = filteredBudgetSummaries.map(s => ({
        name: s.budget.name,
        category: s.budget.category,
        period: s.budget.period,
        amount: s.budget.amount,
        spent: s.spent,
        remaining: s.remaining,
        percentage: s.percentage
      }))
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: 'Export Successful', description: 'Budget data exported successfully' })
    } catch {
      toast({ title: 'Export Failed', description: 'There was an error exporting your budget data', variant: 'destructive' })
    }
  }

  const handleCardClick = (b: Budget) => {
    setSelectedBudget(b)
    setOpenBudgetDialog(true)
    setDialogSearchQuery('')
    setDialogDateRange({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    })
    setDialogCurrentPage(1)
  }

  const filteredTransactionsForBudget = useMemo(() => {
    if (!selectedBudget) return []
    let list = transactions.filter(t => t.type === 'Expense' && t.category === selectedBudget.category)
    if (dialogDateRange?.from && dialogDateRange?.to) {
      const f = dialogDateRange.from.getTime()
      const to = dialogDateRange.to.getTime()
      list = list.filter(t => {
        const d = new Date(t.date).getTime()
        return d >= f && d <= to
      })
    }
    if (dialogSearchQuery.trim()) {
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(dialogSearchQuery.toLowerCase())
      )
    }
    return list
  }, [selectedBudget, transactions, dialogSearchQuery, dialogDateRange])

  const dialogTotalPages = Math.ceil(filteredTransactionsForBudget.length / dialogItemsPerPage)
  const dialogPageItems = filteredTransactionsForBudget.slice(
    (dialogCurrentPage - 1) * dialogItemsPerPage,
    dialogCurrentPage * dialogItemsPerPage
  )

  const getBudgetPeriodText = (p: string, l?: number) => {
    switch (p) {
      case 'weekly':
        return 'Weekly Budget'
      case 'bi-weekly':
        return 'Bi-Weekly Budget'
      case 'monthly':
        return 'Monthly Budget'
      case 'yearly':
        return 'Annual Budget'
      case 'custom':
        return l ? `Custom Budget (${l} days)` : 'Custom Budget'
      default:
        return 'Monthly Budget'
    }
  }

  const getBudgetStatusColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const doughnutData = {
    labels: budgetSummaries.map(b => b.budget.name || b.budget.category),
    datasets: [
      {
        data: budgetSummaries.map(b => b.spent),
        backgroundColor: budgetSummaries.map(b => b.budget.color || getCategoryColor(b.budget.category))
      }
    ]
  }
  const doughnutOptions = { responsive: true, maintainAspectRatio: false }
  const barData = {
    labels: budgetSummaries.map(b => b.budget.name || b.budget.category),
    datasets: [
      { label: 'Budget Amount', data: budgetSummaries.map(b => b.budget.amount), backgroundColor: '#6366f1' },
      { label: 'Spent', data: budgetSummaries.map(b => b.spent), backgroundColor: '#f87171' }
    ]
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } }
  }

  return (
    <div className="space-y-8 max-w-6xl pb-10 animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">Create and manage budgets for your expense categories</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                <CalendarDays className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd')} - {format(date.to, 'LLL dd, yyyy')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, yyyy')
                  )
                ) : (
                  <span>Date Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={resetFilters} title="Reset Filters">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={exportBudgets} title="Export Budgets">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </div>
      </div>
      {budgetSummaries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full h-72 border rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Spending Distribution</h2>
            </div>
            <div className="relative w-full h-full">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
          <div className="w-full h-72 border rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart4 className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Budget vs Spent</h2>
            </div>
            <div className="relative w-full h-full">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search budgets..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {budgetSummaries.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No budgets found. Create your first budget.</AlertDescription>
        </Alert>
      ) : filteredBudgetSummaries.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No budgets match your search or filters.</AlertDescription>
        </Alert>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map(s => (
              <Card
                key={s.budget.id}
                className="overflow-hidden cursor-pointer"
                onClick={() => handleCardClick(s.budget)}
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: s.budget.color || getCategoryColor(s.budget.category) }}
                />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-semibold">{s.budget.name || s.budget.category}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getBudgetPeriodText(s.budget.period, (s.budget as any).cycleLength)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={e => handleEdit(s.budget, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={e => handleDelete(s.budget.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{formatCurrency(s.spent)}</span>
                    <span className="text-sm text-muted-foreground">of {formatCurrency(s.budget.amount)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent</span>
                      <span>{s.percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={s.percentage > 100 ? 100 : s.percentage}
                      className="h-2"
                      indicatorColor={getBudgetStatusColor(s.percentage)}
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Badge variant="outline" className="bg-background">{s.budget.period}</Badge>
                    <Badge variant={s.percentage >= 100 ? 'destructive' : 'outline'} className="bg-background">
                      {s.percentage >= 100 ? (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Over budget
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          {formatCurrency(s.remaining)} left
                        </>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
      {filteredBudgetSummaries.length > itemsPerPage && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return null
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudgetId ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogDescription>Set your budget details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Expense Category</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={v => handleSelectChange('category', v)}
                  disabled={!!editingBudgetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingBudgetId ? (
                      <SelectItem value={newBudget.category}>{newBudget.category}</SelectItem>
                    ) : availableCategories.length > 0 ? (
                      availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    ) : (
                      <SelectItem value="" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Budget Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={newBudget.name || ''}
                  onChange={handleInputChange}
                  placeholder="E.g., Monthly Groceries"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={newBudget.amount || ''}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Budget Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={v => handleSelectChange('period', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newBudget.period === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cycleStart">Cycle Start Date</Label>
                    <Input
                      id="cycleStart"
                      name="cycleStart"
                      type="date"
                      value={newBudget.cycleStart || ''}
                      onChange={handleInputChange}
                      placeholder="Select start date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cycleLength">Cycle Length (days)</Label>
                    <Input
                      id="cycleLength"
                      name="cycleLength"
                      type="number"
                      min="1"
                      value={newBudget.cycleLength || ''}
                      onChange={handleInputChange}
                      placeholder="E.g., 30"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={newBudget.color}
                    onChange={handleColorChange}
                    className="w-12 h-9 p-1"
                  />
                  <span className="text-sm font-medium" style={{ color: newBudget.color }}>
                    {newBudget.name || newBudget.category || 'Selected Color'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                {editingBudgetId ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    Create Budget
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>Are you sure you want to delete this budget? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBudget}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openBudgetDialog} onOpenChange={setOpenBudgetDialog}>
        <DialogContent className="max-w-4xl">
          {selectedBudget && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Transactions for <span style={{ color: selectedBudget.color }}>
                    {selectedBudget.name || selectedBudget.category}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  View and filter all expenses logged under this budget category.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dialogDateRange?.from ? (
                          dialogDateRange.to ? (
                            <>
                              {format(dialogDateRange.from, 'LLL dd')} - {format(dialogDateRange.to, 'LLL dd, yyyy')}
                            </>
                          ) : (
                            format(dialogDateRange.from, 'LLL dd, yyyy')
                          )
                        ) : (
                          <span>Date Range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dialogDateRange?.from}
                        selected={dialogDateRange}
                        onSelect={setDialogDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-9"
                      value={dialogSearchQuery}
                      onChange={e => {
                        setDialogSearchQuery(e.target.value)
                        setDialogCurrentPage(1)
                      }}
                    />
                  </div>
                </div>
                {filteredTransactionsForBudget.length === 0 ? (
                  <Alert variant="default" className="bg-muted/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No transactions found for this budget in the selected range or matching your search.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-auto rounded border">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/20">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dialogPageItems.map((tx: Transaction) => (
                          <tr key={tx.id} className="border-b last:border-0">
                            <td className="px-4 py-2 whitespace-nowrap">{format(new Date(tx.date), 'PPP')}</td>
                            <td className="px-4 py-2">{tx.notes}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {filteredTransactionsForBudget.length > dialogItemsPerPage && (
                  <div className="flex justify-end mt-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setDialogCurrentPage(p => Math.max(p - 1, 1))}
                            className={dialogCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        {[...Array(dialogTotalPages)].map((_, i) => {
                          const page = i + 1
                          if (page === 1 || page === dialogTotalPages || (page >= dialogCurrentPage - 1 && page <= dialogCurrentPage + 1)) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink onClick={() => setDialogCurrentPage(page)} isActive={page === dialogCurrentPage}>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (page === dialogCurrentPage - 2 || page === dialogCurrentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setDialogCurrentPage(p => Math.min(p + 1, dialogTotalPages))}
                            className={dialogCurrentPage === dialogTotalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenBudgetDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BudgetPage
