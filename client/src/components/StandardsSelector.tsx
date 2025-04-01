import StandardsCategory from "./StandardsCategory";
import { useState } from "react";
import { StandardCategory } from "@/data/standards";

interface StandardsSelectorProps {
  categories: StandardCategory[];
  selectedStandards: string[];
  onStandardSelect: (standardId: string, isSelected: boolean) => void;
}

const StandardsSelector = ({ 
  categories, 
  selectedStandards, 
  onStandardSelect
}: StandardsSelectorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(categories.map(cat => [cat.id, false]))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold text-lg">Select ELA Standards</h3>
        <p className="text-neutral-600 text-sm mt-1">Choose standards to generate aligned content</p>
      </div>
      
      {categories.map((category) => (
        <StandardsCategory 
          key={category.id}
          category={category}
          isExpanded={expandedCategories[category.id]}
          selectedStandards={selectedStandards}
          onToggle={() => toggleCategory(category.id)}
          onStandardSelect={onStandardSelect}
        />
      ))}
      
      <div className="p-4 bg-neutral-50 rounded-b-lg">
        <p className="text-sm text-neutral-500 text-center">
          {selectedStandards.length === 0 
            ? "Select at least one standard from the list above." 
            : `${selectedStandards.length} standard${selectedStandards.length > 1 ? 's' : ''} selected`
          }
        </p>
      </div>
    </div>
  );
};

export default StandardsSelector;
