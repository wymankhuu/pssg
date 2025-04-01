import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import StandardsSelector from "@/components/StandardsSelector";
import GenerationOptions, { GenerationConfig } from "@/components/GenerationOptions";
import TextDisplay from "@/components/TextDisplay";
import TextTypeSelector from "@/components/TextTypeSelector";
import GenerateButton from "@/components/GenerateButton";
import { getStandardsForGrade } from "@/hooks/use-standards";
import { getGradeLevelById } from "@/data/grade-levels";
import { Standard } from "@/data/standards";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerateTextRequest, GeneratedText } from "@shared/schema";

const Generator = () => {
  const [match, params] = useRoute("/generator/:grade");
  const gradeId = params?.grade || "k";
  const gradeLevel = getGradeLevelById(gradeId);
  
  const { toast } = useToast();
  
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<Standard[]>([]);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({
    readingLevel: 'at',
    wordCount: '500',
    textType: 'narrative',
    topic: '',
  });
  
  const { data: allCategories, isLoading: isLoadingStandards } = useQuery({
    queryKey: [`/api/standards/${gradeId}`],
    queryFn: () => getStandardsForGrade(gradeId),
  });
  
  // Filter categories based on text type
  const categories = useMemo(() => {
    if (!allCategories) return null;
    
    if (generationConfig.textType === 'narrative') {
      // For narrative, show only Reading Literature standards
      return allCategories.filter(category => 
        category.id.includes('-rl') || // Reading Literature
        !category.id.includes('-ri')   // Other categories except Reading Informational
      );
    } else {
      // For informational, show only Reading Informational standards
      return allCategories.filter(category => 
        category.id.includes('-ri') || // Reading Informational
        !category.id.includes('-rl')   // Other categories except Reading Literature
      );
    }
  }, [allCategories, generationConfig.textType]);
  
  // State to store the generated text result
  const [localGeneratedText, setLocalGeneratedText] = useState<GeneratedText | null>(null);
  
  // This mutation will generate new text from the API
  const { mutate: generateText, isPending: isGenerating, data: apiGeneratedText } = useMutation({
    mutationFn: async (request: GenerateTextRequest) => {
      const res = await apiRequest("POST", "/api/generate", request);
      return res.json() as Promise<GeneratedText>;
    },
    onSuccess: (data) => {
      // When we successfully get text from the API, update our local state
      setLocalGeneratedText(data);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate text. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // When apiGeneratedText changes, update our local copy
  useEffect(() => {
    if (apiGeneratedText) {
      setLocalGeneratedText(apiGeneratedText);
    }
  }, [apiGeneratedText]);
  
  useEffect(() => {
    // Reset selected standards when grade changes
    setSelectedStandardIds([]);
    setSelectedStandards([]);
  }, [gradeId]);
  
  useEffect(() => {
    if (categories) {
      // Collect all standards from all categories for use in the standards dropdown
      const allStandards: Standard[] = [];
      categories.forEach(category => {
        category.standards.forEach(standard => {
          allStandards.push(standard);
        });
      });
      
      // Now filter for the selected ones
      const filteredStandards = allStandards.filter(standard => 
        selectedStandardIds.includes(standard.id)
      );
      
      console.log("[Generator] All standards:", allStandards.length, 
        allStandards.map(s => `${s.id}: ${s.code}`));
      console.log("[Generator] Selected standards:", filteredStandards.length,
        filteredStandards.map(s => `${s.id}: ${s.code}`));
        
      // We need to always pass all standards to TextDisplay to allow question generation
      setSelectedStandards(allStandards);
    }
  }, [selectedStandardIds, categories]);
  
  const handleStandardSelect = (standardId: string, isSelected: boolean) => {
    // Always ensure standardId is a string
    const standardIdStr = String(standardId);
    
    if (isSelected) {
      setSelectedStandardIds(prev => [...prev, standardIdStr]);
    } else {
      setSelectedStandardIds(prev => prev.filter(id => id !== standardIdStr));
    }
  };
  
  const handleRemoveStandard = (standardId: string) => {
    // Ensure standardId is a string
    const standardIdStr = String(standardId);
    setSelectedStandardIds(prev => prev.filter(id => id !== standardIdStr));
  };
  
  const handleGenerateText = () => {
    if (selectedStandardIds.length === 0) {
      toast({
        title: "No Standards Selected",
        description: "Please select at least one standard to generate text.",
        variant: "destructive",
      });
      return;
    }
    
    const request: GenerateTextRequest = {
      standardIds: selectedStandardIds,
      gradeId,
      readingLevel: generationConfig.readingLevel,
      wordCount: generationConfig.wordCount,
      textType: generationConfig.textType,
      topic: generationConfig.topic,
    };
    
    generateText(request);
  };
  
  const handleTextTypeChange = (type: 'narrative' | 'informational') => {
    setGenerationConfig(prev => ({ ...prev, textType: type }));
    // Reset selected standards when text type changes
    setSelectedStandardIds([]);
  };

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        {isLoadingStandards ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : categories ? (
          <>
            {/* Text Type selector at the top */}
            <TextTypeSelector 
              textType={generationConfig.textType}
              onTextTypeChange={handleTextTypeChange}
            />
            
            {/* Standards Selector */}
            <StandardsSelector 
              categories={categories}
              selectedStandards={selectedStandardIds}
              onStandardSelect={handleStandardSelect}
            />
            
            {/* Generation Options */}
            <GenerationOptions 
              config={generationConfig}
              onConfigChange={setGenerationConfig}
            />
            
            {/* Generate Button at the bottom */}
            <GenerateButton 
              selectedStandardCount={selectedStandardIds.length}
              onGenerateText={handleGenerateText}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
            <p className="text-neutral-500">Failed to load standards</p>
          </div>
        )}
      </div>
      
      <div className="lg:col-span-2">
        <TextDisplay 
          generatedText={localGeneratedText}
          isLoading={isGenerating}
          standards={selectedStandards}
          textType={generationConfig.textType}
          readingLevel={generationConfig.readingLevel}
          gradeLevel={gradeLevel?.label || ''}
          onRemoveStandard={handleRemoveStandard}
          onUpdateText={(updatedText) => {
            // Directly update our local state with the modified text
            if (updatedText) {
              setLocalGeneratedText(updatedText);
              toast({
                title: "Passage Updated",
                description: "The passage has been successfully modified.",
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default Generator;
