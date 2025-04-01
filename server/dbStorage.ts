import { 
  users, standards, standardCategories, generatedTexts, generatedQuestions,
  type User, type InsertUser, type Standard, type StandardCategory, 
  type GeneratedText, type InsertGeneratedText, 
  type GeneratedQuestions, type InsertGeneratedQuestions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getStandardById(id: string): Promise<Standard | undefined> {
    // When using string IDs, we need to adjust how we query for standards
    console.log(`Looking up standard with ID: ${id}`);
    
    // First try to find it directly by the string ID
    let standardsResult = await db.select().from(standards).where(
      eq(standards.id as any, id)
    );
    let standard = standardsResult.length > 0 ? standardsResult[0] : undefined;
    
    // If not found by id, try by code
    if (!standard) {
      console.log(`Standard not found by ID, trying code: ${id}`);
      [standard] = await db.select().from(standards).where(eq(standards.code, id));
    }
    
    // If still not found, try by id if it's a number
    if (!standard) {
      const standardId = parseInt(id, 10);
      if (!isNaN(standardId)) {
        console.log(`Standard not found by code, trying numeric ID: ${standardId}`);
        [standard] = await db.select().from(standards).where(eq(standards.id, standardId));
      }
    }
    
    console.log(`Standard lookup result for ${id}: ${standard ? 'Found' : 'Not found'}`);
    return standard;
  }
  
  async getStandardsByCategoryId(categoryId: string): Promise<Standard[]> {
    return db.select().from(standards).where(eq(standards.categoryId, categoryId));
  }
  
  async getStandardCategoriesByGradeId(gradeId: string): Promise<StandardCategory[]> {
    console.log(`Getting standard categories for grade: ${gradeId}`);
    const categories = await db.select().from(standardCategories).where(eq(standardCategories.gradeId, gradeId));
    console.log(`Found ${categories.length} categories for grade ${gradeId}`);
    return categories;
  }
  
  async generateText(insertText: Omit<InsertGeneratedText, "createdAt">): Promise<GeneratedText> {
    // The schema sets createdAt automatically in the database,
    // so we don't need to provide it here
    
    // Make sure standardIds are always strings
    const textToInsert = {
      ...insertText,
      standardIds: insertText.standardIds.map(id => String(id))
    };
    
    const [text] = await db
      .insert(generatedTexts)
      .values(textToInsert)
      .returning();
    return text;
  }
  
  async getGeneratedTextById(id: number): Promise<GeneratedText | undefined> {
    const [text] = await db.select().from(generatedTexts).where(eq(generatedTexts.id, id));
    return text || undefined;
  }
  
  async getGeneratedTextsByUserId(userId: number): Promise<GeneratedText[]> {
    return db
      .select()
      .from(generatedTexts)
      .where(eq(generatedTexts.userId, userId))
      .orderBy(desc(generatedTexts.createdAt));
  }
  
  // Questions operations
  async saveGeneratedQuestions(insertQuestionsData: Omit<InsertGeneratedQuestions, "createdAt">): Promise<GeneratedQuestions> {
    // Similar to generateText, create a properly formatted object to insert
    const questionsToInsert = {
      generatedTextId: insertQuestionsData.generatedTextId,
      questionType: insertQuestionsData.questionType,
      questionData: insertQuestionsData.questionData
    };
    
    const [questions] = await db
      .insert(generatedQuestions)
      .values([questionsToInsert] as any)
      .returning();
    return questions;
  }
  
  async getGeneratedQuestionsById(id: number): Promise<GeneratedQuestions | undefined> {
    const [questions] = await db.select().from(generatedQuestions).where(eq(generatedQuestions.id, id));
    return questions || undefined;
  }
  
  async getGeneratedQuestionsByTextId(textId: number): Promise<GeneratedQuestions[]> {
    return db
      .select()
      .from(generatedQuestions)
      .where(eq(generatedQuestions.generatedTextId, textId))
      .orderBy(desc(generatedQuestions.createdAt));
  }
}