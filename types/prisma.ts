import { Prisma } from "@prisma/client";

/**
 * =========================
 * QUESTION TYPES
 * =========================
 */

// Base Question model (no relations)
export type Question = Prisma.QuestionGetPayload<{}>;

// Question with answers included
export type QuestionWithAnswers = Prisma.QuestionGetPayload<{
  include: { answers: true };
}>;

// Question without answers (explicit safe version)
export type QuestionCore = Pick<
  Question,
  "id" | "title" | "question" | "isAnswered" | "createdAt" | "updatedAt"
>;

// Lightweight preview (for cards / lists)
export type QuestionPreview = Prisma.QuestionGetPayload<{
  select: {
    id: true;
    title: true;
    question: true;
    isAnswered: true;
  };
}>;

/**
 * =========================
 * ANSWER TYPES
 * =========================
 */

export type Answer = Prisma.AnswerGetPayload<{}>;

// If ever extended later (safe pattern)
export type AnswerCore = Pick<
  Answer,
  "id" | "content" | "questionId" | "createdAt" | "updatedAt"
>;

/**
 * =========================
 * ADMIN TYPES
 * =========================
 */

export type Admin = Prisma.AdminGetPayload<{}>;

export type AdminSafe = Omit<Admin, "password">;

/**
 * =========================
 * API RESPONSE TYPES
 * =========================
 */

// Your main API response for /get-questions
export type GetQuestionsResponse = QuestionWithAnswers[];

// Single question API response
export type GetQuestionResponse = QuestionWithAnswers | null;

/**
 * =========================
 * FRONTEND UI TYPES
 * =========================
 */

export type QuestionCardProps = {
  id: string;
  title: string;
  description: string;
  isAnswered: boolean;
  answers?: Answer[];
  top: number;
  left: number;
};

/**
 * =========================
 * FORM TYPES (future-proof)
 * =========================
 */

export type CreateQuestionInput = {
  title: string;
  question: string;
};

export type CreateAnswerInput = {
  content: string;
  questionId: string;
};