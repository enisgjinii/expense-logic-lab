
import React, { useState } from 'react';
import CategoryChart from '@/components/CategoryChart';
import { CategorySummary } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CategoriesTabProps {
  categories: CategorySummary[];
  highlightedCategory: string | null;
  setHighlightedCategory: (category: string | null) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ 
  categories, 
  highlightedCategory, 
  setHighlightedCategory 
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  
  // Sort categories by total (highest first)
  const sortedCategories = [...categories].sort((a, b) => b.total - a.total);
  // Get top 5 for highlights
  const topCategories = sortedCategories.slice(0, 5);
  // Total expenditure across all categories
  const totalExpenditure = categories.reduce((sum, cat) => sum + cat.total, 0);
  
  // Calculate category growth (mocked data for now)
  const categoryGrowth = sortedCategories.map((category, index) => {
    // Simulate some growth trends (in a real app this would come from comparing periods)
    const growth = (index % 3 === 0) 
      ? Math.random() * 15 // Positive growth
      : -Math.random() * 10; // Negative growth
      
    return {
      ...category,
      growth: parseFloat(growth.toFixed(1)),
      trend: growth > 0 ? 'up' : 'down'
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total spending card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{formatCurrency(totalExpenditure)}</div>
            <p className="text-sm text-muted-foreground">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>
        
        {/* Top category card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <>
                <div className="text-2xl font-bold mb-1">{topCategories[0].category}</div>
                <div className="text-xl font-semibold mb-2 text-primary">
                  {formatCurrency(topCategories[0].total)}
                </div>
                <Progress 
                  value={topCategories[0].percentage} 
                  className="h-2 mb-2" 
                  style={{backgroundColor: `${topCategories[0].color}40`}}
                  indicatorStyle={{backgroundColor: topCategories[0].color}}
                />
                <p className="text-sm text-muted-foreground">
                  {topCategories[0].percentage.toFixed(1)}% of total spending
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No spending data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Fastest growing category card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Fastest Growing</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryGrowth.length > 0 ? (
              <>
                <div className="text-2xl font-bold mb-1">
                  {categoryGrowth.sort((a, b) => b.growth - a.growth)[0].category}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <span className={`text-xl font-semibold ${
                    categoryGrowth[0].growth > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {categoryGrowth[0].growth > 0 ? '+' : ''}{categoryGrowth[0].growth}%
                  </span>
                  {categoryGrowth[0].growth > 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Compared to previous period
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No trend data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="chart" onClick={() => setViewMode('chart')}>
            <PieChart className="h-4 w-4 mr-2" />
            Chart View
          </TabsTrigger>
          <TabsTrigger value="list" onClick={() => setViewMode('list')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Detailed List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-card rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Top Categories</h2>
              <div className="space-y-4">
                {topCategories.map((category, idx) => (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted ${highlightedCategory === category.category ? 'bg-accent border border-blue-200' : ''}`}
                    onClick={() => setHighlightedCategory(category.category === highlightedCategory ? null : category.category)}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: category.color}} />
                      <span>{category.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(category.total)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Category Breakdown</h2>
              <CategoryChart 
                data={categories}
                selectedCategory={highlightedCategory}
                onCategorySelect={(category) => setHighlightedCategory(category)}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <div className="bg-card rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">All Categories</h2>
              <p className="text-sm text-muted-foreground">Detailed breakdown of all spending categories</p>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-1 divide-y">
                {categoryGrowth.map((category, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: category.color}} />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${
                          category.growth > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {category.growth > 0 ? '+' : ''}{category.growth}%
                        </span>
                        {category.growth > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>{formatCurrency(category.total)}</span>
                      <span className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}% of total
                      </span>
                    </div>
                    <Progress 
                      value={category.percentage} 
                      className="h-2 mt-2" 
                      style={{backgroundColor: `${category.color}30`}}
                      indicatorStyle={{backgroundColor: category.color}}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoriesTab;
