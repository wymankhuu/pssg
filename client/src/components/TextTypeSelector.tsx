import React from 'react';

interface TextTypeSelectorProps {
  textType: 'narrative' | 'informational';
  onTextTypeChange: (type: 'narrative' | 'informational') => void;
}

const TextTypeSelector: React.FC<TextTypeSelectorProps> = ({ textType, onTextTypeChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold">Select Text Type</h3>
        <p className="text-neutral-600 text-sm mt-1">Choose the type of text to generate</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            className={`py-3 px-4 border rounded-lg flex flex-col items-center justify-center ${
              textType === 'narrative' 
                ? 'border-primary bg-indigo-900 text-white shadow-md' 
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
            }`}
            onClick={() => onTextTypeChange('narrative')}
          >
            <span className="material-icons text-2xl mb-2">auto_stories</span>
            <span className="font-medium">Narrative</span>
            <span className="text-xs mt-1">{textType === 'narrative' ? 'Selected' : 'Fiction / Stories'}</span>
          </button>
          <button 
            className={`py-3 px-4 border rounded-lg flex flex-col items-center justify-center ${
              textType === 'informational' 
                ? 'border-primary bg-indigo-900 text-white shadow-md' 
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
            }`}
            onClick={() => onTextTypeChange('informational')}
          >
            <span className="material-icons text-2xl mb-2">description</span>
            <span className="font-medium">Informational</span>
            <span className="text-xs mt-1">{textType === 'informational' ? 'Selected' : 'Non-fiction / Facts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextTypeSelector;