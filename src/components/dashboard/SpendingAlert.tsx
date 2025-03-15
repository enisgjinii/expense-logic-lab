
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SpendingAlertProps {
  category: string | undefined;
  growth: number | undefined;
}

const SpendingAlert: React.FC<SpendingAlertProps> = ({ category, growth }) => {
  const { t, formatNumber } = useLanguage();
  
  if (!category || !growth) return null;
  
  const formattedGrowth = formatNumber(growth, { 
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  });
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 animate-pulse">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">{t('dashboard.spendingAlert')}</h3>
          <div className="mt-1 text-sm text-amber-700">
            {t('dashboard.spendingAlertDescription', { 
              category, 
              growth: formattedGrowth 
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingAlert;
