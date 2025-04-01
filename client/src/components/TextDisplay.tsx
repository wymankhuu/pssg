import { useState, useEffect } from "react";
import StandardsSummary from "./StandardsSummary";
import ExportOptions from "./ExportOptions";
import TeacherNotes from "./TeacherNotes";
import PassageModifierOptions from "./PassageModifierOptions";
import { Standard } from "@/data/standards";
import { GeneratedText, Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


interface TextDisplayProps {
  generatedText: GeneratedText | null;
  isLoading: boolean;
  standards: Standard[];
  textType: string;
  readingLevel: string;
  gradeLevel: string;
  onRemoveStandard: (standardId: string) => void;
  onUpdateText?: (updatedText: GeneratedText) => void; // Optional callback for passage modification
}

// Debug function to help troubleshoot issues
const debugLog = (message: string, data?: any) => {
  console.log(`[TextDisplay] ${message}`, data || '');
};

type QuestionType = 'multiple-choice' | 'multiple-select' | 'open-response' | 'two-part';
type TabType = 'passage' | 'questions' | 'answers' | 'notes';

interface QuestionResponse {
  questions: Question[];
}

const TextDisplay = ({ 
  generatedText, 
  isLoading,
  standards, 
  textType, 
  readingLevel, 
  gradeLevel,
  onRemoveStandard,
  onUpdateText
}: TextDisplayProps) => {
  const [teacherNotes, setTeacherNotes] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('passage');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [standardIds, setStandardIds] = useState<string[]>([]);
  const [rigorLevel, setRigorLevel] = useState<number>(2); // Default to level 2 (medium difficulty)
  const [standardFilter, setStandardFilter] = useState<string>('');
  const [isModifyingPassage, setIsModifyingPassage] = useState<boolean>(false);
  
  // Initialize standardIds but don't auto-select any standards
  useEffect(() => {
    // Reset selected standards when standards or text type changes
    setStandardIds([]);
    
    // Log available standards for debugging
    if (standards.length > 0) {
      debugLog(`Available standards: ${standards.length}`, 
        standards.map(s => `${s.id}: ${s.code}`));
      
      // Filter standards based on text type for debugging
      const relevantStandards = standards.filter(standard => {
        if (textType === 'narrative') {
          return standard.code.startsWith('RL');
        } else {
          return standard.code.startsWith('RI');
        }
      });
      
      debugLog(`Relevant standards for ${textType} text type: ${relevantStandards.length}`, 
        relevantStandards.map(s => `${s.id}: ${s.code}`));
    } else {
      debugLog('No standards available');
    }
  }, [standards, textType]);
  
  // When generatedText changes (a new passage is generated), reset the questions
  useEffect(() => {
    if (generatedText) {
      debugLog('New passage generated, resetting questions');
      setGeneratedQuestions([]);
    }
  }, [generatedText]);
  const { toast } = useToast();

  const handleCopyText = () => {
    if (!generatedText) return;
    
    navigator.clipboard.writeText(generatedText.content)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The generated text has been copied to your clipboard.",
        });
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Failed to copy text to clipboard.",
          variant: "destructive",
        });
      });
  };

  // Handle passage modification (revise, stretch, shrink, level up, level down)
  const handleModifyPassage = async (instruction: string) => {
    if (!generatedText || isModifyingPassage) return;
    
    setIsModifyingPassage(true);
    
    try {
      debugLog("Modifying passage with instruction:", instruction);
      
      // Create the request payload
      const requestData = {
        passage: generatedText.content,
        title: generatedText.title,
        standardIds: standards.map(s => String(s.id)), // Ensure all IDs are strings to satisfy validation
        textType: textType,
        readingLevel,
        gradeLevel,
        instruction // The specific modification instruction
      };
      
      // Log the standardIds for debugging
      debugLog("Standard IDs for modification:", standards.map(s => `${s.id}: ${s.code}`));
      
      // Make the API request to modify the passage
      const response = await fetch("/api/modify-passage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog(`Server error: ${errorText}`);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Parse the response
      const jsonResponse = await response.json();
      debugLog("Received modified passage from server:", jsonResponse);
      
      if (!jsonResponse.success) {
        debugLog("API returned failure status", jsonResponse);
        throw new Error(jsonResponse.message || "Server returned unsuccessful response");
      }
      
      if (!jsonResponse.title || !jsonResponse.content) {
        debugLog("Invalid response format - missing required fields", jsonResponse);
        throw new Error("Invalid response format");
      }
      
      // Update the generated text with the modified version
      // We'll create a new object with updated properties from the response
      const updatedText: GeneratedText = {
        ...generatedText,
        title: jsonResponse.title,
        content: jsonResponse.content,
        teacherNotes: jsonResponse.teacherNotes || generatedText.teacherNotes,
      };
      
      // If we have a handler for updating the text in the parent component, use it
      // Otherwise, we'll need to reload the page
      if (typeof onUpdateText === 'function') {
        onUpdateText(updatedText);
        
        toast({
          title: "Passage Modified",
          description: "The passage has been successfully modified.",
        });
      } else {
        // Show toast first so user knows what's happening
        toast({
          title: "Passage Modified",
          description: "The passage has been successfully modified. Refreshing page to display changes.",
        });
        
        // Add a slight delay so the toast can be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
      
    } catch (err) {
      debugLog('Error modifying passage:', err);
      toast({
        title: "Failed to modify passage",
        description: "An error occurred while modifying the passage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsModifyingPassage(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!generatedText || standardIds.length === 0) {
      debugLog("Cannot generate questions - validation failed", {
        hasGeneratedText: !!generatedText,
        selectedStandardsCount: standardIds.length
      });
      
      toast({
        title: "Cannot Generate Questions",
        description: !generatedText 
          ? "Please generate a passage first" 
          : "Please select at least one standard",
        variant: "destructive"
      });
      return;
    }

    debugLog("Starting question generation process...");
    debugLog(`Using passage title: "${generatedText.title}"`);
    debugLog(`Selected standards for questions: ${standardIds.join(', ')}`);
    setIsGeneratingQuestions(true);
    
    try {
      // Prepare the request data
      const requestData = {
        passage: generatedText.content,
        questionType: questionType,
        standardIds: standardIds, 
        count: questionCount,
        gradeLevel: gradeLevel,
        rigorLevel: rigorLevel // Include rigor level in the request
      };
      
      debugLog("Sending question generation request with data", {
        type: questionType,
        standardIds: standardIds,
        count: questionCount,
        gradeLevel,
        rigorLevel,
        passageLength: generatedText.content.length
      });
      
      // Send the API request
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      // Log the response status
      debugLog(`Question generation response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog(`Server error: ${errorText}`);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Parse the response
      const jsonResponse = await response.json();
      debugLog("Received question response from server");
      
      if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
        debugLog("Invalid response format - questions array missing or not an array", jsonResponse);
        throw new Error("Invalid response format");
      }
      
      debugLog(`Successfully generated ${jsonResponse.questions.length} questions`);
      
      // Add the questions to our state
      const newQuestions = [...jsonResponse.questions];
      setGeneratedQuestions(prevQuestions => {
        // If we already have questions (multiple generates), append the new ones
        return [...prevQuestions, ...newQuestions];
      });
      
      // Automatically switch to the questions tab
      setActiveTab('questions');
      
      toast({
        title: "Questions Generated",
        description: `${jsonResponse.questions.length} questions have been generated.`,
      });
    } catch (err) {
      debugLog('Error generating questions:', err);
      toast({
        title: "Failed to generate questions",
        description: "An error occurred while generating questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const renderQuestionTypeDescription = () => {
    switch(questionType) {
      case 'multiple-choice':
        return 'Students select one correct answer from 4 options';
      case 'multiple-select':
        return 'Students select multiple correct answers (typically 2) from 6 options';
      case 'open-response':
        return 'Students write their own answers with a sample response and scoring guide';
      case 'two-part':
        return 'Two related questions where Part B builds on Part A, following state test formats';
      default:
        return '';
    }
  };

  // Helper to render rigor level indicators (peppers)
  const renderRigorLevel = (level: number, standardCode?: string) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {Array.from({ length: level }).map((_, i) => (
            <span key={i} className="material-icons text-orange-500" style={{ fontSize: '16px' }}>
              whatshot
            </span>
          ))}
        </div>
        {standardCode && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-medium">
            {standardCode}
          </span>
        )}
      </div>
    );
  };

  const renderMultipleChoiceQuestion = (question: Question, showAnswers: boolean) => {
    if (question.type !== 'multiple-choice') return null;
    // If the standardId looks like a standard code (e.g., RL.6.2), use it directly
    const standardCode = question.standardId.includes('.') ? question.standardId : 
      standards.find(s => s.id.toString() === question.standardId.toString())?.code || 'Standard';
    
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {/* Display rigor level (peppers) with standard code */}
            {renderRigorLevel(rigorLevel, standardCode)}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {question.options.map((option) => (
            <div 
              key={option.id} 
              className={`p-3 rounded flex items-start border ${
                showAnswers && option.isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                showAnswers && option.isCorrect ? 'bg-green-500 text-white font-medium' : 'bg-gray-200 text-gray-700'
              }`}>
                {option.id.toUpperCase()}
              </div>
              <div className="flex-1">
                <p>{option.text}</p>
              </div>
            </div>
          ))}
        </div>
        {showAnswers && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded">
            <p className="text-sm text-indigo-800"><strong>Explanation:</strong> {question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderMultipleSelectQuestion = (question: Question, showAnswers: boolean) => {
    if (question.type !== 'multiple-select') return null;
    // If the standardId looks like a standard code (e.g., RL.6.2), use it directly
    const standardCode = question.standardId.includes('.') ? question.standardId : 
      standards.find(s => s.id.toString() === question.standardId.toString())?.code || 'Standard';
    
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {/* Display rigor level (peppers) with standard code */}
            {renderRigorLevel(rigorLevel, standardCode)}
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              Select {question.correctCount}
            </span>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {question.options.map((option) => (
            <div 
              key={option.id} 
              className={`p-3 rounded flex items-start border ${
                showAnswers && option.isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center mr-3 ${
                showAnswers && option.isCorrect ? 'bg-green-500 text-white font-medium' : 'bg-gray-200 text-gray-700'
              }`}>
                {option.id.toUpperCase()}
              </div>
              <div className="flex-1">
                <p>{option.text}</p>
              </div>
            </div>
          ))}
        </div>
        {showAnswers && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded">
            <p className="text-sm text-indigo-800"><strong>Explanation:</strong> {question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderOpenResponseQuestion = (question: Question, showAnswers: boolean) => {
    if (question.type !== 'open-response') return null;
    // If the standardId looks like a standard code (e.g., RL.6.2), use it directly
    const standardCode = question.standardId.includes('.') ? question.standardId : 
      standards.find(s => s.id.toString() === question.standardId.toString())?.code || 'Standard';
    
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {/* Display rigor level (peppers) with standard code */}
            {renderRigorLevel(rigorLevel, standardCode)}
          </div>
        </div>
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded">
          <textarea 
            className="w-full h-32 p-3 bg-white border border-gray-300 rounded resize-y text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
            placeholder="Write your response here..."
          ></textarea>
        </div>
        {showAnswers && (
          <>
            <div className="mt-4">
              <h5 className="font-medium text-sm text-indigo-800">Sample Response:</h5>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded mt-1">
                <p className="text-sm">{question.sampleResponse}</p>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="font-medium text-sm text-indigo-800">Scoring Guidelines:</h5>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded mt-1">
                <p className="text-sm">{question.scoringGuidelines}</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTwoPartQuestion = (question: Question, showAnswers: boolean) => {
    if (question.type !== 'two-part') return null;
    // If the standardId looks like a standard code (e.g., RL.6.2), use it directly
    const standardCode = question.standardId.includes('.') ? question.standardId : 
      standards.find(s => s.id.toString() === question.standardId.toString())?.code || 'Standard';
    
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {/* Display rigor level (peppers) with standard code */}
            {renderRigorLevel(rigorLevel, standardCode)}
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              Two-Part Question
            </span>
          </div>
        </div>
        
        {/* Part A */}
        <div className="mt-4">
          <h5 className="text-md font-medium text-indigo-800 mb-3">Part A: {question.partA.question}</h5>
          <div className="space-y-2 ml-4">
            {question.partA.options.map((option) => (
              <div 
                key={option.id} 
                className={`p-3 rounded flex items-start border ${
                  showAnswers && option.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                  showAnswers && option.isCorrect ? 'bg-green-500 text-white font-medium' : 'bg-gray-200 text-gray-700'
                }`}>
                  {option.id.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p>{option.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Part B */}
        <div className="mt-6">
          <h5 className="text-md font-medium text-indigo-800 mb-3">Part B: {question.partB.question}</h5>
          <div className="space-y-2 ml-4">
            {question.partB.options.map((option) => (
              <div 
                key={option.id} 
                className={`p-3 rounded flex items-start border ${
                  showAnswers && option.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 w-7 h-7 ${question.partB.isMultiSelect ? 'rounded-md' : 'rounded-full'} flex items-center justify-center mr-3 ${
                  showAnswers && option.isCorrect ? 'bg-green-500 text-white font-medium' : 'bg-gray-200 text-gray-700'
                }`}>
                  {option.id.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p>{option.text}</p>
                </div>
              </div>
            ))}
            
            {question.partB.isMultiSelect && showAnswers && (
              <div className="text-xs text-indigo-700 ml-2 mt-1">
                Select {question.partB.correctCount} correct answers
              </div>
            )}
          </div>
        </div>
        
        {showAnswers && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded">
            <p className="text-sm text-indigo-800"><strong>Explanation:</strong> {question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderQuestions = (showAnswers: boolean) => {
    return (
      <div className="space-y-6">
        {generatedQuestions.map(question => {
          switch (question.type) {
            case 'multiple-choice':
              return renderMultipleChoiceQuestion(question, showAnswers);
            case 'multiple-select':
              return renderMultipleSelectQuestion(question, showAnswers);
            case 'open-response':
              return renderOpenResponseQuestion(question, showAnswers);
            case 'two-part':
              return renderTwoPartQuestion(question, showAnswers);
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Generated Content</h3>
        <ExportOptions 
          generatedText={generatedText}
          onCopy={handleCopyText}
          disabled={!generatedText || isLoading}
          questions={generatedQuestions}
        />
      </div>
      
      <StandardsSummary 
        standards={standards}
        textType={textType}
        readingLevel={readingLevel}
        gradeLevel={gradeLevel}
        onRemoveStandard={onRemoveStandard}
      />

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'passage' ? 'border-b-2 border-indigo-900 text-indigo-900' : 'text-neutral-600 hover:text-indigo-900'}`}
            onClick={() => setActiveTab('passage')}
          >
            <span className="flex items-center">
              <span className="material-icons mr-1 text-sm">article</span>
              Passage
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'questions' ? 'border-b-2 border-indigo-900 text-indigo-900' : 'text-neutral-600 hover:text-indigo-900'}`}
            onClick={() => {
              setActiveTab('questions');
              // When clicking on the Questions tab, log to confirm we have the passage
              if (generatedText) {
                debugLog(`Using passage: "${generatedText.title}" with ${generatedText.content.length} characters`);
              }
            }}
            disabled={!generatedText}
          >
            <span className="flex items-center">
              <span className="material-icons mr-1 text-sm">quiz</span>
              {generatedText ? 'Generate Questions' : 'Questions'}
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'answers' ? 'border-b-2 border-indigo-900 text-indigo-900' : 'text-neutral-600 hover:text-indigo-900'}`}
            onClick={() => setActiveTab('answers')}
            disabled={!generatedText || generatedQuestions.length === 0}
          >
            <span className="flex items-center">
              <span className="material-icons mr-1 text-sm">check_circle</span>
              Answer Key
            </span>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'notes' ? 'border-b-2 border-indigo-900 text-indigo-900' : 'text-neutral-600 hover:text-indigo-900'}`}
            onClick={() => setActiveTab('notes')}
            disabled={!generatedText}
          >
            <span className="flex items-center">
              <span className="material-icons mr-1 text-sm">description</span>
              Teacher Notes
            </span>
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-6 flex-grow overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !generatedText ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <span className="material-icons text-4xl mb-2">article</span>
            <p>Select standards and generate text to see results here</p>
          </div>
        ) : (
          <>
            {/* Passage Tab */}
            {activeTab === 'passage' && (
              <div className="space-y-6">
                {/* Add the passage modification options */}
                <PassageModifierOptions
                  generatedText={generatedText}
                  onModify={handleModifyPassage}
                  isModifying={isModifyingPassage} 
                />
                
                <div className="generated-text text-neutral-800 space-y-4">
                  <h2 className="text-xl font-bold mb-4">{generatedText.title}</h2>
                  {generatedText.content.split('\n\n').map((paragraph, index) => {
                    // Check if the paragraph starts with a number followed by a tab
                    const isNumberedParagraph = /^\d+\t/.test(paragraph);
                    
                    if (isNumberedParagraph) {
                      // Split the number and content
                      const [number, ...content] = paragraph.split('\t');
                      const paragraphContent = content.join('\t'); // Rejoin in case there were additional tabs
                      
                      return (
                        <div key={index} className="flex">
                          <span className="font-semibold mr-2">{number}</span>
                          <p className="flex-1">{paragraphContent}</p>
                        </div>
                      );
                    } else {
                      // For any non-numbered paragraphs or footnotes
                      return <p key={index}>{paragraph}</p>;
                    }
                  })}
                </div>
              </div>
            )}
            
            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Question Builder Form */}
                <div className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden">
                  <div className="bg-indigo-800 text-white p-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="material-icons mr-2">build_circle</span>
                      Question Builder
                    </h3>
                    <p className="text-indigo-200 text-sm mt-1">
                      Build custom questions for your {textType === 'narrative' ? 'narrative' : 'informational'} text
                    </p>
                  </div>
                  
                  <div className="p-5 space-y-5">
                    {/* Standards Selection Buttons */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center">
                        <span className="material-icons text-indigo-700 mr-2">school</span>
                        Select a Standard
                      </label>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* Check if standards exist and log for debugging */}
                        {standards.length === 0 && (
                          <div className="bg-amber-100 border border-amber-300 text-amber-800 p-3 rounded w-full">
                            <p className="flex items-center font-medium">
                              <span className="material-icons mr-2">warning</span>
                              No standards found
                            </p>
                            <p className="text-sm mt-1">Try generating a passage first to load standards.</p>
                          </div>
                        )}
                        
                        {/* Display standards as simple buttons */}
                        {standards
                          .filter(standard => {
                            // Only show standards based on text type (RL for narrative, RI for informational)
                            const matches = textType === 'narrative' 
                              ? standard.code.startsWith('RL')
                              : standard.code.startsWith('RI');
                            return matches;
                          })
                          .map(standard => (
                            <button 
                              key={standard.id}
                              type="button"
                              className={`py-2 px-3 rounded-md text-sm transition-all ${
                                standardIds.includes(standard.id)
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                              }`}
                              onClick={() => {
                                // Toggle selection of this standard
                                if (standardIds.includes(standard.id)) {
                                  setStandardIds([]);
                                } else {
                                  setStandardIds([standard.id]);
                                }
                              }}
                              title={standard.description}
                            >
                              {standard.code}
                            </button>
                          ))}
                      </div>
                      
                      {/* Show selected standard description */}
                      {standardIds.length > 0 && (
                        <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 text-sm text-indigo-800">
                          <span className="font-medium">Selected Standard:</span> {standards.find(s => s.id === standardIds[0])?.description}
                        </div>
                      )}
                      
                      {standardIds.length === 0 && (
                        <p className="text-sm text-orange-600 flex items-center">
                          <span className="material-icons mr-1 text-sm">info</span>
                          Please select a standard to generate questions.
                        </p>
                      )}
                    </div>
                    
                    {/* Question Type */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center">
                        <span className="material-icons text-indigo-700 mr-2">category</span>
                        Question Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setQuestionType('multiple-choice')}
                          className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                            questionType === 'multiple-choice'
                              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="material-icons text-xl mb-2 text-indigo-700">radio_button_checked</span>
                          <span className="font-medium text-neutral-800">Multiple Choice</span>
                          <span className="text-xs text-neutral-500 mt-1">Single answer</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setQuestionType('multiple-select')}
                          className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                            questionType === 'multiple-select'
                              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="material-icons text-xl mb-2 text-indigo-700">check_box</span>
                          <span className="font-medium text-neutral-800">Multiple Select</span>
                          <span className="text-xs text-neutral-500 mt-1">Multiple answers</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setQuestionType('open-response')}
                          className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                            questionType === 'open-response'
                              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="material-icons text-xl mb-2 text-indigo-700">text_fields</span>
                          <span className="font-medium text-neutral-800">Open Response</span>
                          <span className="text-xs text-neutral-500 mt-1">Written answer</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setQuestionType('two-part')}
                          className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                            questionType === 'two-part'
                              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="material-icons text-xl mb-2 text-amber-500">join_inner</span>
                          <span className="font-medium text-neutral-800">Two-Part Question</span>
                          <span className="text-xs text-neutral-500 mt-1">Parts A & B</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Number of Questions */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center">
                        <span className="material-icons text-indigo-700 mr-2">format_list_numbered</span>
                        Number of Questions
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-20 border border-gray-300 rounded-md px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="flex ml-3">
                          <button
                            type="button"
                            onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                            className="p-2 bg-gray-100 border border-gray-300 rounded-l-md hover:bg-gray-200"
                          >
                            <span className="material-icons">remove</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuestionCount(Math.min(10, questionCount + 1))}
                            className="p-2 bg-gray-100 border border-gray-300 rounded-r-md hover:bg-gray-200"
                          >
                            <span className="material-icons">add</span>
                          </button>
                        </div>
                        <span className="ml-3 text-sm text-gray-500">
                          (Max 10 questions per generation)
                        </span>
                      </div>
                    </div>
                    
                    {/* Rigor Level (Peppers) */}
                    <div className="form-group mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center">
                        <span className="material-icons text-indigo-700 mr-2">local_fire_department</span>
                        Rigor Level
                      </label>
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setRigorLevel(level)}
                            className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                              rigorLevel === level
                                ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            style={{ minWidth: '80px' }}
                          >
                            <div className="flex">
                              {Array.from({ length: level }).map((_, i) => (
                                <span key={i} className="material-icons text-orange-500">
                                  whatshot
                                </span>
                              ))}
                            </div>
                            <span className="font-medium text-neutral-800 mt-1">Level {level}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-indigo-600">
                        {rigorLevel === 1 && "Basic recall and understanding"}
                        {rigorLevel === 2 && "Application of concepts"}
                        {rigorLevel === 3 && "Analysis and evaluation"}
                        {rigorLevel === 4 && "Synthesis and creation"}
                      </p>
                    </div>
                    
                    {/* Generate Button */}
                    <button
                      className={`w-full py-4 px-5 rounded-md transition-all flex items-center justify-center text-lg font-medium mt-6 ${
                        standardIds.length === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isGeneratingQuestions
                            ? 'bg-indigo-700 text-white'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:from-indigo-700 hover:to-indigo-900 hover:shadow-lg cursor-pointer'
                      }`}
                      onClick={() => {
                        // Only execute if we have a standard selected and aren't already generating
                        if (standardIds.length === 0) {
                          toast({
                            title: "No Standard Selected",
                            description: "Please select a standard for your question.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        if (isGeneratingQuestions) {
                          return;
                        }
                        
                        console.log("Generate Question button clicked!");
                        toast({
                          title: "Creating Questions",
                          description: `Building ${questionCount} ${questionType} question${questionCount > 1 ? 's' : ''} with rigor level ${rigorLevel}...`,
                        });
                        
                        handleGenerateQuestions();
                      }}
                      disabled={standardIds.length === 0 || isGeneratingQuestions}
                    >
                      <span className="material-icons mr-2">smart_toy</span>
                      {isGeneratingQuestions 
                        ? `Creating Question${questionCount > 1 ? 's' : ''}...` 
                        : `Create Question${questionCount > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
                
                {/* Generated Questions Display */}
                {generatedQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-indigo-100 pb-2 flex items-center">
                      <span className="material-icons mr-2 text-indigo-700">help</span>
                      Generated Questions
                    </h3>
                    {renderQuestions(false)}
                  </div>
                )}
              </div>
            )}
            
            {/* Answer Key Tab */}
            {activeTab === 'answers' && (
              <div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded mb-6">
                  <h3 className="font-medium flex items-center text-indigo-900 mb-2">
                    <span className="material-icons mr-1">lock</span>
                    Teacher Answer Key
                  </h3>
                  <p className="text-sm text-indigo-700">
                    This section shows all questions with correct answers and explanations for teacher reference.
                  </p>
                </div>
                {renderQuestions(true)}
              </div>
            )}
            
            {/* Teacher Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <TeacherNotes 
                  notes={generatedText?.teacherNotes || ""}
                  isEditing={isEditingNotes}
                  onToggleEdit={() => setIsEditingNotes(!isEditingNotes)}
                  onSave={(notes) => {
                    setTeacherNotes(notes);
                    setIsEditingNotes(false);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TextDisplay;
