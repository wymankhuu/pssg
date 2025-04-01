import { Standard } from "@/data/standards";

interface StandardsSummaryProps {
  standards: Standard[];
  textType: string;
  readingLevel: string;
  gradeLevel: string;
  onRemoveStandard: (standardId: string) => void;
}

const StandardsSummary = ({ 
  standards, 
  textType, 
  readingLevel, 
  gradeLevel,
  onRemoveStandard 
}: StandardsSummaryProps) => {
  if (standards.length === 0) {
    return null;
  }
  
  const readingLevelText = readingLevel === 'below' 
    ? 'Below' 
    : readingLevel === 'above' 
      ? 'Above' 
      : '';
  
  return (
    <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex flex-wrap gap-2">
      {standards.map((standard) => (
        <div 
          key={standard.id} 
          className="text-xs font-medium bg-primary-light text-white py-1 px-2 rounded flex items-center"
        >
          <span>{standard.code}</span>
          <button 
            className="ml-1 text-white focus:outline-none" 
            onClick={() => onRemoveStandard(standard.id)}
          >
            <span className="material-icons text-xs">close</span>
          </button>
        </div>
      ))}
      <div className="text-xs font-medium text-neutral-600 py-1 px-2">
        {textType === 'narrative' ? 'Narrative' : 'Informational'}, 
        {readingLevelText ? `${readingLevelText} ` : ''}{gradeLevel} Level
      </div>
    </div>
  );
};

export default StandardsSummary;
