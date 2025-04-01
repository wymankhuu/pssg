import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestionsRequestSchema, generateTextRequestSchema, GeneratedText, Question, QuestionType, Standard, questionTypeSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateQuestionsWithAI, generateTeacherNotesWithAI, generateTextWithAI } from "./openai-service";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get standards for a grade
  app.get("/api/standards/:gradeId", async (req, res) => {
    try {
      const gradeId = req.params.gradeId;
      console.log(`Fetching standards for grade: ${gradeId}`);
      const categories = await storage.getStandardCategoriesByGradeId(gradeId);
      console.log(`Found ${categories.length} categories for grade ${gradeId}: ${categories.map(c => c.id).join(', ')}`);
      
      // For each category, get its standards
      const enhancedCategories = [];
      for (const category of categories) {
        // Get standards for this category
        const standards = await storage.getStandardsByCategoryId(category.id);
        
        // Deduplicate standards based on code to avoid duplicates
        const uniqueStandards = [];
        const codeSet = new Set();
        
        for (const standard of standards) {
          if (!codeSet.has(standard.code)) {
            codeSet.add(standard.code);
            uniqueStandards.push(standard);
          } else {
            console.log(`Removed duplicate standard: ${standard.code}`);
          }
        }
        
        // Add category with its unique standards
        enhancedCategories.push({
          ...category,
          standards: uniqueStandards
        });
      }
      
      // Return enhanced categories
      res.json(enhancedCategories);
    } catch (error) {
      console.error("Error fetching standards:", error);
      res.status(500).json({ message: "Failed to fetch standards" });
    }
  });

  // Generate text based on standards and options
  app.post("/api/generate", async (req, res) => {
    try {
      // Ensure all standardIds are strings before validation
      if (req.body && req.body.standardIds) {
        req.body.standardIds = req.body.standardIds.map((id: any) => String(id));
      }
      
      // Validate request
      const request = generateTextRequestSchema.parse(req.body);
      
      // Get all selected standards by ID (ensuring they are strings)
      const standardPromises = request.standardIds.map(id => 
        storage.getStandardById(String(id))
      );
      
      const standards = await Promise.all(standardPromises);
      const validStandards = standards.filter(s => s !== undefined);
      
      if (validStandards.length === 0) {
        return res.status(400).json({ message: "No valid standards provided" });
      }

      log("Generating text with OpenAI...", "openai");
      
      // Generate the text using OpenAI
      const { content, title } = await generateTextWithAI(request, validStandards);
      
      // Generate teacher notes
      const teacherNotes = await generateTeacherNotesWithAI(validStandards, content);
      
      // Save the generated text to storage
      const generatedText = await storage.generateText({
        title,
        content,
        teacherNotes,
        gradeId: request.gradeId,
        standardIds: request.standardIds,
        readingLevel: request.readingLevel,
        textType: request.textType,
      });
      
      res.json(generatedText);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error generating text:", error);
      res.status(500).json({ message: "Failed to generate text" });
    }
  });

  // Generate questions for a passage
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const questionSchema = z.object({
        passage: z.string(),
        questionType: questionTypeSchema, // Use the imported schema which includes 'two-part'
        standardIds: z.array(z.string()),
        count: z.number().int().min(1).max(10),
        gradeLevel: z.string(),
        rigorLevel: z.number().int().min(1).max(4).optional().default(2) // 1-4 scale, default to level 2
      });

      // Ensure all standardIds are strings before validation
      if (req.body && req.body.standardIds) {
        req.body.standardIds = req.body.standardIds.map((id: any) => String(id));
      }

      // Validate request with our custom schema
      const request = questionSchema.parse(req.body);
      
      // Get the standards for this text
      const standardPromises = request.standardIds.map(id => 
        storage.getStandardById(String(id))
      );
      
      const standards = await Promise.all(standardPromises);
      const validStandards = standards.filter(s => s !== undefined) as Standard[];
      
      if (validStandards.length === 0) {
        return res.status(400).json({ message: "No valid standards found" });
      }
      
      log("Generating questions with OpenAI...", "openai");
      
      // Generate questions using OpenAI
      const questions = await generateQuestionsWithAI({
        passage: request.passage,
        questionType: request.questionType as QuestionType,
        standardIds: request.standardIds,
        count: request.count,
        gradeLevel: request.gradeLevel,
        rigorLevel: request.rigorLevel || 2, // Pass the rigor level to the AI service
      }, validStandards);
      
      // We don't need to save to storage for this direct API usage
      res.json({ questions });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Modify an existing passage (revise, stretch, shrink, level up, level down)
  app.post("/api/modify-passage", async (req, res) => {
    try {
      console.log("Received passage modification request", { 
        body: req.body ? { 
          instructionLength: req.body.instruction?.length || 0,
          hasTitle: !!req.body.title,
          hasPassage: !!req.body.passage,
          standardIdsCount: Array.isArray(req.body.standardIds) ? req.body.standardIds.length : 0
        } : 'No body'
      });
      
      if (!req.body) {
        return res.status(400).json({
          message: "No request body provided",
          success: false
        });
      }
      
      // Debugging the actual content to see what we're receiving
      console.log("Passage preview:", req.body.passage ? req.body.passage.substring(0, 100) + "..." : "No passage");
      console.log("Title:", req.body.title);
      console.log("Instruction:", req.body.instruction);
      console.log("StandardIds:", req.body.standardIds);
      
      // Create a schema for passage modification
      const modifyPassageSchema = z.object({
        passage: z.string().min(1, "Passage is required"),
        title: z.string().min(1, "Title is required"),
        standardIds: z.array(z.string()),
        textType: z.enum(["narrative", "informational"]),
        readingLevel: z.enum(["below", "at", "above"]),
        gradeLevel: z.string(),
        instruction: z.string().min(1, "Modification instruction is required")
      });
      
      // Validate request
      const request = modifyPassageSchema.parse(req.body);
      console.log("Request validated successfully");
      
      // Get standards information
      const standardPromises = request.standardIds.map(id => 
        storage.getStandardById(String(id))
      );
      
      const standards = await Promise.all(standardPromises);
      const validStandards = standards.filter(s => s !== undefined) as Standard[];
      console.log(`Found ${validStandards.length} valid standards out of ${request.standardIds.length} requested`);
      
      if (validStandards.length === 0) {
        return res.status(400).json({ 
          message: "No valid standards found. Please select at least one standard.",
          success: false
        });
      }
      
      log("Modifying passage with OpenAI...", "openai");
      log(`Instruction: ${request.instruction}`, "openai");
      
      // Use the actual OpenAI implementation to modify the passage
      // Use the OpenAI API to modify the passage
      const response = await generateTextWithAI({
        gradeId: request.gradeLevel,
        standardIds: request.standardIds,
        readingLevel: request.readingLevel,
        textType: request.textType,
        wordCount: "maintain",  // Keep the current word count unless instruction says otherwise
        topic: "maintain",      // Maintain existing topic
        customContext: `Existing title: "${request.title}". Existing passage: "${request.passage}". Modification instruction: ${request.instruction}`
      }, validStandards);
      
      console.log("Generated modified text", {
        titleLength: response.title.length,
        contentLength: response.content.length
      });
      
      // Generate teacher notes for the modified passage
      const teacherNotes = await generateTeacherNotesWithAI(validStandards, response.content);
      
      console.log("Generated teacher notes", {
        notesLength: teacherNotes.length
      });
      
      // Return the modified passage and title
      res.json({
        title: response.title,
        content: response.content,
        teacherNotes,
        success: true
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Validation error:", validationError.message);
        return res.status(400).json({ 
          message: validationError.message,
          success: false
        });
      }
      
      console.error("Error modifying passage:", error);
      res.status(500).json({ 
        message: "Failed to modify passage. " + (error instanceof Error ? error.message : "Unknown error"),
        success: false
      });
    }
  });

  // Export to Google Docs
  app.post("/api/export/google-docs", async (req, res) => {
    try {
      const text = req.body as GeneratedText;
      
      if (!text || !text.title || !text.content) {
        return res.status(400).json({ message: "Invalid text content" });
      }
      
      log("Exporting content to Google Docs", "export");
      log(`Title: ${text.title}`, "export");
      log(`Content length: ${text.content.length} characters`, "export");
      
      // Google Docs URL has a size limit of approximately 2000 characters
      // Need to create a more streamlined approach for longer content
      
      // Create a formatted Google Docs URL with properly encoded parameters
      const title = encodeURIComponent(text.title);
      
      // Format content for Google Docs
      let formattedContent = text.content;
      
      // Replace numbered paragraphs with proper formatting
      formattedContent = formattedContent.replace(/^(\d+)\t/gm, "$1. ");
      
      // Format section headings with proper Google Docs formatting (bold headings)
      formattedContent = formattedContent.replace(/---------- (.*?) ----------/g, "** $1 **\n");
      
      // Google Docs URL parameter approach isn't working reliably
      // Let's use a clipboard-based approach for all documents
      log("Creating blank Google Doc with clipboard content approach", "export");
      
      // Create a blank document with just the title
      const googleDocsUrl = `https://docs.google.com/document/create?title=${title}`;
      
      res.json({ 
        url: googleDocsUrl,
        success: true,
        isLargeDocument: true,
        content: formattedContent  // Send content back to client so they can copy-paste
      });
    } catch (error) {
      console.error("Error exporting to Google Docs:", error);
      log(`Error exporting to Google Docs: ${error}`, "export");
      res.status(500).json({ message: "Failed to export to Google Docs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}


