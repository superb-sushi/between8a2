"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GooeyPage from "./gooey-demo"
import QuestionCard from "@/components/ui/QuestionCard"
import { AdminLoginModal } from "@/components/ui/AdminLoginModal"
import { AdminCreateModal } from "@/components/ui/AdminCreateModal"
import { QuestionWithAnswers, SessionFull } from "@/types/prisma"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Plus, X } from "lucide-react";

const getRandomPosition = (container?: HTMLDivElement | null) => {
  const marginLeft = 24;
  const minTop = 40;
  const cardMinWidth = 320; // match desktop card width (20rem)
  const cardMinHeight = 120; // approximate minimum height of a question card

  if (container) {
    const rect = container.getBoundingClientRect();
    const maxTop = Math.max(rect.height - cardMinHeight - 8, minTop);
    const maxLeft = Math.max(rect.width - cardMinWidth - 8, marginLeft);

    const top = minTop + Math.floor(Math.random() * Math.max(1, maxTop - minTop + 1));
    const left = marginLeft + Math.floor(Math.random() * Math.max(1, maxLeft - marginLeft + 1));

    return { top, left };
  }

  // Fallback to viewport-based positioning
  const vw = typeof window !== "undefined" ? window.innerWidth : 960;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;

  return {
    top: minTop + Math.floor(Math.random() * Math.max(1, Math.floor(vh - cardMinHeight - minTop))),
    left: marginLeft + Math.floor(Math.random() * Math.max(1, Math.floor(vw - cardMinWidth - marginLeft))),
  };
}

