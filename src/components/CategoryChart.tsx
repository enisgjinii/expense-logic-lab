
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CategorySummary } from '@/types/finance';

interface CategoryChartProps {
  data: CategorySummary[];
  selectedCategory?: string | null;
  onCategorySelect?: (category: string) => void;
}

const RADIAN = Math.PI / 180;
const CustomLabel = ({ 
  cx, 
  cy, 
  midAngle, 
  innerRadius, 
  outerRadius, 
  percent, 
  index,
  name
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for small segments
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#fff" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CategoryChart: React.FC<CategoryChartProps> = ({ data, selectedCategory, onCategorySelect }) => {
  // Take top 5 categories, combine the rest into "Others"
  const processedData = React.useMemo(() => {
    if (data.length <= 5) return data;
    
    const topCategories = data.slice(0, 4);
    const others = data.slice(4).reduce(
      (acc, curr) => {
        acc.total += curr.total;
        return acc;
      },
      { 
        category: 'Others', 
        total: 0, 
        percentage: 0,
        color: '#999999'
      }
    );
    
    others.percentage = others.total / data.reduce((sum, cat) => sum + cat.total, 0) * 100;
    
    return [...topCategories, others];
  }, [data]);

  const handleClick = (data: any, index: number) => {
    if (onCategorySelect) {
      onCategorySelect(data.category);
    }
  };

  return (
    <Card className="h-[400px] bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <CardTitle className="text-xl">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="total"
                nameKey="category"
                onClick={handleClick}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    opacity={selectedCategory && entry.category !== selectedCategory ? 0.5 : 1}
                    stroke={selectedCategory && entry.category === selectedCategory ? "#fff" : "none"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                labelFormatter={(name) => `Category: ${name}`}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry, index) => (
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>
                    {value}
                  </span>
                )}
                onClick={({value}) => onCategorySelect && onCategorySelect(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No expense data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
