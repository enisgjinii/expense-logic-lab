
import { DashboardStats } from '@/types/finance';

export interface DashboardInsights {
  highestExpense: {
    category: string;
    total: number;
  } | null;
  growingExpense: {
    category: string;
    growth: number;
  } | null;
  savingsRate: number;
}

export const getInsights = (stats: DashboardStats): DashboardInsights => {
  const highestExpenseCategory = stats.byCategory.length > 0
    ? { ...stats.byCategory[0] }
    : null;
  
  const growingExpenses = stats.byMonth.length > 2 
    ? stats.byCategory.map(cat => {
        const prevMonthCategories = stats.byMonth[stats.byMonth.length - 2].categories || [];
        const prevCategory = prevMonthCategories.find(c => c.category === cat.category);
        const prevAmount = prevCategory ? prevCategory.total : 0;
        
        const growth = prevAmount > 0 ? (cat.total - prevAmount) / prevAmount * 100 : 0;
        return { 
          ...cat, 
          growth 
        };
      }).sort((a, b) => b.growth - a.growth)[0]
    : null;
  
  return {
    highestExpense: highestExpenseCategory,
    growingExpense: growingExpenses ? { 
      category: growingExpenses.category, 
      growth: growingExpenses.growth 
    } : null,
    savingsRate: stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100) : 0
  };
};
