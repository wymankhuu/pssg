import { Standard, StandardCategory } from "@/data/standards";

interface StandardsCategoryProps {
  category: StandardCategory;
  isExpanded: boolean;
  selectedStandards: string[];
  onToggle: () => void;
  onStandardSelect: (standardId: string, isSelected: boolean) => void;
}

const StandardsCategory = ({
  category,
  isExpanded,
  selectedStandards,
  onToggle,
  onStandardSelect
}: StandardsCategoryProps) => {
  return (
    <div className="border-b border-neutral-200">
      <button 
        className="w-full p-4 text-left flex justify-between items-center hover:bg-neutral-50"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <span className={`w-10 h-10 rounded-full bg-indigo-900 text-white flex items-center justify-center mr-3 shadow-sm`}>
            <span className="material-icons text-md">{category.icon}</span>
          </span>
          <div>
            <h4 className="font-medium">{category.title}</h4>
            <p className="text-sm text-neutral-500">{category.description}</p>
          </div>
        </div>
        <span className={`material-icons transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          {category.standards.map((standard: Standard) => (
            <label 
              key={standard.id} 
              className={`flex items-start p-2 rounded cursor-pointer ${selectedStandards.includes(String(standard.id)) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-neutral-50'}`}
            >
              <input 
                type="checkbox" 
                className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500" 
                checked={selectedStandards.includes(String(standard.id))}
                onChange={(e) => onStandardSelect(standard.id, e.target.checked)}
              />
              <div>
                <p className="font-medium text-sm">{standard.code}</p>
                <p className="text-sm text-neutral-700">{standard.description}</p>
                {selectedStandards.includes(String(standard.id)) && (
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    <span className="material-icons text-xs mr-1">check_circle</span>
                    Selected
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default StandardsCategory;
