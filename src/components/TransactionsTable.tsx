
// Import Tooltip properly
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DateRange } from 'react-day-picker';

// Fix other TypeScript errors by updating signatures and function parameters
function formatDateRange(dateRange: DateRange | undefined): { from: string, to: string } {
  if (!dateRange || !dateRange.from) {
    return { from: '', to: '' };
  }
  
  return {
    from: dateRange.from.toISOString(),
    to: dateRange.to ? dateRange.to.toISOString() : dateRange.from.toISOString()
  };
}

// For the setDateRange issue, define a wrapper function
function handleDateRangeChange(range: DateRange, setDateRange: React.Dispatch<React.SetStateAction<{ from: Date; to: Date }>>): void {
  if (range.from && range.to) {
    setDateRange({ from: range.from, to: range.to });
  } else if (range.from) {
    setDateRange({ from: range.from, to: range.from });
  }
}

// Fix for the unknown key issue
function safeGetKey(value: unknown): React.Key {
  if (typeof value === 'string' || typeof value === 'number') {
    return value as React.Key;
  }
  return String(value);
}

// Fix for the unknown state setter issue
function safeSetState<T>(value: unknown, setter: React.Dispatch<React.SetStateAction<T>>, defaultValue: T): void {
  if (value !== undefined && value !== null) {
    setter(value as T);
  } else {
    setter(defaultValue);
  }
}
