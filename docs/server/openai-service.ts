import { OpenAI } from "openai";
import { GenerateTextRequest, GeneratedText, Standard } from "@shared/schema";
import { log } from "./vite";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define question types
export type QuestionType = 'multiple-choice' | 'multiple-select' | 'open-response' | 'two-part';

export interface QuestionGenerationRequest {
  passage: string;
  questionType: QuestionType;
  standardIds: string[];
  count: number;
  gradeLevel: string;
  rigorLevel?: number; // 1-4 scale representing question difficulty (optional, defaults to 2)
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: MultipleChoiceOption[];
  standardId: string;
  explanation: string;
}

export interface MultipleSelectQuestion {
  id: string;
  type: 'multiple-select';
  question: string;
  options: MultipleChoiceOption[];
  standardId: string;
  explanation: string;
  correctCount: number;
}

export interface OpenResponseQuestion {
  id: string;
  type: 'open-response';
  question: string;
  standardId: string;
  sampleResponse: string;
  scoringGuidelines: string;
}

export interface TwoPartQuestion {
  id: string;
  type: 'two-part';
  question: string;  // Overall question context/prompt
  standardId: string;
  explanation: string;
  partA: {
    question: string;
    options: MultipleChoiceOption[];
  };
  partB: {
    question: string;
    options: MultipleChoiceOption[];
    isMultiSelect: boolean;
    correctCount?: number;  // Required if isMultiSelect is true
  };
}

export type Question = MultipleChoiceQuestion | MultipleSelectQuestion | OpenResponseQuestion | TwoPartQuestion;

/**
 * Generate educational text passage based on standards and requirements
 */
export async function generateTextWithAI(
  request: GenerateTextRequest,
  standards: Standard[]
): Promise<{ title: string, content: string }> {
  log("Generating text with OpenAI", "openai");
  
  // Map standards to their descriptions
  const standardDescriptions = standards.map(s => `${s.code}: ${s.description}`).join('\n');
  
  // Check if this is a modification request
  const isModification = !!request.customContext;
  
  // Create a detailed prompt for the AI
  let prompt = '';
  
  if (isModification) {
    // Handle passage modification
    prompt = `
Modify an existing educational text passage according to specific instructions while maintaining alignment with these English Language Arts standards:

${standardDescriptions}

${request.customContext}

IMPORTANT FORMATTING REQUIREMENTS:
- Each paragraph must be numbered, starting with "1" for the first paragraph
- Each numbered paragraph should be indented after the number
- Follow this exact format for each paragraph: "[Number]\\t[Paragraph text]"
- Start a new paragraph with a new number for each main idea or scene change
- Include any necessary footnotes at the end if special terms need explanation

Please format your response as a JSON object with title and content fields, like this:
{
  "title": "The title of the passage",
  "content": "1\\tFirst paragraph text goes here, properly indented after the number...\\n\\n2\\tSecond paragraph text goes here..."
}
`;
  } else {
    // Handle new passage generation
    prompt = `
Generate an educational text passage for grade ${request.gradeId} students that aligns with the following English Language Arts standards:

${standardDescriptions}

The passage should be:
- ${request.textType === 'narrative' ? 'A narrative text (story)' : 'An informational text (non-fiction)'}
${request.topic ? `- About the topic: "${request.topic}"` : ''}
- Approximately ${request.wordCount} words in length
- At a reading level that is ${request.readingLevel === 'below' ? 'slightly below' : request.readingLevel === 'at' ? 'at' : 'slightly above'} grade ${request.gradeId} level
- Age-appropriate and engaging for students
- Clearly demonstrating the listed standards
- Include a title for the passage${request.topic ? ' that relates to the given topic' : ''}

IMPORTANT FORMATTING REQUIREMENTS:
- Each paragraph must be numbered, starting with "1" for the first paragraph
- Each numbered paragraph should be indented after the number
- Follow this exact format for each paragraph: "[Number]\\t[Paragraph text]"
- Start a new paragraph with a new number for each main idea or scene change
- Include any necessary footnotes at the end if special terms need explanation

Please format your response as a JSON object with title and content fields, like this:
{
  "title": "The title of the passage",
  "content": "1\\tFirst paragraph text goes here, properly indented after the number...\\n\\n2\\tSecond paragraph text goes here..."
}
`;
  }

  try {
    log("Sending request to OpenAI...", "openai");
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    log("Received response from OpenAI", "openai");
    
    // Log raw response first for debugging
    const rawContent = response.choices[0].message.content;
    log(`Raw response: ${rawContent?.substring(0, 100)}...`, "openai");
    
    if (!rawContent) {
      log("Empty response from OpenAI", "openai");
      return {
        title: request.topic || (request.textType === 'narrative' ? 'A Short Story' : 'Informational Text'),
        content: "1\tAn error occurred while generating the text. Please try again."
      };
    }
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(rawContent);
      log("Successfully parsed JSON response", "openai");
      
      return {
        title: parsedResponse.title || request.topic || 
               (request.textType === 'narrative' ? 'A Short Story' : 'Informational Text'),
        content: parsedResponse.content || "1\tError generating text. Please try again with different parameters."
      };
    } catch (parseError) {
      // If JSON parsing fails, still try to use the raw content
      log(`JSON parse error: ${parseError}. Using raw content as fallback.`, "openai");
      
      // Try to clean the response if it's not valid JSON
      let content = rawContent;
      
      // Check if the response looks like it might contain JSON wrapped in backticks or other characters
      const jsonMatch = rawContent.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsedJson = JSON.parse(extractedJson);
          log("Successfully extracted and parsed JSON from raw response", "openai");
          
          return {
            title: parsedJson.title || request.topic || 
                  (request.textType === 'narrative' ? 'A Short Story' : 'Informational Text'),
            content: parsedJson.content || "1\tError generating text. Please try again with different parameters."
          };
        } catch (extractError) {
          log(`Failed to extract JSON: ${extractError}`, "openai");
        }
      }
      
      // If all else fails, return a default formatted response
      return {
        title: request.topic || (request.textType === 'narrative' ? 'A Short Story' : 'Informational Text'),
        content: "1\tAn error occurred while processing the generated text. Please try again."
      };
    }
  } catch (error) {
    console.error("Error generating text with OpenAI:", error);
    log(`Error generating text with OpenAI: ${error}`, "openai");
    
    // Return a fallback in proper format if there's an error instead of throwing
    return {
      title: request.topic || (request.textType === 'narrative' ? 'A Short Story' : 'Informational Text'),
      content: "1\tAn error occurred while generating the text. Please try again.\n\n2\tIf this error persists, try selecting different standards or modifying your generation options."
    };
  }
}

