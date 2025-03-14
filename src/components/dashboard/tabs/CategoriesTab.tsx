
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CircleDollarSign, ArrowUpRight, ArrowDownRight, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryItem {
  category: string;
  total: number;
  percentage: number;
  change?: number;
}

interface CategoriesTabProps {
  categories: CategoryItem[];
  highlightedCategory: string | null;
  setHighlightedCategory: (category: string | null) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const CategoriesTab: React.FC<CategoriesTabProps> = ({ 
  categories, 
  highlightedCategory,
  setHighlightedCategory
}) => {
  const [activeView, setActiveView] = useState<'chart' | 'list'>('chart');
  const { stats } = useFinance();
  
  const topCategories = [...categories].sort((a, b) => b.total - a.total).slice(0, 5);
  const totalExpense = categories.reduce((sum, cat) => sum + cat.total, 0);
  
  const pieData = categories
    .sort((a, b) => b.total - a.total)
    .map((cat, index) => ({
      name: cat.category,
      value: cat.total,
      percentage: ((cat.total / totalExpense) * 100).toFixed(1)
    }));

  const barData = categories
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(cat => ({
      name: cat.category,
      amount: cat.total,
    }));
  
  return (
    <div className="space-y-6">
      <Card className="border shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Expense Categories</CardTitle>
            <Tabs defaultValue="chart" className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart" onClick={() => setActiveView('chart')}>Chart</TabsTrigger>
                <TabsTrigger value="list" onClick={() => setActiveView('list')}>List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>
            {highlightedCategory 
              ? `Details for ${highlightedCategory}` 
              : 'Breakdown of your spending by category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeView === 'chart' ? (
            <div className="w-full h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    onClick={(data) => setHighlightedCategory(data.name)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={highlightedCategory === entry.name ? 1 : highlightedCategory ? 0.4 : 0.8} 
                        stroke={highlightedCategory === entry.name ? '#fff' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar 
                    dataKey="amount" 
                    fill="#8884d8" 
                    onClick={(data) => setHighlightedCategory(data.name)} 
                    cursor="pointer"
                    barSize={20}
                  >
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={highlightedCategory === entry.name ? 1 : highlightedCategory ? 0.4 : 0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topCategories.map((category) => (
          <Card 
            key={category.category} 
            className={`border shadow-sm bg-card/60 backdrop-blur-sm cursor-pointer transition-all ${
              highlightedCategory === category.category ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setHighlightedCategory(category.category)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <CircleDollarSign className="h-4 w-4 mr-2 text-primary" />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(category.total)}</span>
                <span className="text-sm text-muted-foreground">
                  {((category.total / totalExpense) * 100).toFixed(1)}% of total
                </span>
              </div>
              {category.change !== undefined && (
                <div className="mt-2 flex items-center text-sm">
                  {category.change > 0 ? (
                    <><TrendingUp className="h-4 w-4 mr-1 text-red-500" /> <span className="text-red-500">Increased by {category.change.toFixed(1)}%</span></>
                  ) : (
                    <><TrendingDown className="h-4 w-4 mr-1 text-green-500" /> <span className="text-green-500">Decreased by {Math.abs(category.change).toFixed(1)}%</span></>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Spending Insights</CardTitle>
          <CardDescription>Learn where your money is going and how to optimize</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/40 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-1">Top Expense</h3>
              <p className="text-xl font-bold">{categories.length > 0 ? categories[0].category : 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{categories.length > 0 ? formatCurrency(categories[0].total) : '-'}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-1">Total Categories</h3>
              <p className="text-xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Unique spending areas</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-1">Biggest Growth</h3>
              <p className="text-xl font-bold">{categories.reduce((max, cat) => (cat.change && cat.change > (max?.change || 0)) ? cat : max, { category: 'N/A', total: 0, percentage: 0, change: 0 }).category}</p>
              <p className="text-sm text-muted-foreground">Fastest growing expense</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Spending Tips</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                <span>Focus on your top spending categories to make the biggest impact on your savings.</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                <span>Set budget limits for categories that have been growing consistently.</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                <span>Consider tracking smaller purchases - they often add up to significant amounts over time.</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesTab;
