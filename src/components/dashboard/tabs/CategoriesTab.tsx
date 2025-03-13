
import React from 'react';
import CategoryChart from '@/components/CategoryChart';
import { CategorySummary } from '@/types/finance';
import { formatCurrency } from '@/utils/finance-utils';

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
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
      <div className="md:col-span-1 bg-card rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-medium mb-4">Top Categories</h2>
        <div className="space-y-4">
          {categories.slice(0, 5).map((category, idx) => (
            <div 
              key={idx} 
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted ${highlightedCategory === category.category ? 'bg-blue-50 border border-blue-200' : ''}`}
              onClick={() => setHighlightedCategory(category.category === highlightedCategory ? null : category.category)}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: category.color || `hsl(${idx * 50}, 70%, 50%)`}} />
                <span>{category.category}</span>
              </div>
              <span className="font-medium">{formatCurrency(category.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 bg-card rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-medium mb-4">Category Breakdown</h2>
        <CategoryChart 
          data={categories}
          selectedCategory={highlightedCategory}
          onCategorySelect={(category) => setHighlightedCategory(category)}
        />
      </div>
    </div>
  );
};

export default CategoriesTab;
