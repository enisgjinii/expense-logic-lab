
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CategoryData } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/finance-utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChevronRight, BarChart3, PieChart as PieChartIcon, List } from 'lucide-react';

interface CategoriesTabProps {
  categories: CategoryData[];
  highlightedCategory: string | null;
  setHighlightedCategory: (category: string | null) => void;
}

// Define colors for the charts
const COLORS = [
  '#8B5CF6', '#EC4899', '#F97316', '#22C55E', '#3B82F6', 
  '#A855F7', '#14B8A6', '#F43F5E', '#FACC15', '#64748B',
  '#FB923C', '#22D3EE', '#4ADE80', '#F472B6', '#10B981'
];

const CategoriesTab: React.FC<CategoriesTabProps> = ({ 
  categories, 
  highlightedCategory, 
  setHighlightedCategory 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'barchart' | 'piechart'>('list');
  
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.total - a.total);
  }, [categories]);

  const totalAmount = useMemo(() => {
    return categories.reduce((sum, category) => sum + category.total, 0);
  }, [categories]);

  // Calculate top categories for chart visualization
  const topCategories = useMemo(() => {
    if (categories.length <= 8) return sortedCategories;
    
    const top = sortedCategories.slice(0, 7);
    const otherSum = sortedCategories.slice(7).reduce((sum, cat) => sum + cat.total, 0);
    
    if (otherSum > 0) {
      top.push({
        name: 'Other',
        total: otherSum,
        percentage: (otherSum / totalAmount) * 100,
        color: '#64748B'
      });
    }
    
    return top;
  }, [sortedCategories, totalAmount, categories]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return topCategories.map((category, index) => ({
      name: category.name,
      value: category.total,
      color: category.color || COLORS[index % COLORS.length]
    }));
  }, [topCategories]);

  // Growth rate analysis - identifying fastest growing categories
  const growthAnalysis = useMemo(() => {
    // This is a placeholder - in a real app, you'd compare to previous periods
    return sortedCategories.slice(0, 3).map(category => ({
      name: category.name,
      growth: Math.random() * 30 - 10 // Just a random value between -10% and 20% for demo
    }));
  }, [sortedCategories]);

  return (
    <div className="space-y-6">
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Spending Categories</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Analyze where your money is going
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Top Categories</h3>
            <div className="flex space-x-1">
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'barchart' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('barchart')}
                className="h-8 px-2"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'piechart' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('piechart')}
                className="h-8 px-2"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="space-y-4">
              {sortedCategories.map((category, index) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                      />
                      <span 
                        className={`text-sm font-medium cursor-pointer hover:text-primary transition-colors ${
                          highlightedCategory === category.name ? 'text-primary font-semibold' : ''
                        }`}
                        onClick={() => setHighlightedCategory(
                          highlightedCategory === category.name ? null : category.name
                        )}
                      >
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(category.total)}</span>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2" 
                    style={{ backgroundColor: `${category.color || COLORS[index % COLORS.length]}30` }}
                    // Using inline styles for indicator since indicatorStyle is not in props
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{category.percentage.toFixed(1)}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'barchart' && (
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))} 
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewMode === 'piechart' && (
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    innerRadius={65}
                    fill="#8B5CF6"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category Insights</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Quick analysis of your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">Top Spending Category</h4>
                {sortedCategories.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: sortedCategories[0].color || COLORS[0] }}
                      />
                      <span className="font-medium">{sortedCategories[0].name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(sortedCategories[0].total)}</span>
                  </div>
                )}
                <p className="text-sm mt-2 text-muted-foreground">
                  This category represents {sortedCategories.length > 0 ? sortedCategories[0].percentage.toFixed(1) : 0}% of your total spending
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Fastest Growing Categories</h4>
                {growthAnalysis.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                    <span>{item.name}</span>
                    <span className={item.growth > 0 ? 'text-red-600' : 'text-green-600'}>
                      {item.growth > 0 ? '↑' : '↓'} {Math.abs(item.growth).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending Recommendations</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ways to optimize your spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCategories.length > 0 && sortedCategories[0].percentage > 30 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h4 className="font-medium flex items-center text-amber-800 dark:text-amber-300">
                    <ChevronRight className="h-5 w-5 mr-1" />
                    High Concentration Risk
                  </h4>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Your top category ({sortedCategories[0].name}) represents over 30% of your spending. Consider diversifying your expenses.
                  </p>
                </div>
              )}

              {/* Show some sample recommendations */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center">
                  <ChevronRight className="h-5 w-5 mr-1" />
                  Budget Allocation Suggestion
                </h4>
                <p className="text-sm mt-1 text-muted-foreground">
                  Based on your spending patterns, we recommend allocating no more than 20% of your budget to any single category.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center">
                  <ChevronRight className="h-5 w-5 mr-1" />
                  Savings Opportunity
                </h4>
                <p className="text-sm mt-1 text-muted-foreground">
                  Consider setting a monthly budget for each of your top 3 categories to control expenses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoriesTab;
