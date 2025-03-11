
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { Budget } from '@/types/finance';
import { formatCurrency, getCategoryColor } from '@/utils/finance-utils';
import { v4 as uuidv4 } from 'uuid';
import { Plus, PiggyBank, Pencil, Trash, X, Check, DollarSign, CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BudgetPage: React.FC = () => {
  const { budgets, budgetSummaries, transactions, addBudget, deleteBudget, updateBudget } = useFinance();
  
  // State for new budget form
  const [newBudget, setNewBudget] = useState<Omit<Budget, 'id'>>({
    category: '',
    name: '',
    amount: 0,
    period: 'monthly',
    color: '#6366f1'
  });
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  
  // Extract unique categories from transactions
  const uniqueCategories = Array.from(
    new Set(transactions.filter(t => t.type === 'Expense').map(t => t.category))
  ).sort();
  
  // Filter categories that don't already have budgets
  const availableCategories = uniqueCategories.filter(
    category => !budgets.some(budget => budget.category === category)
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBudget(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewBudget(prev => ({
      ...prev,
      [name]: value,
      color: name === 'category' ? getCategoryColor(value) : prev.color
    }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBudget(prev => ({
      ...prev,
      color: e.target.value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }
    
    if (newBudget.amount <= 0) {
      toast({
        title: "Error",
        description: "Budget amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    const budgetData: Budget = {
      id: uuidv4(),
      category: newBudget.category,
      name: newBudget.name || newBudget.category,
      amount: newBudget.amount,
      period: newBudget.period,
      color: newBudget.color
    };
    
    addBudget(budgetData);
    
    toast({
      title: "Budget Created",
      description: `Budget for ${newBudget.category} has been created`
    });
    
    // Reset form
    setNewBudget({
      category: '',
      name: '',
      amount: 0,
      period: 'monthly',
      color: '#6366f1'
    });
  };
  
  const handleEdit = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setNewBudget({
      category: budget.category,
      name: budget.name || budget.category,
      amount: budget.amount,
      period: budget.period,
      color: budget.color || getCategoryColor(budget.category)
    });
  };
  
  const handleCancelEdit = () => {
    setEditingBudgetId(null);
    setNewBudget({
      category: '',
      name: '',
      amount: 0,
      period: 'monthly',
      color: '#6366f1'
    });
  };
  
  const handleSaveEdit = () => {
    if (newBudget.amount <= 0) {
      toast({
        title: "Error",
        description: "Budget amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    if (editingBudgetId) {
      const updatedBudget: Budget = {
        id: editingBudgetId,
        category: newBudget.category,
        name: newBudget.name || newBudget.category,
        amount: newBudget.amount,
        period: newBudget.period,
        color: newBudget.color
      };
      
      updateBudget(updatedBudget);
      
      toast({
        title: "Budget Updated",
        description: `Budget for ${newBudget.name || newBudget.category} has been updated`
      });
      
      setEditingBudgetId(null);
      setNewBudget({
        category: '',
        name: '',
        amount: 0,
        period: 'monthly',
        color: '#6366f1'
      });
    }
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
      toast({
        title: "Budget Deleted",
        description: "The budget has been removed"
      });
    }
  };
  
  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getBudgetPeriodText = (period: string) => {
    switch (period) {
      case 'weekly': return 'Weekly Budget';
      case 'yearly': return 'Annual Budget';
      default: return 'Monthly Budget';
    }
  };
  
  return (
    <div className="space-y-8 max-w-6xl pb-10 animate-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget Management</h1>
        <p className="text-muted-foreground">
          Create and manage budgets for your expense categories
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Budget</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {budgetSummaries.length === 0 ? (
            <Alert variant="default" className="bg-muted/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't created any budgets yet. Click on "Create Budget" to set up your first budget.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetSummaries.map((summary) => (
                <Card key={summary.budget.id} className="overflow-hidden">
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: summary.budget.color || getCategoryColor(summary.budget.category) }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-semibold">{summary.budget.name || summary.budget.category}</CardTitle>
                        <p className="text-sm text-muted-foreground">{getBudgetPeriodText(summary.budget.period)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEdit(summary.budget)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDelete(summary.budget.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{formatCurrency(summary.spent)}</span>
                      <span className="text-sm text-muted-foreground">of {formatCurrency(summary.budget.amount)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent</span>
                        <span>{summary.percentage.toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={summary.percentage > 100 ? 100 : summary.percentage} 
                        className="h-2" 
                        indicatorClassName={getBudgetStatusColor(summary.percentage)}
                      />
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <Badge variant="outline" className="bg-background">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        {summary.budget.period}
                      </Badge>
                      <Badge variant={summary.percentage >= 100 ? "destructive" : "outline"} className="bg-background">
                        {summary.percentage >= 100 ? (
                          <>
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Over budget
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            {formatCurrency(summary.remaining)} left
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {budgetSummaries.length > 0 && availableCategories.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => document.getElementById('create-tab')?.click()}>
                <Plus className="mr-1 h-4 w-4" />
                Add Another Budget
              </Button>
            </div>
          )}
          
          {budgetSummaries.length > 0 && availableCategories.length === 0 && uniqueCategories.length > 0 && (
            <Alert variant="default" className="bg-muted/50 mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have created budgets for all your expense categories. Create new transaction with different categories to add more budgets.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="create" id="create-tab">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                {editingBudgetId ? "Edit Budget" : "Create New Budget"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Expense Category</Label>
                    <Select
                      value={newBudget.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                      disabled={!!editingBudgetId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingBudgetId ? (
                          <SelectItem value={newBudget.category}>{newBudget.category}</SelectItem>
                        ) : (
                          availableCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {availableCategories.length === 0 && !editingBudgetId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        You have created budgets for all categories. Create transactions with new categories first.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Budget Name (Optional)</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newBudget.name || ''}
                      onChange={handleInputChange}
                      placeholder="E.g., Monthly Groceries"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Budget Amount</Label>
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
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="period">Budget Period</Label>
                    <Select
                      value={newBudget.period}
                      onValueChange={(value) => handleSelectChange('period', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                        {newBudget.name || newBudget.category || "Selected Color"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  {editingBudgetId ? (
                    <>
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        <X className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleSaveEdit}>
                        <Check className="mr-1 h-4 w-4" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={!newBudget.category || newBudget.amount <= 0 || availableCategories.length === 0}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Create Budget
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetPage;
