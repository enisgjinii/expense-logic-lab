
import { useState, useEffect } from 'react';
import { Transaction, Budget, BudgetSummary } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { 
  saveBudget, 
  deleteBudgetDoc, 
  fetchBudgets 
} from './firebaseService';
import { 
  getBudgetsFromLocalStorage, 
  saveBudgetsToLocalStorage 
} from './localStorageService';

export const useBudgetManager = (
  user: any, 
  transactions: Transaction[]
) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([]);

  useEffect(() => {
    if (user) {
      fetchBudgetsFromFirebase();
    } else {
      const savedBudgets = getBudgetsFromLocalStorage();
      setBudgets(savedBudgets);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      saveBudgetsToLocalStorage(budgets);
    }
  }, [budgets, user]);

  useEffect(() => {
    if (budgets.length === 0) {
      setBudgetSummaries([]);
      return;
    }
    
    const newBudgetSummaries = budgets.map(budget => {
      const relevantTransactions = transactions.filter(t => {
        if (t.category !== budget.category || t.type !== 'Expense') return false;
        const transactionDate = new Date(t.date);
        const now = new Date();
        if (budget.period === 'monthly') {
          return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
        } else if (budget.period === 'weekly') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return transactionDate >= startOfWeek;
        } else if (budget.period === 'yearly') {
          return transactionDate.getFullYear() === now.getFullYear();
        }
        return false;
      });
      
      const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;
      
      return { budget, spent, remaining, percentage };
    });
    
    setBudgetSummaries(newBudgetSummaries);
  }, [transactions, budgets]);

  const fetchBudgetsFromFirebase = async () => {
    if (!user) return;
    
    try {
      const fetchedBudgets = await fetchBudgets(user.uid);
      setBudgets(fetchedBudgets);
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load budgets from Firebase: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  const addBudget = async (budget: Budget) => {
    try {
      if (user) {
        await saveBudget(user.uid, budget);
        await fetchBudgetsFromFirebase();
        toast({ 
          title: "Budget Updated", 
          description: `Updated budget for ${budget.category}` 
        });
      } else {
        const existingIndex = budgets.findIndex(b => b.category === budget.category);
        if (existingIndex >= 0) {
          const updatedBudgets = [...budgets];
          updatedBudgets[existingIndex] = budget;
          setBudgets(updatedBudgets);
          toast({ 
            title: "Budget Updated", 
            description: `Updated budget for ${budget.category}` 
          });
        } else {
          setBudgets(prev => [...prev, budget]);
        }
      }
    } catch (error: any) {
      console.error('Error adding/updating budget:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update budget: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  const updateBudget = addBudget;

  const deleteBudget = async (id: string) => {
    try {
      if (user) {
        await deleteBudgetDoc(user.uid, id);
        await fetchBudgetsFromFirebase();
      } else {
        setBudgets(prev => prev.filter(budget => budget.id !== id));
      }
      toast({ title: "Budget Removed", description: "Budget has been deleted" });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete budget: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  return {
    budgets,
    budgetSummaries,
    addBudget,
    updateBudget,
    deleteBudget,
    setBudgets,
    fetchBudgetsFromFirebase
  };
};