export default function Home() {
  const dragContainerRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<SessionFull[]>([]);
  const [activeSession, setActiveSession] = useState<SessionFull>();
  const questionPositions = useRef<Record<string, { top: number; left: number }>>({});
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  useEffect(() => {
    fetch("/api/get-sessions")
      .then((res) => res.json())
      .then((data: SessionFull[]) => {
        setSessions(data);
      });

    // Check if already logged in
    const token = localStorage.getItem("adminToken");
    const storedAdmin = localStorage.getItem("adminUsername");
    if (token) {
      setIsAdmin(true);
      if (storedAdmin) setAdminUsername(storedAdmin);
    }
  }, []);

  // Keyboard shortcut: Press "/" to open login modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !loginModalOpen) {
        setLoginModalOpen(true);
      }
      if (e.key === "Escape" && loginModalOpen) {
        setLoginModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loginModalOpen]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setLoginModalOpen(false);
    const uname = localStorage.getItem("adminUsername");
    if (uname) setAdminUsername(uname);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    setIsAdmin(false);
    setAdminUsername(null);
  };

  const handleAnswerAdded = (questionId: string, answer: { id: string; content: string; questionId: string; createdAt: Date; updatedAt: Date }) => {
    setActiveSession((current) => {
      if (!current) return current;

      return {
        ...current,
        questions: current.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                isAnswered: true,
                answers: [...question.answers, answer],
              }
            : question
        ),
      } as SessionFull;
    });
  };

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSession) return;
    if (!questionTitle.trim() || !questionText.trim()) {
      setQuestionError("Please add both a title and question.");
      return;
    }

    setCreatingQuestion(true);
    setQuestionError("");

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          title: questionTitle.trim(),
          question: questionText.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setQuestionError(data?.error || "Unable to submit question.");
        return;
      }

      setActiveSession((current) => {
        if (!current) return current;

        return {
          ...current,
          questions: [...current.questions, data.question],
        } as SessionFull;
      });

      setQuestionTitle("");
      setQuestionText("");
    } catch (error) {
      setQuestionError("Unable to submit question.");
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionTitle.trim()) {
      setSessionError("Session title is required.");
      return;
    }

    setCreatingSession(true);
    setSessionError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle.trim(),
          description: sessionDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSessionError(data?.error || "Unable to create session.");
        return;
      }

      setSessions((current) => [data.session, ...current]);
      setActiveSession(data.session);
      setSessionModalOpen(false);
      setSessionTitle("");
      setSessionDescription("");
    } catch (error) {
      setSessionError("Unable to create session.");
    } finally {
      setCreatingSession(false);
    }
  };

  // Keep existing question positions inside the container on resize
  useEffect(() => {
    const clampPositions = () => {
      const container = dragContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cardMinWidth = 320;
      const cardMinHeight = 120;
      const minTop = 40;
      const marginLeft = 24;

      Object.keys(questionPositions.current).forEach((id) => {
        const pos = questionPositions.current[id];
        if (!pos) return;

        const maxTop = Math.max(rect.height - cardMinHeight - 8, minTop);
        const maxLeft = Math.max(rect.width - cardMinWidth - 8, marginLeft);

        const clampedTop = Math.min(Math.max(pos.top, minTop), maxTop);
        const clampedLeft = Math.min(Math.max(pos.left, marginLeft), maxLeft);

        if (clampedTop !== pos.top || clampedLeft !== pos.left) {
          questionPositions.current[id] = { top: clampedTop, left: clampedLeft };
        }
      });
    };

    window.addEventListener("resize", clampPositions);
    // also run once on mount
    clampPositions();

    return () => window.removeEventListener("resize", clampPositions);
  }, []);

  return (
    <div ref={dragContainerRef} className="relative min-h-screen">
      <GooeyPage />

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AdminCreateModal
        isOpen={createAdminOpen}
        onClose={() => setCreateAdminOpen(false)}
      />

      {/* Admin badge and logout button */}
      {isAdmin && (
        <div className="absolute top-6 right-6 z-40 flex items-center gap-2 rounded-full border border-green-500/20 bg-black/75 px-3 py-2 text-white shadow-lg">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm tracking-[0.15em] font-bold text-emerald-300">{adminUsername ?? "Admin"}</span>
          <button
            type="button"
            onClick={() => setCreateAdminOpen(true)}
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white transition hover:bg-white/20"
          >
            New Admin
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white transition hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      )}

      <div className="absolute top-6 left-6 z-50 flex gap-2">
        <Combobox
          items={sessions.map((s) => s.title ?? "Untitled Session")}
        >
          <ComboboxInput className="font-semibold text-white" placeholder="Select Session" />

          <ComboboxContent>
            <ComboboxEmpty>No sessions found</ComboboxEmpty>

            <ComboboxList>
              {sessions.map((session) => (
                <ComboboxItem
                  key={session.id}
                  value={session.title ?? "Untitled Session"}
                  onClick={() => {
                    setActiveSession(session);
                    console.log("selected:", session);
                  }}
                >
                  {session.title ?? "Untitled Session"}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {isAdmin && (<button
          type="button"
          onClick={() => setSessionModalOpen(true)}
          aria-label="Create session"
          className="cursor-pointer text-white"
        >
          <Plus className="h-4 w-4" />
        </button>)}
      </div>

      <div className="fixed right-6 bottom-1 z-50 flex -translate-y-1/2 items-center hover:scale">
        <button
          type="button"
          onClick={() => {
            setQuestionError("");
            setQuestionModalOpen(true);
          }}
          aria-label="Ask a question"
          className="group inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-lg transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {sessionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSessionModalOpen(false)}
            className="fixed inset-0 z-[998] flex items-center justify-center bg-black/60 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Create session</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Add a new session and start adding questions immediately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 p-1 text-sm text-white transition hover:bg-white/10"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-200 font-bold">
                    Session title
                  </label>
                  <input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Session title"
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    disabled={creatingSession}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-200 font-bold">
                    Description
                  </label>
                  <textarea
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    placeholder="Optional session description"
                    className="min-h-[120px] w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    disabled={creatingSession}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={creatingSession || !sessionTitle.trim()}
                    className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingSession ? "Creating..." : "Create session"}
                  </button>
                </div>

                {sessionError && (
                  <p className="text-sm text-rose-400">{sessionError}</p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}

        {questionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuestionModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">What's your question?</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 p-1 text-sm text-white transition hover:bg-white/10"
                >
                  <X />
                </button>
              </div>

              {!activeSession ? (
                <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200">
                  Select a session first before asking a question.
                </div>
              ) : (
                <form onSubmit={handleCreateQuestion} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-200 font-bold">
                      Question
                    </label>
                    <input
                      type="text"
                      value={questionTitle}
                      onChange={(e) => setQuestionTitle(e.target.value)}
                      placeholder="Short question title"
                      className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                      disabled={creatingQuestion}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-200 font-bold">
                      Details
                    </label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Describe what you want to ask..."
                      className="min-h-[140px] w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-white/30"
                      disabled={creatingQuestion}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={creatingQuestion || !questionTitle.trim() || !questionText.trim()}
                      className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingQuestion ? "Submitting..." : "Submit question"}
                    </button>
                  </div>

                  {questionError && (
                    <p className="text-sm text-rose-400">{questionError}</p>
                  )}
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUESTIONS FROM ACTIVE SESSION */}
      <div>
        {activeSession?.questions?.map((q) => {
          const position = questionPositions.current[q.id] ?? getRandomPosition(dragContainerRef.current);

          if (!questionPositions.current[q.id]) {
            questionPositions.current[q.id] = position;
          }

          return (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              description={q.question}
              isAnswered={q.isAnswered}
              answers={q.answers}
              top={position.top}
              left={position.left}
              dragConstraintsRef={dragContainerRef!}
              isAdmin={isAdmin}
              onAnswerAdded={handleAnswerAdded}
            />
          );
        })}
      </div>
    </div>
  )
}
