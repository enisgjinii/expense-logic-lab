
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  onClick?: () => void;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  onClick,
}) => {
  return (
    <Card 
      className={cn("bg-card/60 backdrop-blur-sm shadow-sm border animate-in", className)}
      onClick={onClick}
      {...(onClick ? { role: "button", tabIndex: 0 } : {})}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="w-8 h-8 p-1 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.value > 0 
              ? "text-income" 
              : trend.value < 0 
                ? "text-expense" 
                : "text-muted-foreground"
          )}>
            {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
