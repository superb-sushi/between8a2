"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DraggableCard } from "@/components/ui/DraggableCard";
import { Answer } from "@/types/prisma";

interface QuestionCardProps {
  id: string;
  title: string;
  description?: string;
  answers: Answer[];
  top?: number;
  left?: number;
  isAnswered: boolean;
  dragConstraintsRef?: React.RefObject<HTMLDivElement | null>;
  isAdmin: boolean;
  onAnswerAdded: (questionId: string, answer: Answer) => void;
}

const QuestionCard = ({
  id,
  title,
  description,
  answers = [],
  top = 0,
  left = 0,
  isAnswered = false,
  dragConstraintsRef,
  isAdmin,
  onAnswerAdded,
}: QuestionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isDraggingRef = useRef(false);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCardClick = () => {
    if (isDraggingRef.current) {
      return;
    }

    setExpanded((v) => !v);
  };

  const handleDraggingChanged = (dragging: boolean) => {
    isDraggingRef.current = dragging;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ content: answerText.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSubmitError(data.error || "Unable to submit answer");
        return;
      }

      setAnswerText("");
      onAnswerAdded(id, data.answer);
    } catch (err) {
      setSubmitError("Unable to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DraggableCard
      id={id}
      style={{ top, left }}
      dragConstraintsRef={dragConstraintsRef}
      onDraggingChanged={handleDraggingChanged}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        onClick={handleCardClick}
        whileHover={{ scale: 1.01 }}
        className={`relative max-h-[700px] w-80 cursor-pointer overflow-hidden rounded-[2rem] border p-5 text-left backdrop-blur-md transition-colors duration-300 ${
          isAnswered
            ? "border-white/10 bg-white/90 text-zinc-900 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]"
            : "border-white/10 bg-black/90 text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]"
        }`}
      >
        {/* ambient background */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            isAnswered
              ? "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.08),transparent_35%)]"
              : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_35%)]"
          } opacity-80`}
        />

        {/* soft glow accent */}
        <div
          className={`pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full blur-3xl ${
            isAnswered ? "bg-black/10" : "bg-violet-500/10"
          }`}
        />

        {/* content */}
        <div className="relative z-10 space-y-4">
          {/* TITLE + DESCRIPTION */}
          <div className="space-y-2">
            <h2
              className={`text-[17px] font-medium tracking-tight leading-snug ${
                isAnswered ? "text-zinc-900" : "text-white"
              }`}
            >
              {title}
            </h2>

            {description && (
              <p
                className={`text-[13px] leading-relaxed ${
                  isAnswered ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                {description}
              </p>
            )}
          </div>

          {/* subtle divider */}
          {expanded && (
            <div
              className={`h-px w-full ${
                isAnswered ? "bg-black/5" : "bg-white/10"
              }`}
            />
          )}

          {/* ANSWERS */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="answers"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Scrollable answers only */}
                <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
                  {answers.length === 0 ? (
                    <p
                      className={`text-[12px] italic ${
                        isAnswered ? "text-zinc-600" : "text-zinc-300"
                      }`}
                    >
                      No responses yet.
                    </p>
                  ) : (
                    answers.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{
                          duration: 0.25,
                          delay: i * 0.04,
                        }}
                        className={`relative pl-3 text-[13px] leading-relaxed ${
                          isAnswered ? "text-zinc-600" : "text-zinc-300"
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-1 h-[70%] w-[1px] ${
                            isAnswered ? "bg-black/10" : "bg-white/20"
                          }`}
                        />

                        <div className="text-[13px] leading-relaxed">
                          {a.content}
                        </div>

                        <div className="mt-1 text-[11px] text-zinc-400">
                          — {a.admin?.username ?? "Admin"}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Fixed form section */}
                {isAdmin && (
                  <div
                    className={`border-t pt-3 ${
                      isAnswered ? "border-black/10" : "border-white/10"
                    }`}
                  >
                    <form
                      onSubmit={handleSubmit}
                      onClick={(e) => e.stopPropagation()}
                      className="space-y-3"
                    >
                      <div className={`rounded-3xl border ${ isAnswered ? "border-black/20" : "border-white/20 "} p-3`}>
                        <input
                          type="text"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Add your answer..."
                          className="w-full bg-transparent text-[13px] text-white placeholder:text-zinc-500 outline-none"
                          disabled={submitting}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="submit"
                          disabled={submitting || !answerText.trim()}
                          className={`rounded-full ${isAnswered ? "bg-black/20" : "bg-white/20"} cursor-pointer px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50`}
                        >
                          {submitting ? "Saving..." : "Submit"}
                        </button>

                        <span className="text-[11px] text-zinc-500">
                          Press Enter to submit
                        </span>
                      </div>

                      {submitError && (
                        <p className="text-xs text-rose-400">
                          {submitError}
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </DraggableCard>
  );
};

export default QuestionCard;