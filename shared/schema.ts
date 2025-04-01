import { pgTable, text, serial, integer, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (for authentication/authorization)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Standards schema
export const standards = pgTable("standards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id", { length: 50 }).notNull(),
  gradeId: varchar("grade_id", { length: 5 }).notNull(),
});

export const insertStandardSchema = createInsertSchema(standards).pick({
  code: true,
  description: true,
  categoryId: true,
  gradeId: true,
});

// Standard Categories schema
export const standardCategories = pgTable("standard_categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  gradeId: varchar("grade_id", { length: 5 }).notNull(),
});

export const insertStandardCategorySchema = createInsertSchema(standardCategories).pick({
  id: true,
  title: true,
  description: true,
  icon: true,
  color: true,
  gradeId: true,
});

// Generated Text schema
export const generatedTexts = pgTable("generated_texts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  teacherNotes: text("teacher_notes"),
  gradeId: varchar("grade_id", { length: 5 }).notNull(),
  userId: integer("user_id"),
  standardIds: json("standard_ids").notNull().$type<string[]>(),
  readingLevel: varchar("reading_level", { length: 10 }).notNull(),
  textType: varchar("text_type", { length: 20 }).notNull(),
  createdAt: text("created_at").notNull().$default(() => new Date().toISOString()),
});

// Generated Questions schema
export const generatedQuestions = pgTable("generated_questions", {
  id: serial("id").primaryKey(),
  generatedTextId: integer("generated_text_id").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(),
  questionData: json("question_data").notNull().$type<Question[]>(),
  createdAt: text("created_at").notNull().$default(() => new Date().toISOString()),
});

export const insertGeneratedTextSchema = createInsertSchema(generatedTexts).pick({
  title: true,
  content: true,
  teacherNotes: true,
  gradeId: true,
  userId: true,
  standardIds: true,
  readingLevel: true,
  textType: true,
});

export const insertGeneratedQuestionsSchema = createInsertSchema(generatedQuestions).pick({
  generatedTextId: true,
  questionType: true,
  questionData: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Standard = typeof standards.$inferSelect;
export type InsertStandard = z.infer<typeof insertStandardSchema>;

export type StandardCategory = typeof standardCategories.$inferSelect;
export type InsertStandardCategory = z.infer<typeof insertStandardCategorySchema>;

export type GeneratedText = typeof generatedTexts.$inferSelect;
export type InsertGeneratedText = z.infer<typeof insertGeneratedTextSchema>;

export type GeneratedQuestions = typeof generatedQuestions.$inferSelect;
export type InsertGeneratedQuestions = z.infer<typeof insertGeneratedQuestionsSchema>;

// Request schemas
export const generateTextRequestSchema = z.object({
  standardIds: z.array(z.string()).min(1, "At least one standard must be selected"),
  gradeId: z.string().min(1, "Grade ID is required"),
  readingLevel: z.enum(["below", "at", "above"]),
  wordCount: z.string().min(1, "Word count is required"),
  textType: z.enum(["narrative", "informational"]),
  topic: z.string().optional(),
  customContext: z.string().optional(), // Added for passage modification
});

export type GenerateTextRequest = z.infer<typeof generateTextRequestSchema>;

// Question types
export const questionTypeSchema = z.enum(['multiple-choice', 'multiple-select', 'open-response', 'two-part']);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const generateQuestionsRequestSchema = z.object({
  generatedTextId: z.number(),
  questionType: questionTypeSchema,
  count: z.number().min(1).max(10),
});

export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsRequestSchema>;

// Multiple choice option schema
export const multipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export type MultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>;

// Multiple choice question schema
export const multipleChoiceQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('multiple-choice'),
  question: z.string(),
  options: z.array(multipleChoiceOptionSchema),
  standardId: z.string(),
  explanation: z.string(),
});

export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;

// Multiple select question schema
export const multipleSelectQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('multiple-select'),
  question: z.string(),
  options: z.array(multipleChoiceOptionSchema),
  standardId: z.string(),
  explanation: z.string(),
  correctCount: z.number(),
});

export type MultipleSelectQuestion = z.infer<typeof multipleSelectQuestionSchema>;

// Open response question schema
export const openResponseQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('open-response'),
  question: z.string(),
  standardId: z.string(),
  sampleResponse: z.string(),
  scoringGuidelines: z.string(),
});

export type OpenResponseQuestion = z.infer<typeof openResponseQuestionSchema>;

// Two-part question schema
export const twoPartQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('two-part'),
  question: z.string(),
  standardId: z.string(),
  explanation: z.string(),
  partA: z.object({
    question: z.string(),
    options: z.array(multipleChoiceOptionSchema),
  }),
  partB: z.object({
    question: z.string(),
    options: z.array(multipleChoiceOptionSchema),
    isMultiSelect: z.boolean(),
    correctCount: z.number().optional(),
  }),
});

export type TwoPartQuestion = z.infer<typeof twoPartQuestionSchema>;

// Union of all question types
export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  multipleSelectQuestionSchema,
  openResponseQuestionSchema,
  twoPartQuestionSchema,
]);

export type Question = z.infer<typeof questionSchema>;
