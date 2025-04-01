import { useState } from "react";
import { GeneratedText } from "@shared/schema";

interface PassageModifierOptionsProps {
  generatedText: GeneratedText | null;
  onModify: (instructions: string) => Promise<void>;
  isModifying: boolean;
}

/**
 * Component that provides options to modify a generated passage
 * Options include: Revise, Stretch, Shrink, Level Up, Level Down
 */
const PassageModifierOptions = ({ 
  generatedText, 
  onModify, 
  isModifying 
}: PassageModifierOptionsProps) => {
  const [activeModifier, setActiveModifier] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Only render if we have a generated text
  if (!generatedText) return null;

  // Define the modification options
  const modificationOptions = [
    {
      id: 'revise',
      label: 'Revise',
      description: 'Improve clarity and readability while maintaining length',
      icon: 'auto_fix_high',
      color: 'indigo',
      instruction: '', // Will be populated from custom input
      isCustom: true
    },
    {
      id: 'stretch',
      label: 'Stretch',
      description: 'Make the passage longer with more details',
      icon: 'expand',
      color: 'emerald',
      instruction: 'Please expand this passage by adding more details, descriptions, and content. Maintain the same complexity level and educational standards alignment, but make the passage approximately 30% longer.'
    },
    {
      id: 'shrink',
      label: 'Shrink',
      description: 'Make the passage shorter and more concise',
      icon: 'compress',
      color: 'amber',
      instruction: 'Please condense this passage to make it more concise while preserving the key content and alignment to educational standards. Aim to reduce the length by approximately 30% without losing essential information or lowering the complexity level.'
    },
    {
      id: 'level-up',
      label: 'Level Up',
      description: 'Increase complexity and vocabulary level',
      icon: 'trending_up',
      color: 'purple',
      instruction: 'Please increase the complexity of this passage by elevating vocabulary, sentence structure, and conceptual difficulty. Maintain the same length and educational standards alignment, but make the passage more challenging and sophisticated for students.'
    },
    {
      id: 'level-down',
      label: 'Level Down',
      description: 'Decrease complexity and vocabulary level',
      icon: 'trending_down',
      color: 'blue',
      instruction: 'Please decrease the complexity of this passage by simplifying vocabulary, sentence structure, and concepts. Maintain the same length and educational standards alignment, but make the passage more accessible for students who need additional support.'
    }
  ];

  // Helper function to get tailwind color classes based on color name
  const getColorClass = (color: string, state: 'default' | 'active' | 'icon') => {
    // Map color names to specific tailwind classes
    const colorClasses: Record<string, Record<string, string>> = {
      indigo: {
        default: 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm',
        active: 'bg-indigo-50 border-indigo-300 shadow-sm',
        icon: 'text-indigo-600'
      },
      emerald: {
        default: 'border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm',
        active: 'bg-emerald-50 border-emerald-300 shadow-sm',
        icon: 'text-emerald-600'
      },
      amber: {
        default: 'border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm',
        active: 'bg-amber-50 border-amber-300 shadow-sm',
        icon: 'text-amber-600'
      },
      purple: {
        default: 'border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm',
        active: 'bg-purple-50 border-purple-300 shadow-sm',
        icon: 'text-purple-600'
      },
      blue: {
        default: 'border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm',
        active: 'bg-blue-50 border-blue-300 shadow-sm',
        icon: 'text-blue-600'
      }
    };
    
    // Return the appropriate class or a default if color not found
    return colorClasses[color]?.[state] || 'border-gray-200';
  };

  // Handle clicking on a modification option
  const handleModify = (option: typeof modificationOptions[0]) => {
    if (isModifying) return; // Prevent multiple clicks while processing
    
    console.log("Using manual DOM implementation for", option.id);
    
    if (option.isCustom) {
      // For custom (revise) option, show the input field
      setShowCustomInput(true);
      setActiveModifier(option.id);
      // Initialize with a default instruction
      setCustomInstructions("Please revise this passage to improve clarity and readability while maintaining the current length, complexity level, and educational standards alignment. Focus on enhancing flow, word choice, and engagement.");
    } else {
      // For pre-defined options, submit directly
      setActiveModifier(option.id);
      onModify(option.instruction)
        .finally(() => {
          setActiveModifier(null);
        });
    }
  };
  
  // Handle submitting custom instructions
  const handleSubmitCustomInstructions = () => {
    if (!customInstructions.trim()) {
      return; // Don't submit empty instructions
    }
    
    onModify(customInstructions)
      .finally(() => {
        setActiveModifier(null);
        setShowCustomInput(false);
        // Keep the instructions in case user wants to use them again
      });
  };
  
  // Handle canceling custom input
  const handleCancelCustomInput = () => {
    setShowCustomInput(false);
    setActiveModifier(null);
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
        <span className="material-icons mr-2 text-indigo-700">build_circle</span>
        Passage Modification Options
      </h3>
      
      {/* Custom instructions input shown when Revise is clicked */}
      {showCustomInput && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">Custom Revision Instructions</h4>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Enter specific instructions for how to revise the passage..."
            className="w-full p-3 border border-indigo-300 rounded h-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isModifying}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancelCustomInput}
              disabled={isModifying}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCustomInstructions}
              disabled={isModifying || !customInstructions.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isModifying ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Modifying...
                </span>
              ) : (
                "Apply Changes"
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {modificationOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleModify(option)}
            disabled={isModifying || showCustomInput}
            className={`p-3 rounded-lg border transition-all flex flex-col items-center ${
              isModifying && activeModifier === option.id
                ? getColorClass(option.color, 'active')
                : (isModifying || showCustomInput)
                  ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                  : getColorClass(option.color, 'default')
            }`}
          >
            <span className={`material-icons text-xl mb-2 ${getColorClass(option.color, 'icon')}`}>
              {option.icon}
            </span>
            <span className="font-medium text-gray-800">{option.label}</span>
            <span className="text-xs text-gray-500 text-center mt-1">
              {option.description}
            </span>
            
            {isModifying && activeModifier === option.id && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Note: Modifying the passage will retain all educational standards but may change the content and structure.
      </p>
    </div>
  );
};

export default PassageModifierOptions;