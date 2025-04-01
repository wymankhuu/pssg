import React from 'react';

interface GenerateButtonProps {
  selectedStandardCount: number;
  onGenerateText: () => void;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ selectedStandardCount, onGenerateText }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mt-6">
      <div className="p-4">
        <button 
          className="w-full py-3 px-4 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 transition-colors flex items-center justify-center text-lg font-medium"
          onClick={onGenerateText}
          disabled={selectedStandardCount === 0}
        >
          <span className="material-icons mr-2">auto_awesome</span>
          Generate Text Passage
        </button>
        <p className="text-sm text-neutral-500 mt-2 text-center">
          {selectedStandardCount === 0 
            ? "Select at least one standard to generate aligned text." 
            : `${selectedStandardCount} standard${selectedStandardCount > 1 ? 's' : ''} selected`
          }
        </p>
      </div>
    </div>
  );
};

export default GenerateButton;