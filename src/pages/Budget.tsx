
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Budget, BudgetSummary } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2, ArrowDownCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const BudgetPage: React.FC = () => {
  const { transactions, budgets, addBudget, deleteBudget, budgetSummaries } = useFinance();
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  
  // Get unique categories from transactions
  const categories = Array.from(new Set(
    transactions.filter(t => t.type === 'Expense').map(t => t.category)
  )).sort();
  
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
    
    const newBudget: Budget = {
      id: uuidv4(),
      category,
      amount: numAmount,
      period,
      createdAt: new Date().toISOString()
    };
    
    addBudget(newBudget);
    
    // Reset form
    setAmount('');
    setCategory('');
    setPeriod('monthly');
    
    toast({
      title: "Budget Created",
      description: `Budget of ${formatCurrency(numAmount)} set for ${category}`,
    });
  };
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Create Budget</CardTitle>
            <CardDescription>Set spending limits for categories</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <Button type="submit" className="w-full mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Budget Overview</CardTitle>
            <CardDescription>Track your spending against budget limits</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetSummaries.length === 0 ? (
              <div className="text-center py-12">
                <ArrowDownCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No budgets created yet</p>
                <p className="text-sm text-muted-foreground">Create your first budget to track spending</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgetSummaries.map((summary) => (
                  <div key={summary.budget.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{summary.budget.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {summary.budget.period.charAt(0).toUpperCase() + summary.budget.period.slice(1)} budget
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBudget(summary.budget.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>
                        {formatCurrency(summary.spent)} of {formatCurrency(summary.budget.amount)}
                      </span>
                      <span className={summary.remaining >= 0 ? "text-green-600" : "text-red-600"}>
                        {summary.remaining >= 0 ? "Remaining: " : "Overspent: "}
                        {formatCurrency(Math.abs(summary.remaining))}
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(summary.percentage, 100)} 
                      className="h-2" 
                      indicatorColor={summary.percentage > 100 ? "bg-red-500" : undefined}
                    />
                    
                    <p className="text-xs text-right text-muted-foreground">
                      {summary.percentage.toFixed(1)}% spent
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetPage;