/**
 * Generate teacher notes for the passage and standards
 */
export async function generateTeacherNotesWithAI(
  standards: Standard[],
  passage: string
): Promise<string> {
  log("Generating teacher notes with OpenAI", "openai");
  
  // Map standards to their descriptions
  const standardDescriptions = standards.map(s => `${s.code}: ${s.description}`).join('\n');
  
  // Create a prompt for teacher notes
  const prompt = `
Based on the following passage and ELA standards, create detailed teacher notes. 

PASSAGE:
"""
${passage}
"""

STANDARDS:
${standardDescriptions}

The teacher notes should include:
1. Key concepts and vocabulary in the passage
2. How the passage aligns with each standard
3. Suggested discussion questions
4. Potential challenges students might face with the content
5. Additional teaching tips or extension activities

Format your response as a JSON object with a notes field, like this:
{
  "notes": "The full text of the teacher notes..."
}
`;

  try {
    log("Sending request to OpenAI for teacher notes...", "openai");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    log("Received response from OpenAI for teacher notes", "openai");
    
    const rawContent = response.choices[0].message.content;
    log(`Raw notes response: ${rawContent?.substring(0, 100)}...`, "openai");
    
    if (!rawContent) {
      log("Empty teacher notes response from OpenAI", "openai");
      return "Unable to generate teacher notes. Please try again.";
    }
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(rawContent);
      log("Successfully parsed JSON response for teacher notes", "openai");
      
      return parsedResponse.notes || "Error generating teacher notes. Please try again.";
    } catch (parseError) {
      // If JSON parsing fails, still try to use the raw content
      log(`JSON parse error for teacher notes: ${parseError}. Using raw content as fallback.`, "openai");
      
      // Check if the response looks like it might contain JSON wrapped in backticks or other characters
      const jsonMatch = rawContent.match(/\{[\s\S]*"notes"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsedJson = JSON.parse(extractedJson);
          log("Successfully extracted and parsed JSON from teacher notes raw response", "openai");
          
          return parsedJson.notes || "Error generating teacher notes. Please try again.";
        } catch (extractError) {
          log(`Failed to extract JSON from teacher notes: ${extractError}`, "openai");
        }
      }
      
      // If the content contains notes but not in JSON format, try to extract text
      if (rawContent.includes("Key concepts") || rawContent.includes("Discussion questions")) {
        return rawContent;
      }
      
      // If all else fails, return a default message
      return "Unable to generate teacher notes at this time. Please try again.";
    }
  } catch (error) {
    console.error("Error generating teacher notes with OpenAI:", error);
    log(`Error generating teacher notes with OpenAI: ${error}`, "openai");
    // Return a default message instead of throwing
    return "Unable to generate teacher notes. Please try again.";
  }
}

