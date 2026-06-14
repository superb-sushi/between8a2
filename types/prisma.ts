import { Prisma } from "@/app/generated/prisma/client";

/**
 * =========================
 * SESSION TYPES
 * =========================
 */

export type Session = Prisma.SessionGetPayload<{}>;

/**
 * Session with all questions (no nested answers)
 */
export type SessionWithQuestions = Prisma.SessionGetPayload<{
  include: {
    questions: true;
  };
}>;

/**
 * Session with questions + answers (FULL UI GRAPH — most useful)
 */
export type SessionFull = Prisma.SessionGetPayload<{
  include: {
    questions: {
      include: {
        answers: {
          include: {
            admin: {
              select: {
                id: true;
                username: true;
              };
            };
          };
        };
      };
    };
  };
}>;

/**
 * Lightweight session for dashboards / lists
 */
export type SessionPreview = Prisma.SessionGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    createdAt: true;
  };
}>;

/**
 * Session with counts only (useful for sidebar / cards)
 */
export type SessionWithCounts = Prisma.SessionGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    _count: {
      select: {
        questions: true;
      };
    };
    createdAt: true;
  };
}>;

/**
 * =========================
 * QUESTION TYPES
 * =========================
 */

// Base Question model (no relations)
export type Question = Prisma.QuestionGetPayload<{}>;

// Question with answers included
export type QuestionWithAnswers = Prisma.QuestionGetPayload<{
  include: { answers: { include: { admin: { select: { id: true; username: true } } } } };
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

export type Answer = Prisma.AnswerGetPayload<{ include: { admin: { select: { id: true; username: true } } } }>;

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