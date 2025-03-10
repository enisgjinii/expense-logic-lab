
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyData } from '@/types/finance';

interface MonthlyChartProps {
  data: MonthlyData[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const aYearNum = parseInt(aYear);
      const bYearNum = parseInt(bYear);
      
      if (aYearNum !== bYearNum) return aYearNum - bYearNum;
      
      const aMonthIndex = months.indexOf(aMonth);
      const bMonthIndex = months.indexOf(bMonth);
      
      return aMonthIndex - bMonthIndex;
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover shadow-md rounded-md p-2 border text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-income">Income: ${payload[0].value.toFixed(2)}</p>
          <p className="text-expense">Expense: ${payload[1].value.toFixed(2)}</p>
          <p className="font-medium">Balance: ${(payload[0].value - payload[1].value).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-[400px] bg-card/60 backdrop-blur-sm shadow-sm border animate-in">
      <CardHeader>
        <CardTitle className="text-xl">Monthly Income & Expenses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={sortedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="income" name="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No monthly data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;
