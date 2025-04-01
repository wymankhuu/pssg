import { useState } from "react";

export interface GenerationConfig {
  readingLevel: 'below' | 'at' | 'above';
  wordCount: string;
  textType: 'narrative' | 'informational';
  topic: string;
}

interface GenerationOptionsProps {
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
}

const GenerationOptions = ({ config, onConfigChange }: GenerationOptionsProps) => {
  // Extract just the numeric part from word count for display
  const displayWordCount = config.wordCount ? config.wordCount.replace(/[^0-9]/g, '') : '';
  
  // Define topic suggestions based on text type
  const topicSuggestions = config.textType === 'narrative' 
    ? ['Adventure', 'Mystery', 'Friendship', 'Fantasy', 'Nature', 'Animals', 'School', 'Family']
    : ['Space', 'Weather', 'Animals', 'History', 'Science', 'Community', 'Environment', 'Technology'];

  const setReadingLevel = (level: 'below' | 'at' | 'above') => {
    onConfigChange({ ...config, readingLevel: level });
  };
  
  const setTextType = (type: 'narrative' | 'informational') => {
    onConfigChange({ ...config, textType: type });
  };
  
  const setTopic = (topic: string) => {
    onConfigChange({ ...config, topic });
  };
  
  const setWordCount = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Just store the numeric value
    onConfigChange({ ...config, wordCount: numericValue });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mt-6">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold flex items-center">
          <span className="w-8 h-8 rounded-full bg-indigo-900 text-white flex items-center justify-center mr-2">
            <span className="material-icons text-sm">settings</span>
          </span>
          Generation Options
        </h3>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center">
            <span className="material-icons text-indigo-900 mr-1">school</span>
            Reading Level
          </label>
          <select 
            className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={config.readingLevel}
            onChange={(e) => setReadingLevel(e.target.value as 'below' | 'at' | 'above')}
          >
            <option value="below">Below Grade Level</option>
            <option value="at">At Grade Level</option>
            <option value="above">Above Grade Level</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center">
            <span className="material-icons text-indigo-900 mr-1">format_size</span>
            Word Count
          </label>
          <div className="flex items-center">
            <input 
              type="text" 
              className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="500"
              value={displayWordCount} 
              onChange={(e) => setWordCount(e.target.value)}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-1">Enter the number of words (default: 500)</div>
        </div>
        

        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center">
            <span className="material-icons text-indigo-900 mr-1">topic</span>
            Topic (Optional)
          </label>
          <input 
            type="text" 
            className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
            placeholder="e.g., Animals, Seasons, Community" 
            value={config.topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="mt-2">
            <p className="text-xs text-neutral-600 mb-2">Suggested topics:</p>
            <div className="flex flex-wrap gap-1">
              {topicSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTopic(suggestion)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    config.topic === suggestion 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationOptions;
