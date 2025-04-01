import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToGoogleDocs } from "@/lib/export-utils";
import { GeneratedText, Question } from "@shared/schema";

interface ExportOptionsProps {
  generatedText: GeneratedText | null;
  onCopy: () => void;
  disabled: boolean;
  questions?: Question[];
}

// Define content sections for export
type ExportSection = 'passage' | 'questions' | 'answers' | 'notes';

interface ExportSectionOption {
  id: ExportSection;
  label: string;
  icon: string;
}

const ExportOptions = ({ generatedText, onCopy, disabled, questions = [] }: ExportOptionsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'pdf' | 'gdocs' | null>(null);
  const [selectedSections, setSelectedSections] = useState<ExportSection[]>(['passage']);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const exportSections: ExportSectionOption[] = [
    { id: 'passage', label: 'Passage', icon: 'article' },
    { id: 'questions', label: 'Questions', icon: 'quiz' },
    { id: 'answers', label: 'Answer Key', icon: 'check_circle' },
    { id: 'notes', label: 'Teacher Notes', icon: 'description' },
  ];
  
  // Close the export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle selected export sections
  const toggleSection = (section: ExportSection) => {
    setSelectedSections(prev => {
      if (prev.includes(section)) {
        // Don't allow removing all sections - keep at least one
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  };
  
  // Get content for export based on selected sections
  const getExportContent = () => {
    if (!generatedText) return { title: '', content: '' };
    
    console.log("Export sections selected:", selectedSections);
    console.log("Questions available:", questions.length);
    
    let content = '';
    let titleSuffix = '';
    
    // Always include title
    const title = generatedText.title;
    
    // Add passage content if selected
    if (selectedSections.includes('passage')) {
      content += generatedText.content;
      titleSuffix += ' - Passage';
    }
    
    // Add questions if selected
    if (selectedSections.includes('questions') && questions.length > 0) {
      // Add a divider if we already have content
      if (content) content += '\n\n---------- QUESTIONS ----------\n\n';
      
      // Add numbered questions
      content += questions.map((question, index) => {
        let questionText = `${index + 1}. ${question.question.replace(/^This question has two parts\./, '').trim()}`;
        
        if (question.type === 'multiple-choice') {
          questionText += '\n' + question.options.map(opt => `${opt.id.toUpperCase()}. ${opt.text}`).join('\n');
        } else if (question.type === 'multiple-select') {
          questionText += '\n' + question.options.map(opt => `${opt.id.toUpperCase()}. ${opt.text}`).join('\n');
          questionText += `\n(Select ${question.correctCount || 2} correct answers)`;
        } else if (question.type === 'two-part') {
          // State test format for two-part questions:
          // Question number followed by intro, then parts A and B
          questionText = `${index + 1}. ${question.question.replace(/^This question has two parts\./, '').trim()}`;
          
          // Add Part A
          const partAQuestion = question.partA.question.replace(/^Part A:?/i, '').trim(); 
          questionText += `\n\nPart A\n${partAQuestion}`;
          questionText += '\n' + question.partA.options.map(opt => `${opt.id.toUpperCase()}. ${opt.text}`).join('\n');
          
          // Add Part B
          const partBQuestion = question.partB.question.replace(/^Part B:?/i, '').trim();
          questionText += `\n\nPart B\n${partBQuestion}`;
          questionText += '\n' + question.partB.options.map(opt => `${opt.id.toUpperCase()}. ${opt.text}`).join('\n');
          
          if (question.partB.isMultiSelect) {
            questionText += `\n(Select ${question.partB.correctCount || 2} correct answers)`;
          }
        }
        
        return questionText;
      }).join('\n\n');
      
      titleSuffix += ' - Questions';
    }
    
    // Add answer key if selected
    if (selectedSections.includes('answers') && questions.length > 0) {
      if (content) content += '\n\n---------- ANSWER KEY ----------\n\n';
      
      content += questions.map((question, index) => {
        let answerText = `${index + 1}. `;
        
        if (question.type === 'multiple-choice') {
          const correctOption = question.options.find(opt => opt.isCorrect);
          answerText += `Answer: ${correctOption?.id.toUpperCase() || 'N/A'} - ${correctOption?.text || ''}`;
          answerText += `\nExplanation: ${question.explanation}`;
        } else if (question.type === 'multiple-select') {
          const correctOptions = question.options.filter(opt => opt.isCorrect);
          answerText += `Answer: ${correctOptions.map(opt => opt.id.toUpperCase()).join(', ')} (${correctOptions.length} correct answers)`;
          answerText += `\n${correctOptions.map(opt => `${opt.id.toUpperCase()}: ${opt.text}`).join('\n')}`;
          answerText += `\nExplanation: ${question.explanation}`;
        } else if (question.type === 'open-response') {
          answerText += 'Sample Response:\n' + question.sampleResponse;
          answerText += '\n\nScoring Guidelines:\n' + question.scoringGuidelines;
        } else if (question.type === 'two-part') {
          const partACorrect = question.partA.options.find(opt => opt.isCorrect);
          const partBCorrect = question.partB.options.filter(opt => opt.isCorrect);
          
          answerText += `Answer Part A: ${partACorrect?.id.toUpperCase() || 'N/A'} - ${partACorrect?.text || ''}`;
          
          if (question.partB.isMultiSelect && partBCorrect.length > 1) {
            answerText += `\nAnswer Part B: ${partBCorrect.map(opt => opt.id.toUpperCase()).join(', ')} (${partBCorrect.length} correct answers)`;
            answerText += `\n${partBCorrect.map(opt => `${opt.id.toUpperCase()}: ${opt.text}`).join('\n')}`;
          } else {
            answerText += `\nAnswer Part B: ${partBCorrect.map(opt => opt.id.toUpperCase()).join(', ')} - ${partBCorrect[0]?.text || ''}`;
          }
          
          answerText += `\nExplanation: ${question.explanation}`;
        }
        
        return answerText;
      }).join('\n\n');
      
      titleSuffix += ' - Answers';
    }
    
    // Add teacher notes if selected
    if (selectedSections.includes('notes') && generatedText.teacherNotes) {
      if (content) content += '\n\n---------- TEACHER NOTES ----------\n\n';
      content += generatedText.teacherNotes;
      titleSuffix += ' - Notes';
    }
    
    console.log("Generated export content:", {
      titleSuffix,
      contentLength: content.length,
      contentSample: content.substring(0, 100) + "..."
    });
    
    return {
      title: title + titleSuffix,
      content
    };
  };

  // Handle showing the export options menu
  const showExportOptions = (type: 'pdf' | 'gdocs') => {
    if (disabled || isExporting) return;
    setExportType(type);
    setShowExportMenu(true);
  };
  
  // Handle actual export after sections are selected
  const handleExport = async () => {
    if (!generatedText || !exportType || isExporting) return;
    
    setIsExporting(true);
    setShowExportMenu(false);
    
    const { title, content } = getExportContent();
    
    try {
      if (exportType === 'pdf') {
        toast({
          title: "Generating PDF",
          description: "Preparing your document...",
        });
        
        await exportToPDF({ 
          ...generatedText,
          title,
          content
        });
        
        toast({
          title: "PDF Export",
          description: "Your document has been downloaded as a PDF.",
        });
      } else if (exportType === 'gdocs') {
        toast({
          title: "Exporting to Google Docs",
          description: "Preparing your document...",
        });
        
        const url = await exportToGoogleDocs({
          ...generatedText,
          title,
          content
        });
        
        if (url) {
          toast({
            title: "Google Docs Export",
            description: "Content copied to clipboard. A blank document will open - paste the content there.",
          });
          
          // Open the URL in a new tab
          window.open(url, '_blank');
        } else {
          throw new Error("Failed to get Google Docs URL");
        }
      }
    } catch (error) {
      console.error(`Error exporting to ${exportType === 'pdf' ? 'PDF' : 'Google Docs'}:`, error);
      toast({
        title: "Export Failed",
        description: `Failed to export to ${exportType === 'pdf' ? 'PDF' : 'Google Docs'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="flex space-x-2 relative">
      <button 
        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-md"
        title="Copy to clipboard"
        onClick={onCopy}
        disabled={disabled || isExporting}
      >
        <span className="material-icons">content_copy</span>
      </button>
      
      <button 
        className={`p-2 ${isExporting && exportType === 'gdocs' ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-600 hover:bg-neutral-100'} rounded-md`}
        title="Export to Google Docs"
        onClick={() => showExportOptions('gdocs')}
        disabled={disabled || isExporting}
      >
        {isExporting && exportType === 'gdocs' ? (
          <span className="material-icons animate-pulse">cloud_sync</span>
        ) : (
          <span className="material-icons">description</span>
        )}
      </button>
      
      <button 
        className={`p-2 ${isExporting && exportType === 'pdf' ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-600 hover:bg-neutral-100'} rounded-md`}
        title="Download as PDF"
        onClick={() => showExportOptions('pdf')}
        disabled={disabled || isExporting}
      >
        {isExporting && exportType === 'pdf' ? (
          <span className="material-icons animate-pulse">download</span>
        ) : (
          <span className="material-icons">picture_as_pdf</span>
        )}
      </button>
      
      {/* Export Options Menu */}
      {showExportMenu && !isExporting && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 p-3 z-50 w-64"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Select content to export</h3>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowExportMenu(false)}
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            {exportSections.map(section => (
              <div 
                key={section.id}
                className={`flex items-center p-1.5 rounded-md cursor-pointer transition-colors
                  ${selectedSections.includes(section.id) 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-neutral-600 hover:bg-gray-100'}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="material-icons text-sm mr-2">{section.icon}</span>
                <span className="text-sm">{section.label}</span>
                <span className="ml-auto">
                  {selectedSections.includes(section.id) && (
                    <span className="material-icons text-sm">check</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          
          <button
            className="w-full py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            onClick={handleExport}
          >
            {exportType === 'pdf' ? 'Download PDF' : 'Export to Google Docs'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
