import { 
  users, 
  type User, 
  type InsertUser,
  standards,
  type Standard,
  type InsertStandard,
  standardCategories,
  type StandardCategory,
  type InsertStandardCategory,
  generatedTexts,
  type GeneratedText,
  type InsertGeneratedText,
  generatedQuestions,
  type GeneratedQuestions,
  type InsertGeneratedQuestions
} from "@shared/schema";

// Sample data for the application
import { standardsData } from "./sampleData";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Standards operations
  getStandardById(id: string): Promise<Standard | undefined>;
  getStandardsByCategoryId(categoryId: string): Promise<Standard[]>;
  getStandardCategoriesByGradeId(gradeId: string): Promise<StandardCategory[]>;
  
  // Text generation operations
  generateText(text: Omit<InsertGeneratedText, "createdAt">): Promise<GeneratedText>;
  getGeneratedTextById(id: number): Promise<GeneratedText | undefined>;
  getGeneratedTextsByUserId(userId: number): Promise<GeneratedText[]>;
  
  // Questions operations
  saveGeneratedQuestions(questions: Omit<InsertGeneratedQuestions, "createdAt">): Promise<GeneratedQuestions>;
  getGeneratedQuestionsById(id: number): Promise<GeneratedQuestions | undefined>;
  getGeneratedQuestionsByTextId(textId: number): Promise<GeneratedQuestions[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private standards: Map<string, Standard>;
  private standardCategories: Map<string, StandardCategory>;
  private generatedTexts: Map<number, GeneratedText>;
  private generatedQuestions: Map<number, GeneratedQuestions>;
  
  currentUserId: number;
  currentTextId: number;
  currentQuestionsId: number;
  
  constructor() {
    this.users = new Map();
    this.standards = new Map();
    this.standardCategories = new Map();
    this.generatedTexts = new Map();
    this.generatedQuestions = new Map();
    
    this.currentUserId = 1;
    this.currentTextId = 1;
    this.currentQuestionsId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Add standard categories and standards from sample data
    for (const gradeId in standardsData) {
      const categories = standardsData[gradeId];
      
      categories.forEach(category => {
        // Add category
        const categoryData: StandardCategory = {
          id: category.id,
          title: category.title,
          description: category.description,
          icon: category.icon,
          color: category.color,
          gradeId: gradeId,
          standards: []
        };
        
        this.standardCategories.set(category.id, categoryData);
        
        // Add standards for this category
        category.standards.forEach(standard => {
          const standardData: Standard = {
            id: standard.id,
            code: standard.code,
            description: standard.description,
            categoryId: category.id,
            gradeId: gradeId
          };
          
          this.standards.set(standard.id, standardData);
        });
      });
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Standards operations
  async getStandardById(id: string): Promise<Standard | undefined> {
    return this.standards.get(id);
  }
  
  async getStandardsByCategoryId(categoryId: string): Promise<Standard[]> {
    return Array.from(this.standards.values()).filter(
      (standard) => standard.categoryId === categoryId
    );
  }
  
  async getStandardCategoriesByGradeId(gradeId: string): Promise<StandardCategory[]> {
    return Array.from(this.standardCategories.values()).filter(
      (category) => category.gradeId === gradeId
    );
  }
  
  // Text generation operations
  async generateText(insertText: Omit<InsertGeneratedText, "createdAt">): Promise<GeneratedText> {
    const id = this.currentTextId++;
    const text: GeneratedText = { 
      ...insertText, 
      id,
      createdAt: new Date().toISOString()
    };
    
    this.generatedTexts.set(id, text);
    return text;
  }
  
  async getGeneratedTextById(id: number): Promise<GeneratedText | undefined> {
    return this.generatedTexts.get(id);
  }
  
  async getGeneratedTextsByUserId(userId: number): Promise<GeneratedText[]> {
    return Array.from(this.generatedTexts.values()).filter(
      (text) => text.userId === userId
    );
  }
  
  // Questions operations
  async saveGeneratedQuestions(insertQuestions: Omit<InsertGeneratedQuestions, "createdAt">): Promise<GeneratedQuestions> {
    const id = this.currentQuestionsId++;
    const questions: GeneratedQuestions = { 
      ...insertQuestions, 
      id,
      createdAt: new Date().toISOString()
    };
    
    this.generatedQuestions.set(id, questions);
    return questions;
  }
  
  async getGeneratedQuestionsById(id: number): Promise<GeneratedQuestions | undefined> {
    return this.generatedQuestions.get(id);
  }
  
  async getGeneratedQuestionsByTextId(textId: number): Promise<GeneratedQuestions[]> {
    return Array.from(this.generatedQuestions.values()).filter(
      (questions) => questions.generatedTextId === textId
    );
  }
}

// Sample data for standards
const standardsData: Record<string, any[]> = {
  'k': [
    {
      id: 'k-rl',
      title: 'Reading: Literature',
      description: 'Key ideas, craft, and structure',
      icon: 'menu_book',
      color: 'bg-primary-light',
      standards: [
        {
          id: 'k-rl-1',
          code: 'RL.K.1',
          description: 'With prompting and support, ask and answer questions about key details in a text.',
          category: 'k-rl'
        },
        {
          id: 'k-rl-2',
          code: 'RL.K.2',
          description: 'With prompting and support, retell familiar stories, including key details.',
          category: 'k-rl'
        },
        {
          id: 'k-rl-3',
          code: 'RL.K.3',
          description: 'With prompting and support, identify characters, settings, and major events in a story.',
          category: 'k-rl'
        }
      ]
    }
  ],
  '1': [
    {
      id: '1-rl',
      title: 'Reading: Literature',
      description: 'Key ideas, craft, and structure',
      icon: 'menu_book',
      color: 'bg-primary-light',
      standards: [
        {
          id: '1-rl-1',
          code: 'RL.1.1',
          description: 'Ask and answer questions about key details in a text.',
          category: '1-rl'
        },
        {
          id: '1-rl-2',
          code: 'RL.1.2',
          description: 'Retell stories, including key details, and demonstrate understanding of their central message or lesson.',
          category: '1-rl'
        },
        {
          id: '1-rl-3',
          code: 'RL.1.3',
          description: 'Describe characters, settings, and major events in a story, using key details.',
          category: '1-rl'
        }
      ]
    },
    {
      id: '1-ri',
      title: 'Reading: Informational Text',
      description: 'Non-fiction reading standards',
      icon: 'article',
      color: 'bg-secondary',
      standards: [
        {
          id: '1-ri-1',
          code: 'RI.1.1',
          description: 'Ask and answer questions about key details in a text.',
          category: '1-ri'
        },
        {
          id: '1-ri-2',
          code: 'RI.1.2',
          description: 'Identify the main topic and retell key details of a text.',
          category: '1-ri'
        }
      ]
    },
    {
      id: '1-w',
      title: 'Writing',
      description: 'Text types and composition',
      icon: 'format_quote',
      color: 'bg-accent',
      standards: [
        {
          id: '1-w-3',
          code: 'W.1.3',
          description: 'Write narratives in which they recount two or more appropriately sequenced events, include some details regarding what happened, use temporal words to signal event order, and provide some sense of closure.',
          category: '1-w'
        }
      ]
    }
  ]
};

// Import and use Database Storage 
import { DatabaseStorage } from "./dbStorage";

// Uncomment the line below to use the database storage
export const storage = new DatabaseStorage();
// export const storage = new MemStorage();
