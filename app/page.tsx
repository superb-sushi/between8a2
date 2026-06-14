"use client";

import { useEffect, useRef, useState } from "react";
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

const getRandomPosition = () => ({
  top: 40 + Math.floor(Math.random() * 520),
  left: 24 + Math.floor(Math.random() * 920),
})

export default function Home() {
  const dragContainerRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<SessionFull[]>([]);
  const [activeSession, setActiveSession] = useState<SessionFull>();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);

  useEffect(() => {
    fetch("/api/get-sessions")
      .then((res) => res.json())
      .then((data: SessionFull[]) => {
        setSessions(data);
      });

    // Check if already logged in
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAdmin(true);
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
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
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
          <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">Admin</span>
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

      <div className="absolute top-6 left-6 z-50 w-64">
        <Combobox
          items={sessions.map((s) => s.title ?? "Untitled Session")}
        >
          <ComboboxInput placeholder="Select session" className="font-bold text-white" />

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
      </div>

      {/* QUESTIONS FROM ACTIVE SESSION */}
      <div>
        {activeSession?.questions?.map((q) => {
          const { top, left } = getRandomPosition();

          return (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              description={q.question}
              isAnswered={q.isAnswered}
              answers={q.answers}
              top={top}
              left={left}
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
