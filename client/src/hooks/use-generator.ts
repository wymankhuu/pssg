import { useState } from "react";
import { GenerateTextRequest, GeneratedText } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<GeneratedText | null>(null);

  const generateText = async (request: GenerateTextRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/generate", request);
      const data = await response.json();
      setGeneratedText(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate text";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateText,
    generatedText,
    isLoading,
    error
  };
}
