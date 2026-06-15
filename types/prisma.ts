import type { Session, Question, Answer, Admin, Prisma } from "@prisma/client";

/**
 * =========================
 * SESSION TYPES
 * =========================
 */

/**
 * Base session model
 */
export type SessionModel = Session;

/**
 * Session with all questions (no nested answers)
 */
export type SessionWithQuestions = Session & {
  questions: Question[];
};

/**
 * Answer with admin attached
 */
export type AnswerWithAdmin = Answer & {
  admin: Pick<Admin, "id" | "username">;
};

/**
 * Question with answers + admin
 */
export type QuestionWithAnswers = Question & {
  answers: AnswerWithAdmin[];
};

/**
 * Session with questions + answers (FULL UI GRAPH)
 */
export type SessionFull = Session & {
  questions: QuestionWithAnswers[];
  hasPasscode?: boolean;
};

/**
 * Lightweight session for dashboards / lists
 */
export type SessionPreview = Pick<
  Session,
  "id" | "title" | "description" | "createdAt"
>;

export type SessionSummary = SessionPreview & {
  hasPasscode: boolean;
};

/**
 * Session with counts only (useful for sidebar / cards)
 */
export type SessionWithCounts = Session & {
  _count: {
    questions: number;
  };
};

/**
 * =========================
 * QUESTION TYPES
 * =========================
 */

/**
 * Base Question model (no relations)
 */
export type QuestionModel = Question;

/**
 * Question without answers (explicit safe version)
 */
export type QuestionCore = Pick<
  Question,
  "id" | "title" | "question" | "isAnswered" | "createdAt" | "updatedAt"
>;

/**
 * Lightweight preview (for cards / lists)
 */
export type QuestionPreview = Pick<
  Question,
  "id" | "title" | "question" | "isAnswered"
>;

/**
 * =========================
 * ANSWER TYPES
 * =========================
 */

/**
 * Base Answer model
 */
export type AnswerModel = Answer;

/**
 * =========================
 * ADMIN TYPES
 * =========================
 */

/**
 * Base admin model
 */
export type AdminModel = Admin;

/**
 * Safe admin (no password)
 */
export type AdminSafe = Omit<Admin, "password">;

/**
 * =========================
 * API RESPONSE TYPES
 * =========================
 */

export type GetQuestionsResponse = QuestionWithAnswers[];

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
  answers?: AnswerWithAdmin[];
  top: number;
  left: number;
};

/**
 * =========================
 * FORM TYPES
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