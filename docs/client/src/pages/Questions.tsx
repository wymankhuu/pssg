import React, { useState, useEffect } from 'react';
import { Standard } from '@/data/standards';
import { getStandardsForGrade } from '@/hooks/use-standards';
import { GeneratedText, Question, QuestionType } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Questions = () => {
  // State for standards
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>('6'); // Default to 6th grade
  const [standardFilter, setStandardFilter] = useState<string>('');
  const [textType, setTextType] = useState<'narrative' | 'informational'>('narrative');
  
  // State for question options
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [rigorLevel, setRigorLevel] = useState<number>(2);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [passage, setPassage] = useState<string>('');
  
  const { toast } = useToast();
  
  // Load standards for the selected grade
  useEffect(() => {
    const loadStandards = async () => {
      try {
        const categories = await getStandardsForGrade(gradeLevel);
        const allStandards: Standard[] = categories.flatMap(category => category.standards);
        setStandards(allStandards);
      } catch (error) {
        console.error('Failed to load standards:', error);
        toast({
          title: 'Error',
          description: 'Failed to load standards. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    loadStandards();
  }, [gradeLevel, toast]);
  
  // Filter standards based on text type (RL or RI) and search filter
  const filteredStandards = standards.filter(standard => {
    // Filter by text type
    const matchesTextType = textType === 'narrative' 
      ? standard.code.startsWith('RL')
      : standard.code.startsWith('RI');
    
    if (!matchesTextType) return false;
    
    // Filter by search term if one exists
    if (!standardFilter) return true;
    
    const filter = standardFilter.toLowerCase();
    return (
      standard.code.toLowerCase().includes(filter) ||
      standard.description.toLowerCase().includes(filter)
    );
  });
  
  // Generate questions
  const handleGenerateQuestions = async () => {
    if (!selectedStandard || !passage.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a passage and select a standard.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Prepare the request data
      const requestData = {
        passage: passage,
        questionType: questionType,
        standardIds: [selectedStandard.id], 
        count: 1, // Generate one question at a time
        gradeLevel: gradeLevel,
        rigorLevel: rigorLevel
      };
      
      // Send the API request
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Parse the response
      const jsonResponse = await response.json();
      
      if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
        throw new Error("Invalid response format");
      }
      
      // Add new question to the list
      setGeneratedQuestions(prev => [...prev, ...jsonResponse.questions]);
      
      toast({
        title: 'Question Generated',
        description: 'Your question has been created successfully.',
      });
    } catch (error) {
      console.error('Error generating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper to render rigor level indicators (peppers)
  const renderRigorLevel = (level: number) => {
    return (
      <div className="flex">
        {Array.from({ length: level }).map((_, i) => (
          <span key={i} className="material-icons text-orange-500">
            whatshot
          </span>
        ))}
      </div>
    );
  };
  
  // Render multiple choice question
  const renderMultipleChoiceQuestion = (question: Question, showAnswers: boolean = true) => {
    if (question.type !== 'multiple-choice') return null;
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {renderRigorLevel(rigorLevel)}
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              {selectedStandard?.code || 'Standard'}
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
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                showAnswers && option.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}>
                {option.id}
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
  
  // Render multiple select question
  const renderMultipleSelectQuestion = (question: Question, showAnswers: boolean = true) => {
    if (question.type !== 'multiple-select') return null;
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {renderRigorLevel(rigorLevel)}
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              Select {question.correctCount}
            </span>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              {selectedStandard?.code || 'Standard'}
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
              <div className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center mr-2 ${
                showAnswers && option.isCorrect ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-300'
              }`}>
                {option.id}
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
  
  // Render open response question
  const renderOpenResponseQuestion = (question: Question, showAnswers: boolean = true) => {
    if (question.type !== 'open-response') return null;
    return (
      <div key={question.id} className="mb-6 p-4 border border-indigo-100 rounded-lg bg-white">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-indigo-900">{question.question}</h4>
          <div className="flex items-center space-x-2">
            {renderRigorLevel(rigorLevel)}
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
              {selectedStandard?.code || 'Standard'}
            </span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
          <p className="text-sm text-gray-600">Write your response here...</p>
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
  
  // Render questions based on type
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoiceQuestion(question);
      case 'multiple-select':
        return renderMultipleSelectQuestion(question);
      case 'open-response':
        return renderOpenResponseQuestion(question);
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Questions</h1>
          <p className="text-gray-600">Create standards-aligned questions with different question types and rigor levels.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 space-y-6">
              {/* Text Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Text Type</label>
                <div className="flex space-x-4">
                  <button 
                    className={`px-4 py-2 rounded-md ${textType === 'narrative' ? 
                      'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    onClick={() => setTextType('narrative')}
                  >
                    Narrative
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md ${textType === 'informational' ? 
                      'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    onClick={() => setTextType('informational')}
                  >
                    Informational
                  </button>
                </div>
              </div>
              
              {/* Grade Level Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="k">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                </select>
              </div>
              
              {/* Standard Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Standard</label>
                {/* Filter input */}
                <div className="mb-3 relative">
                  <input
                    type="text"
                    placeholder="Filter standards by keyword..."
                    className="w-full p-3 pl-10 border border-indigo-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={standardFilter}
                    onChange={(e) => setStandardFilter(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="material-icons text-indigo-400">search</span>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto border border-indigo-100 rounded-md">
                  {filteredStandards.map(standard => (
                    <div 
                      key={standard.id}
                      className={`p-3 border-b border-indigo-100 cursor-pointer transition-colors hover:bg-indigo-50 ${
                        selectedStandard?.id === standard.id ? 'bg-indigo-100' : ''
                      }`}
                      onClick={() => setSelectedStandard(standard)}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border ${
                          selectedStandard?.id === standard.id
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-gray-300'
                        } mr-3 mt-1`}>
                          {selectedStandard?.id === standard.id && (
                            <span className="material-icons text-white" style={{ fontSize: '16px' }}>check</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-indigo-800">{standard.code}</div>
                          <div className="text-sm text-gray-700 mt-1">{standard.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Passage Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Passage Text</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-md h-48"
                  placeholder="Enter or paste your passage text here..."
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                ></textarea>
              </div>
              
              {/* Question Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Question Type</label>
                <div className="grid grid-cols-3 gap-3">
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
                </div>
              </div>
              
              {/* Rigor Level */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Rigor Level</label>
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
                <p className="text-xs text-indigo-600">
                  {rigorLevel === 1 && "Basic recall and understanding"}
                  {rigorLevel === 2 && "Application of concepts"}
                  {rigorLevel === 3 && "Analysis and evaluation"}
                  {rigorLevel === 4 && "Synthesis and creation"}
                </p>
              </div>
              
              {/* Generate Button */}
              <button
                className={`w-full py-4 px-5 rounded-md transition-all flex items-center justify-center text-lg font-medium ${
                  !selectedStandard || !passage.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isGenerating
                      ? 'bg-indigo-700 text-white'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:from-indigo-700 hover:to-indigo-900 hover:shadow-lg cursor-pointer'
                }`}
                onClick={handleGenerateQuestions}
                disabled={!selectedStandard || !passage.trim() || isGenerating}
              >
                <span className="material-icons mr-2">smart_toy</span>
                {isGenerating ? 'Creating Question...' : 'Create Question'}
              </button>
            </div>
          </div>
          
          {/* Right Side - Generated Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generated Questions</h2>
              
              {generatedQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                  <span className="material-icons text-5xl mb-4">quiz</span>
                  <p className="mb-2">No questions generated yet</p>
                  <p className="text-sm">Select a standard, enter a passage, and click the "Create Question" button to generate questions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {generatedQuestions.map(question => renderQuestion(question))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Questions;