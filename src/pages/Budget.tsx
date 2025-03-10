import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Budget, BudgetSummary } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2, ArrowDownCircle, PieChart, RefreshCcw, Search, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const BudgetPage: React.FC = () => {
  const { transactions, budgets, addBudget, deleteBudget, updateBudget, budgetSummaries } = useFinance();
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [name, setName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'percentage' | 'alphabetical' | 'amount'>('percentage');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const categories = useMemo(() => {
    return Array.from(new Set(
      transactions.filter(t => t.type === 'Expense').map(t => t.category)
    )).sort();
  }, [transactions]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    if (editingBudget) {
      const updatedBudget = {
        ...editingBudget,
        category,
        amount: numAmount,
        period,
        name: name || category,
        updatedAt: new Date().toISOString()
      };
      
      updateBudget(updatedBudget);
      
      toast({
        title: "Budget Updated",
        description: `Budget for ${name || category} has been updated`,
      });
      
      setEditingBudget(null);
    } else {
      const newBudget: Budget = {
        id: uuidv4(),
        category,
        amount: numAmount,
        period,
        name: name || category,
        createdAt: new Date().toISOString()
      };
      
      addBudget(newBudget);
      
      toast({
        title: "Budget Created",
        description: `Budget of ${formatCurrency(numAmount)} set for ${name || category}`,
      });
    }
    
    resetForm();
  };
  
  const resetForm = () => {
    setAmount('');
    setCategory('');
    setPeriod('monthly');
    setName('');
  };
  
  const editBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setName(budget.name || '');
  };
  
  const cancelEdit = () => {
    setEditingBudget(null);
    resetForm();
  };
  
  const handleDeleteBudget = (id: string) => {
    deleteBudget(id);
    
    if (editingBudget && editingBudget.id === id) {
      cancelEdit();
    }
    
    toast({
      title: "Budget Deleted",
      description: "The budget has been removed",
    });
  };
  
  const filteredBudgetSummaries = useMemo(() => {
    let filtered = [...budgetSummaries];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(summary => summary.budget.period === activeTab);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(summary => 
        summary.budget.category.toLowerCase().includes(query) || 
        (summary.budget.name && summary.budget.name.toLowerCase().includes(query))
      );
    }
    
    if (!showCompleted) {
      filtered = filtered.filter(summary => summary.percentage < 100);
    }
    
    switch (sortOrder) {
      case 'percentage':
        return filtered.sort((a, b) => b.percentage - a.percentage);
      case 'alphabetical':
        return filtered.sort((a, b) => (a.budget.name || a.budget.category).localeCompare(b.budget.name || b.budget.category));
      case 'amount':
        return filtered.sort((a, b) => b.budget.amount - a.budget.amount);
      default:
        return filtered;
    }
  }, [budgetSummaries, activeTab, searchQuery, showCompleted, sortOrder]);
  
  const getBudgetStatusColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 85) return "bg-amber-500";
    if (percentage > 65) return "bg-blue-500";
    return "bg-green-500";
  };
  
  const calculateTotalBudget = useMemo(() => {
    const totals = {
      budgeted: 0,
      spent: 0,
      remaining: 0
    };
    
    filteredBudgetSummaries.forEach(summary => {
      totals.budgeted += summary.budget.amount;
      totals.spent += summary.spent;
    });
    
    totals.remaining = totals.budgeted - totals.spent;
    
    return totals;
  }, [filteredBudgetSummaries]);
  
  const overallPercentage = calculateTotalBudget.budgeted > 0 
    ? (calculateTotalBudget.spent / calculateTotalBudget.budgeted) * 100 
    : 0;
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Budget Planner</h1>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                View Options
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2 flex items-center justify-between">
                <span className="text-sm">Show completed</span>
                <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
              </div>
              <DropdownMenuItem onClick={() => setSortOrder('percentage')}>
                Sort by percentage
                {sortOrder === 'percentage' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('alphabetical')}>
                Sort alphabetically
                {sortOrder === 'alphabetical' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('amount')}>
                Sort by amount
                {sortOrder === 'amount' && <Badge className="ml-2">Active</Badge>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Budget Summary</CardTitle>
          <CardDescription>Overview of all your budget categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Budgeted</p>
                <h3 className="text-2xl font-bold">{formatCurrency(calculateTotalBudget.budgeted)}</h3>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <h3 className="text-2xl font-bold">{formatCurrency(calculateTotalBudget.spent)}</h3>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <h3 className={`text-2xl font-bold ${calculateTotalBudget.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(Math.abs(calculateTotalBudget.remaining))}
                </h3>
              </Card>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Budget Usage</span>
                <span className="text-sm font-medium">{overallPercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(overallPercentage, 100)} 
                className="h-2" 
                indicatorColor={overallPercentage > 100 ? "bg-red-500" : "bg-blue-500"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {editingBudget ? "Edit Budget" : "Create Budget"}
            </CardTitle>
            <CardDescription>
              {editingBudget ? "Update your spending limit" : "Set spending limits for categories"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Budget Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="E.g., Dining Out"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="appearance-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period">Budget Period</Label>
                <Select value={period} onValueChange={(value: 'monthly' | 'weekly' | 'yearly') => setPeriod(value)}>
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">
                  {editingBudget ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" /> Update Budget
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
                    </>
                  )}
                </Button>
                
                {editingBudget && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium">Budget Overview</CardTitle>
                <CardDescription>Track your spending against budget limits</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search budgets..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <div className="px-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <CardContent>
            {filteredBudgetSummaries.length === 0 ? (
              <div className="text-center py-12">
                <ArrowDownCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No budgets found</p>
                <p className="text-sm text-muted-foreground">
                  {budgetSummaries.length === 0 
                    ? "Create your first budget to track spending" 
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-6">
                  {filteredBudgetSummaries.map((summary) => (
                    <Collapsible key={summary.budget.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant={summary.budget.period === "weekly" ? "outline" : summary.budget.period === "monthly" ? "default" : "secondary"}>
                              {summary.budget.period.charAt(0).toUpperCase() + summary.budget.period.slice(1)}
                            </Badge>
                            <div>
                              <h4 className="font-medium">
                                {summary.budget.name || summary.budget.category}
                              </h4>
                              {summary.budget.name && (
                                <p className="text-xs text-muted-foreground">{summary.budget.category}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editBudget(summary.budget)}
                              className="h-8 w-8"
                            >
                              <PieChart className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove the budget for {summary.budget.name || summary.budget.category}.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteBudget(summary.budget.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>
                            {formatCurrency(summary.spent)} of {formatCurrency(summary.budget.amount)}
                          </span>
                          <span className={summary.remaining >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {summary.remaining >= 0 ? "Remaining: " : "Overspent: "}
                            {formatCurrency(Math.abs(summary.remaining))}
                          </span>
                        </div>
                        
                        <Progress 
                          value={Math.min(summary.percentage, 100)} 
                          className="h-2" 
                          indicatorColor={getBudgetStatusColor(summary.percentage)}
                        />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.min(summary.percentage, 100).toFixed(1)}% spent</span>
                          {summary.percentage > 100 && (
                            <span className="text-red-500 font-medium">
                              Exceeded by {(summary.percentage - 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <CollapsibleContent className="mt-4 pt-4 border-t">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="text-sm">
                                {new Date(summary.budget.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {summary.budget.updatedAt && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Last Updated</p>
                                <p className="text-sm">
                                  {new Date(summary.budget.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Daily Budget</p>
                              <p className="text-sm">
                                {formatCurrency(
                                  summary.budget.period === 'weekly' 
                                    ? summary.budget.amount / 7 
                                    : summary.budget.period === 'monthly' 
                                      ? summary.budget.amount / 30 
                                      : summary.budget.amount / 365
                                )}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Average Daily Spending</p>
                              <p className="text-sm">
                                {formatCurrency(summary.spent / 
                                  (summary.budget.period === 'weekly' 
                                    ? 7 
                                    : summary.budget.period === 'monthly' 
                                      ? 30 
                                      : 365
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Spending Trend</p>
                            <Progress 
                              value={
                                summary.budget.period === 'weekly' 
                                  ? (new Date().getDay() / 7) * 100
                                  : summary.budget.period === 'monthly'
                                    ? (new Date().getDate() / 30) * 100
                                    : ((new Date().getMonth() * 30 + new Date().getDate()) / 365) * 100
                              } 
                              className="h-1 bg-gray-200" 
                              indicatorColor="bg-gray-400"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Period Start</span>
                              <span>
                                {
                                  summary.budget.period === 'weekly' 
                                    ? `${new Date().getDay()} of 7 days`
                                    : summary.budget.period === 'monthly'
                                      ? `${new Date().getDate()} of 30 days`
                                      : `${new Date().getMonth() + 1} of 12 months`
                                }
                              </span>
                              <span>Period End</span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredBudgetSummaries.length} of {budgetSummaries.length} budgets
            </p>
            
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
              setShowCompleted(true);
              setSortOrder('percentage');
            }}>
              <RefreshCcw className="mr-2 h-3 w-3" /> Reset Filters
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BudgetPage;