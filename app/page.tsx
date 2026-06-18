"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GooeyPage from "./gooey-demo"
import QuestionCard from "@/components/ui/QuestionCard"
import { AdminLoginModal } from "@/components/ui/AdminLoginModal"
import { AdminCreateModal } from "@/components/ui/AdminCreateModal"
import { QuestionWithAnswers, SessionFull, SessionSummary } from "@/types/prisma"

import { Milestone } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Plus, X, Lock } from "lucide-react";
import { DraggableCard } from "@/components/ui/DraggableCard";

function DraggableSearch({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dragged = useRef(false);

  return (
    <DraggableCard
      id="search"
      style={{ top: 80, left: 5 }} // initial position
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onPointerDown={() => { dragged.current = false; }}
        onPointerMove={() => { dragged.current = true; }}
        onClick={() => { if (!dragged.current) setExpanded(true); }}
        className={`
          flex items-center gap-2
          rounded-full border border-white/20
          bg-white/10 backdrop-blur-md
          text-white shadow-lg shadow-black/20
          transition-all
          px-3 py-2
          ${expanded ? "w-60 cursor-text" : "w-10 cursor-grab"}
        `}
      >
        {/* SEARCH ICON ALWAYS VISIBLE */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-white/80"
        >
          <path
            d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* INPUT ONLY WHEN EXPANDED */}
        {expanded && (
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/60 outline-none"
            onBlur={() => {
              if (!searchQuery) setExpanded(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </motion.div>
    </DraggableCard>
  );
}

const getViewport = () => {
  if (typeof window === "undefined") {
    return { width: 375, height: 667 };
  }

  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
};

const getRandomPosition = (container?: HTMLDivElement | null) => {
  const margin = 16;

  const cardWidth = 280; // IMPORTANT: match mobile card width
  const cardHeight = 140;

  const { width, height } = getViewport();

  const maxLeft = Math.max(margin, width - cardWidth - margin);
  const maxTop = Math.max(margin, height - cardHeight - margin);

  return {
    top: margin + Math.random() * (maxTop - margin),
    left: margin + Math.random() * (maxLeft - margin),
  };
};

export default function Home() {
  const dragContainerRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<SessionFull | null>(null);
  const [selectedSessionSummary, setSelectedSessionSummary] = useState<SessionSummary | null>(null);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState("");
  const [newSessionPasscode, setNewSessionPasscode] = useState("");
  const [passcodeDigits, setPasscodeDigits] = useState(["", "", "", ""]);
  const passcodeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [passcodeError, setPasscodeError] = useState("");
  const [loadingSession, setLoadingSession] = useState(false);
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
  const [questionToastOpen, setQuestionToastOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    takeaways: string[];
    parkingLot: string[];
    tags: string[];
  } | null>(null);
  const [summaryError, setSummaryError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/get-sessions")
      .then((res) => res.json())
      .then((data: SessionSummary[]) => {
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

  // Auto-restore active session after reload if the user previously opened one
  useEffect(() => {
    try {
      const raw = localStorage.getItem("activeSession");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { id: string; passcode: string | null } | null;
      if (!parsed?.id) return;

      // attempt to load; if passcode was stored and invalid, clear stored session
      (async () => {
        const ok = await loadSession(parsed.id, parsed.passcode ?? undefined);
        if (!ok) {
          try {
            localStorage.removeItem("activeSession");
          } catch (err) {}
        }
      })();
    } catch (err) {}
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

  useEffect(() => {
    if (!questionToastOpen) return;
    const timer = setTimeout(() => setQuestionToastOpen(false), 8000);
    return () => clearTimeout(timer);
  }, [questionToastOpen]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setLoginModalOpen(false);
    const uname = localStorage.getItem("adminUsername");
    if (uname) setAdminUsername(uname);
  };

  const loadSession = async (sessionId: string, passcode?: string) => {
    setSessionError("");
    setQuestionError("");
    setPasscodeError("");
    setLoadingSession(true);

    try {
      const url = new URL(`/api/sessions/${sessionId}`, window.location.origin);
      if (passcode) {
        url.searchParams.set("passcode", passcode);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data?.requiresPasscode) {
          setPasscodeError(data?.error || "Passcode required.");
          setPasscodeModalOpen(true);
          return false;
        }

        setSessionError(data?.error || "Unable to load session.");
        return false;
      }

      const sessionObj = data.session ?? data;
      setActiveSession(sessionObj);

      try {
        // persist active session so reloading keeps the same session
        localStorage.setItem(
          "activeSession",
          JSON.stringify({ id: sessionId, passcode: passcode ?? null })
        );
      } catch (err) {}
      return true;
    } catch (error) {
      setSessionError("Unable to load session.");
      return false;
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSessionSelected = (session: SessionSummary) => {
    if (session.hasPasscode) {
      setSelectedSessionSummary(session);
      setUnlockPasscode("");
      setPasscodeDigits(["", "", "", ""]);
      setPasscodeError("");
      setPasscodeModalOpen(true);
      return;
    }

    loadSession(session.id);
  };

  const handlePasscodeDigitChange = (
    index: number,
    value: string,
    setCombined: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const next = [...passcodeDigits];
    next[index] = digit;

    setPasscodeDigits(next);
    setCombined(next.join(""));

    if (digit && index < 3) {
      passcodeRefs.current[index + 1]?.focus();
    }
  };

  const handlePasscodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Backspace" &&
      !passcodeDigits[index] &&
      index > 0
    ) {
      passcodeRefs.current[index - 1]?.focus();
    }
  };

  const handlePasscodePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    setCombined: React.Dispatch<React.SetStateAction<string>>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    const next = ["", "", "", ""];

    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });

    setPasscodeDigits(next);
    setCombined(next.join(""));

    passcodeRefs.current[
      Math.min(pasted.length, 3)
    ]?.focus();
  };

  const handlePasscodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSessionSummary) return;

    if (!/^[0-9]{4}$/.test(unlockPasscode)) {
      setPasscodeError("Passcode must be exactly 4 digits.");
      return;
    }

    const succeeded = await loadSession(selectedSessionSummary.id, unlockPasscode);
    if (succeeded) {
      setPasscodeModalOpen(false);
      setSelectedSessionSummary(null);
      setUnlockPasscode("");
      setPasscodeDigits(["", "", "", ""]);
    }
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

  const handleApproveQuestion = async (questionId: string) => {
    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`/api/questions/${questionId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setQuestionError(data?.error || "Unable to approve question.");
        return;
      }

      setActiveSession((current) => {
        if (!current) return current;

        return {
          ...current,
          questions: current.questions.map((question) =>
            question.id === questionId
              ? { ...question, status: "APPROVED" as const }
              : question
          ),
        } as SessionFull;
      });
    } catch (error) {
      setQuestionError("Unable to approve question.");
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`/api/questions/${questionId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setQuestionError(data?.error || "Unable to reject question.");
        return;
      }

      setActiveSession((current) => {
        if (!current) return current;

        return {
          ...current,
          questions: current.questions.filter((question) => question.id !== questionId),
        } as SessionFull;
      });

      // Free up the cached position so it can be reused
      delete questionPositions.current[questionId];
    } catch (error) {
      setQuestionError("Unable to reject question.");
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeSession) return;
    setSummaryLoading(true);
    setSummaryError("");
    setSummaryData(null);
    setSummaryModalOpen(true);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/sessions/${activeSession.id}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        setSummaryError(data?.error || "Unable to generate summary.");
        return;
      }

      setSummaryData(data);
    } catch (error) {
      setSummaryError("Unable to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
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
      setQuestionModalOpen(false);
      setQuestionToastOpen(true); 
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

    if (newSessionPasscode && !/^[0-9]{4}$/.test(newSessionPasscode)) {
      setSessionError("Passcode must be exactly 4 digits.");
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
          passcode: newSessionPasscode.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSessionError(data?.error || "Unable to create session.");
        return;
      }

      setSessions((current) => [data.session, ...current]);
      setActiveSession(data.session);
      try {
        localStorage.setItem("activeSession", JSON.stringify({ id: data.session.id, passcode: newSessionPasscode || null }));
      } catch (err) {}
      setSessionModalOpen(false);
      setSessionTitle("");
      setSessionDescription("");
      setNewSessionPasscode("");
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

  // Pending questions are only relevant to admins reviewing the queue
  const pendingCount = activeSession?.questions?.filter((q) => q.status === "PENDING").length ?? 0;

  // Non-admins only ever see approved questions; admins see everything
  const visibleQuestions = activeSession?.questions?.filter(
    (q) => isAdmin || q.status === "APPROVED"
  ) ?? [];

  const normalizedSearch = searchQuery.trim().toLowerCase();

  return (
    <div ref={dragContainerRef} className="relative min-h-screen">
      <GooeyPage />

      {/* Contrast scrim — keeps text legible regardless of which background photo loads */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-black/35 via-black/5 to-black/45" />

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AdminCreateModal
        isOpen={createAdminOpen}
        onClose={() => setCreateAdminOpen(false)}
      />

      {/* Brand mark */}
      <div className="absolute top-4 left-4 z-40 sm:top-6 sm:left-6 pointer-events-none flex gap-2">
        <span className="font-serif text-lg font-semibold text-white drop-shadow-lg sm:text-xl tracking-widest">
          Between Eight and Two
        </span>
      </div>

      {/* Admin badge and logout button */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white shadow-lg backdrop-blur-md sm:top-6 sm:right-6 sm:px-3 sm:py-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-3xs font-semibold tracking-[0.12em] text-emerald-200 sm:text-sm">
            {adminUsername ?? "Admin"}
          </span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-400/20 px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-amber-200">
              {pendingCount} pending
            </span>
          )}
          <button
            type="button"
            onClick={() => setCreateAdminOpen(true)}
            className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/90 transition hover:bg-white/20"
          >
            Add Leader
          </button>

          {activeSession?.questions?.some((q) => q.isAnswered) && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/90 transition hover:bg-white/20"
            >
              ✦ Summarise
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/90 transition hover:bg-white/20"
          >
            Log out
          </button>
        </div>
      )}

      {/* Session selector */}
      <div className="absolute top-14 left-4 z-50 flex-col items-center gap-5 sm:top-[4rem] sm:left-6">
        <div className="flex gap-2 items-center">        
          <Combobox
            items={sessions.map((s) => s.title ?? "Untitled Session")}
          >
            <ComboboxInput
              className="w-44 rounded-full border border-white/20 bg-white/10 py-2 px-1 text-sm font-medium text-white placeholder-white/60 backdrop-blur-md outline-none transition focus:border-white/40 sm:w-56"
              placeholder="Select a session"
              value={activeSession?.title ?? ""}
            />

            <ComboboxContent>
              <ComboboxEmpty>No sessions found</ComboboxEmpty>

              <ComboboxList>
                {sessions.map((session) => (
                  <ComboboxItem
                    key={session.id}
                    value={session.title ? session.title : "Untitled Session"}
                    className="cursor-pointer"
                    onClick={() => {
                      handleSessionSelected(session);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>{session.title ?? "Untitled Session"}</span>
                      {session.hasPasscode && (
                        <Lock className="h-3.5 w-3.5 text-white/70" />
                      )}
                    </span>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {isAdmin && (
          <button
            type="button"
            onClick={() => setSessionModalOpen(true)}
            aria-label="Create session"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-black/50"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        </div>

        {/* Active session info */}
        {activeSession?.description && (
          <div className="z-40 max-w-[60vw] sm:left-6">
            <div className="rounded-full py-1 px-4 text-white/80 flex gap-1.5">
              <Milestone size={15}/>
              <span className="text-muted-background italic text-xs">
                {activeSession.description}
              </span>
            </div>
          </div>
        )}

        {/* Collapsible, Draggable Search Bar! */}
        <DraggableSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

      {/* Ask anonymously — primary call to action */}
      <div className="fixed bottom-6 right-4 z-50 sm:bottom-8 sm:right-6">
        <button
          type="button"
          onClick={() => {
            setQuestionError("");
            setQuestionModalOpen(true);
          }}
          aria-label="Ask a question anonymously"
          className="group inline-flex h-14 items-center gap-2 rounded-full bg-[#C88A30] pl-4 pr-5 text-white shadow-lg shadow-black/20 transition hover:bg-[#A44f28] focus:outline-none active:scale-[0.98] sm:h-14 cursor-pointer"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-sm font-medium tracking-tight">Ask a Question</span>
        </button>
      </div>

      <AnimatePresence>
        {sessionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSessionModalOpen(false)}
            className="fixed inset-0 z-[998] flex items-center justify-center bg-black/50 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[2rem] border border-[#EDE3D6] bg-[#FBF7F0]/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#2C2420]">New session</h2>
                  <p className="mt-1 text-sm text-[#8B7355]">
                    Give this session a name so questions can be grouped under it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionModalOpen(false)}
                  aria-label="Close"
                  className="rounded-lg border border-[#EDE3D6] bg-white/60 p-1 text-[#8B7355] transition hover:bg-white hover:text-[#2C2420]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
                    Session name
                  </label>
                  <input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="e.g. Cell — 20 Jun"
                    className="w-full rounded-2xl border border-[#EDE3D6] bg-white/70 px-4 py-3 text-sm text-[#2C2420] outline-none transition placeholder:text-[#B8A892] focus:border-[#D85A30]/50"
                    disabled={creatingSession}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
                    Description (optional)
                  </label>
                  <textarea
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    placeholder="What's this session about?"
                    className="min-h-[120px] w-full rounded-2xl border border-[#EDE3D6] bg-white/70 px-4 py-3 text-sm text-[#2C2420] outline-none transition placeholder:text-[#B8A892] focus:border-[#D85A30]/50"
                    disabled={creatingSession}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
                    Passcode (optional)
                  </label>
                  <p className="text-xs text-[#8B7355] mb-2 italic">Leave blank for an open session.</p>
                  <div className="flex justify-center gap-3">
                    {passcodeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          passcodeRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={loadingSession}
                        onChange={(e) =>
                          handlePasscodeDigitChange(index, e.target.value, setNewSessionPasscode)
                        }
                        onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                        onPaste={(e) => handlePasscodePaste(e, setNewSessionPasscode)}
                        className="
                          h-16
                          w-16
                          rounded-3xl
                          border-2
                          border-[#E6D7C4]
                          bg-white/90
                          text-center
                          text-3xl
                          font-bold
                          text-[#2C2420]
                          shadow-sm
                          outline-none
                          transition-all
                          focus:-translate-y-0.5
                          focus:border-[#D85A30]
                          focus:ring-2
                          focus:ring-[#D85A30]/20
                        "
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={creatingSession || !sessionTitle.trim()}
                    className="rounded-full bg-[#D85A30] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#c44f28] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {creatingSession ? "Creating…" : "Create session"}
                  </button>
                </div>

                {sessionError && (
                  <p className="text-sm text-rose-600">{sessionError}</p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}

        {passcodeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPasscodeModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-3 sm:px-2 py-4 sm:py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="
                max-w-xl
                max-h-[90vh]
                overflow-y-auto
                rounded-[1.5rem] sm:rounded-[2rem]
                border border-[#EDE3D6]
                bg-[#FBF7F0]/95
                p-4 sm:p-6
                shadow-2xl backdrop-blur-xl
              "
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-medium text-[#2C2420]">
                    Enter session passcode
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#8B7355]">
                    This session is protected by a 4-digit passcode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPasscodeModalOpen(false)}
                  aria-label="Close"
                  className="self-end sm:self-auto rounded-lg border border-[#EDE3D6] bg-white/60 p-1 text-[#8B7355] transition hover:bg-white hover:text-[#2C2420]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handlePasscodeSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-3 block text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355] text-center">
                    Passcode
                  </label>

                  {/* INPUTS */}
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {passcodeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          passcodeRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={loadingSession}
                        onChange={(e) =>
                          handlePasscodeDigitChange(
                            index,
                            e.target.value,
                            setUnlockPasscode
                          )
                        }
                        onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                        onPaste={(e) => handlePasscodePaste(e, setUnlockPasscode)}
                        className="
                          h-12 w-12 sm:h-16 sm:w-16
                          rounded-2xl sm:rounded-3xl
                          border-2 border-[#E6D7C4]
                          bg-white/90
                          text-center
                          text-xl sm:text-3xl
                          font-bold
                          text-[#2C2420]
                          shadow-sm
                          outline-none
                          transition-all
                          focus:-translate-y-0.5
                          focus:border-[#D85A30]
                          focus:ring-2 focus:ring-[#D85A30]/20
                        "
                      />
                    ))}
                  </div>
                </div>

                {/* BUTTON */}
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loadingSession || !unlockPasscode.trim()}
                    className="
                      w-full sm:w-auto
                      rounded-full
                      bg-[#D85A30]
                      px-5 py-3
                      text-sm font-medium text-white
                      transition hover:bg-[#c44f28]
                      disabled:cursor-not-allowed disabled:opacity-40
                    "
                  >
                    {loadingSession ? "Checking…" : "Unlock session"}
                  </button>
                </div>

                {passcodeError && (
                  <p className="text-sm text-rose-600 text-center">
                    {passcodeError}
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}

        {summaryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSummaryModalOpen(false)}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[2rem] border border-[#EDE3D6] bg-[#FBF7F0]/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#2C2420]">Session Summary</h2>
                  <p className="mt-1 text-sm text-[#8B7355]">AI-generated breakdown of the discussed questions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSummaryModalOpen(false)}
                  className="rounded-lg border border-[#EDE3D6] bg-white/60 p-1 text-[#8B7355] transition hover:bg-white hover:text-[#2C2420]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dynamic Modal Content Container */}
              <div className="mt-6 space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                {summaryLoading && (
                  <p className="text-sm italic text-[#8B7355] animate-pulse">Distilling session points...</p>
                )}

                {summaryError && (
                  <p className="text-sm text-rose-600">{summaryError}</p>
                )}

                {!summaryLoading && summaryData && (
                  <div className="space-y-5 text-[#2C2420]">
                    {/* Tags Layout Array */}
                    {summaryData.tags && summaryData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {summaryData.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="rounded-full border border-[#EDE3D6] bg-[#EDE3D6]/40 px-2.5 py-0.5 text-xs font-medium text-[#8B7355]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Main Narrative Summary Block */}
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355] mb-1">Summary</h4>
                      <p className="text-sm leading-relaxed">{summaryData.summary}</p>
                    </div>

                    {/* Key Takeaways Structural Block */}
                    {summaryData.takeaways && summaryData.takeaways.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7355] mb-1">Key Takeaways</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
                          {summaryData.takeaways.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Parking Lot Follow-Ups Component */}
                    {summaryData.parkingLot && summaryData.parkingLot.length > 0 && (
                      <div className="border-t border-[#EDE3D6] pt-4 mt-2">
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C88A30] mb-1.5">
                          Parking Lot (Open Questions)
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-[#5C4D46] space-y-1.5 italic leading-relaxed">
                          {summaryData.parkingLot.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {questionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuestionModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[2rem] border border-[#EDE3D6] bg-[#FBF7F0]/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-serif text-xl font-medium text-[#2C2420]">What's your question?</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  aria-label="Close"
                  className="rounded-lg border border-[#EDE3D6] bg-white/60 p-1 text-[#8B7355] transition hover:bg-white hover:text-[#2C2420]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-2xl py-1.5 px-1 text-sm font-medium text-muted-foreground">
                Questions are fully anonymous, so feel free to ask away!
              </div>

              {!activeSession ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Select a session first before asking a question.
                </div>
              ) : (
                <form onSubmit={handleCreateQuestion} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B7355]">
                      Question
                    </label>
                    <input
                      type="text"
                      value={questionTitle}
                      onChange={(e) => setQuestionTitle(e.target.value)}
                      placeholder="Short question title"
                      className="w-full rounded-2xl border border-[#EDE3D6] bg-white/70 px-4 py-3 text-sm text-[#2C2420] outline-none transition placeholder:text-[#B8A892] focus:border-[#D85A30]/50"
                      disabled={creatingQuestion}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B7355]">
                      Details
                    </label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Describe what you want to ask..."
                      className="min-h-[140px] w-full rounded-2xl border border-[#EDE3D6] bg-white/70 px-4 py-4 text-sm text-[#2C2420] outline-none transition placeholder:text-[#B8A892] focus:border-[#D85A30]/50"
                      disabled={creatingQuestion}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={creatingQuestion || !questionTitle.trim() || !questionText.trim()}
                      className="rounded-full bg-[#D85A30] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#c44f28] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {creatingQuestion ? "Submitting…" : "Submit question"}
                    </button>
                  </div>

                  {questionError && (
                    <p className="text-sm text-rose-600">{questionError}</p>
                  )}
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
        {questionToastOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center px-4"
          >
            <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-[#EDE3D6] bg-[#FBF7F0]/95 px-6 py-5 text-center text-sm font-medium text-[#2C2420] shadow-2xl backdrop-blur-xl sm:max-w-md sm:text-base">
              Your question is under review - It'll appear once approved. Thanks!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUESTIONS FROM ACTIVE SESSION */}
      <div>
        {visibleQuestions.map((q) => {
          const pos = questionPositions.current[q.id] ?? getRandomPosition(dragContainerRef.current);

          if (!questionPositions.current[q.id]) {
            questionPositions.current[q.id] = {
              top: Math.min(Math.max(pos.top, 16), window.innerHeight - 160),
              left: Math.min(Math.max(pos.left, 16), window.innerWidth - 300),
            };
          }

          // Matches search query against all question titles, descriptions, and answers!
          const matchesSearch =
            !normalizedSearch ||
            q.title.toLowerCase().includes(normalizedSearch) ||
            q.question.toLowerCase().includes(normalizedSearch) ||
            q.answers.some((a) =>
              a.content.toLowerCase().includes(normalizedSearch)
            );

          return (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              description={q.question}
              status={q.status}
              isAnswered={q.isAnswered}
              answers={q.answers}
              top={pos.top}
              left={pos.left}
              dragConstraintsRef={dragContainerRef!}
              isAdmin={isAdmin}
              onAnswerAdded={handleAnswerAdded}
              onApprove={handleApproveQuestion}
              onReject={handleRejectQuestion}
              isDimmed={!matchesSearch}
            />
          );
        })}
      </div>
    </div>
    </div>
  )
}