/**
 * Generate assessment questions based on a passage
 */
export async function generateQuestionsWithAI(
  request: QuestionGenerationRequest,
  standards: Standard[]
): Promise<Question[]> {
  log(`Generating ${request.questionType} questions with OpenAI`, "openai");
  
  // Get rigor level or default to 2 (medium difficulty)
  const rigorLevel = request.rigorLevel || 2;
  
  console.log("generateQuestionsWithAI called with:", {
    requestType: request.questionType,
    count: request.count,
    standardIds: request.standardIds,
    standardsCount: standards.length,
    rigorLevel: rigorLevel
  });
  
  // Format based on question type
  let questionFormatInstructions = "";
  
  switch (request.questionType) {
    case 'multiple-choice':
      questionFormatInstructions = `
Generate ${request.count} multiple-choice questions based on the passage. 
- Each question should have 4 options (A, B, C, D)
- Only one option should be correct
- Include which standard each question aligns with
- Provide a brief explanation for the correct answer`;
      break;
      
    case 'multiple-select':
      questionFormatInstructions = `
Generate ${request.count} multiple-select questions where students must select multiple correct answers.
- Each question should have 6 options (A, B, C, D, E, F)
- Exactly 2 options should be correct for each question
- Include which standard each question aligns with
- Provide a brief explanation for why the correct answers are right`;
      break;
      
    case 'open-response':
      questionFormatInstructions = `
Generate ${request.count} open-response (constructed response) questions.
- Each question should require students to write a paragraph or more
- Include which standard each question aligns with
- Provide a sample response that would earn full credit
- Include scoring guidelines for teachers`;
      break;
      
    case 'two-part':
      questionFormatInstructions = `
Generate ${request.count} two-part questions following the state test format.
- Each question should have an overall context/prompt
- Part A should be a multiple-choice question with 4 options (A, B, C, D) and only one correct answer
- Part B should be a follow-up question that builds on Part A
- For rigor levels 1-2: Part B should be multiple-choice with 4 options
- For rigor levels 3-4: Part B should be multiple-select with 6 options (A, B, C, D, E, F) and exactly 2 correct answers
- Include which standard each question aligns with
- Provide a brief explanation for the correct answers`;
      break;
  }
  
  // Map standards to their descriptions
  const standardDescriptions = standards.map(s => `${s.code}: ${s.description}`).join('\n');
  
  // Define rigor level descriptions
  let rigorDescription = "";
  switch (rigorLevel) {
    case 1:
      rigorDescription = "These should be basic recall and understanding questions at DOK level 1, focusing on identifying explicitly stated information in the text.";
      break;
    case 2:
      rigorDescription = "These should be application and analysis questions at DOK level 2, requiring students to interpret information from the text.";
      break;
    case 3:
      rigorDescription = "These should be analysis and evaluation questions at DOK level 3, requiring students to draw conclusions and make inferences from the text.";
      break;
    case 4:
      rigorDescription = "These should be synthesis and extended thinking questions at DOK level 4, requiring students to connect ideas across texts or apply concepts in new contexts.";
      break;
  }

  const prompt = `
Based on the following passage for grade ${request.gradeLevel} students, generate assessment questions.

PASSAGE:
"""
${request.passage}
"""

STANDARDS TO COVER:
${standardDescriptions}

QUESTION RIGOR LEVEL: ${rigorLevel} out of 4
${rigorDescription}

${questionFormatInstructions}

Format your response as a JSON array with the following structure:
${getResponseFormatExample(request.questionType)}
`;

  try {
    log("Sending request to OpenAI for question generation", "openai");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    log("Received response from OpenAI for questions", "openai");
    
    const rawContent = response.choices[0].message.content;
    log(`Raw questions response: ${rawContent?.substring(0, 100)}...`, "openai");
    
    if (!rawContent) {
      log("Empty questions response from OpenAI", "openai");
      return [];
    }
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(rawContent);
      log("Successfully parsed JSON response for questions", "openai");
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        log("Invalid response format from OpenAI - missing questions array", "openai");
        return [];
      }
      
      log(`Successfully generated ${parsedResponse.questions.length} questions`, "openai");
      return parsedResponse.questions;
    } catch (parseError) {
      // If JSON parsing fails, try to extract the JSON
      log(`JSON parse error for questions: ${parseError}. Trying to extract JSON.`, "openai");
      
      // Check if the response looks like it might contain JSON wrapped in backticks or other characters
      const jsonMatch = rawContent.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsedJson = JSON.parse(extractedJson);
          log("Successfully extracted and parsed JSON from questions raw response", "openai");
          
          if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
            log("Extracted JSON is valid but missing questions array", "openai");
            return [];
          }
          
          return parsedJson.questions;
        } catch (extractError) {
          log(`Failed to extract JSON for questions: ${extractError}`, "openai");
        }
      }
      
      // If all extraction attempts fail, return empty array
      log("All parsing attempts failed, returning empty questions array", "openai");
      return [];
    }
  } catch (error) {
    console.error("Error generating questions with OpenAI:", error);
    log(`Error generating questions with OpenAI: ${error}`, "openai");
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Helper function to provide format examples based on question type
 */
function getResponseFormatExample(questionType: QuestionType): string {
  switch (questionType) {
    case 'multiple-choice':
      return `{
  "questions": [
    {
      "id": "mc1",
      "type": "multiple-choice",
      "question": "What is the main idea of the passage?",
      "options": [
        { "id": "A", "text": "Option text", "isCorrect": false },
        { "id": "B", "text": "Option text", "isCorrect": false },
        { "id": "C", "text": "Option text", "isCorrect": true },
        { "id": "D", "text": "Option text", "isCorrect": false }
      ],
      "standardId": "The relevant standard ID",
      "explanation": "Explanation of why the answer is correct"
    }
  ]
}`;
      
    case 'multiple-select':
      return `{
  "questions": [
    {
      "id": "ms1",
      "type": "multiple-select",
      "question": "Select TWO details from the passage that support the main idea.",
      "options": [
        { "id": "A", "text": "Option text", "isCorrect": true },
        { "id": "B", "text": "Option text", "isCorrect": false },
        { "id": "C", "text": "Option text", "isCorrect": false },
        { "id": "D", "text": "Option text", "isCorrect": false },
        { "id": "E", "text": "Option text", "isCorrect": true },
        { "id": "F", "text": "Option text", "isCorrect": false }
      ],
      "standardId": "The relevant standard ID",
      "explanation": "Explanation of why the answers are correct",
      "correctCount": 2
    }
  ]
}`;
      
    case 'open-response':
      return `{
  "questions": [
    {
      "id": "or1",
      "type": "open-response",
      "question": "Explain how the author develops the theme of...",
      "standardId": "The relevant standard ID",
      "sampleResponse": "A sample response that would receive full credit",
      "scoringGuidelines": "Guidelines for scoring student responses"
    }
  ]
}`;

    case 'two-part':
      return `{
  "questions": [
    {
      "id": "tp1",
      "type": "two-part",
      "question": "This question has two parts. Answer Part A and then Part B.",
      "standardId": "The relevant standard ID",
      "explanation": "Explanation of why the answers are correct",
      "partA": {
        "question": "Part A: What is the main idea of paragraph 3?",
        "options": [
          { "id": "A", "text": "Option text", "isCorrect": false },
          { "id": "B", "text": "Option text", "isCorrect": true },
          { "id": "C", "text": "Option text", "isCorrect": false },
          { "id": "D", "text": "Option text", "isCorrect": false }
        ]
      },
      "partB": {
        "question": "Part B: Which detail from the text best supports your answer to Part A?",
        "options": [
          { "id": "A", "text": "Option text", "isCorrect": false },
          { "id": "B", "text": "Option text", "isCorrect": false },
          { "id": "C", "text": "Option text", "isCorrect": true },
          { "id": "D", "text": "Option text", "isCorrect": false }
        ],
        "isMultiSelect": false
      }
    }
  ]
}`;
      
    // Default case to handle any future question types
    default:
      return `{
  "questions": []
}`;
  }
}