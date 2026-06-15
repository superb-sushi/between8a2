"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DraggableCard } from "@/components/ui/DraggableCard";
import { ShieldCheck, X, Check, Trash2 } from "lucide-react";
import type { Answer, Admin, QuestionStatus } from "@prisma/client";
import bento from "@/public/bento.png";
import best from "@/public/best.png";
import chips from "@/public/chips.png";
import egg from "@/public/egg.png"
import fish from "@/public/fish.png"
import nice from "@/public/nice.png"
import smile from "@/public/smile.png"
import soyasauce from "@/public/soyasauce.png"
import sparkle from "@/public/sparkle.png"
import spice from "@/public/spice.png"
import stamp from "@/public/stamp.png"
import tofu from "@/public/tofu.png"
import Image from "next/image";

type AnswerWithAdmin = Answer & {
  admin: Pick<Admin, "id" | "username"> | null;
};

interface QuestionCardProps {
  id: string;
  title: string;
  description?: string;
  answers: AnswerWithAdmin[];
  status: QuestionStatus;
  top?: number;
  left?: number;
  isAnswered: boolean;
  dragConstraintsRef?: React.RefObject<HTMLDivElement | null>;
  isAdmin: boolean;
  onAnswerAdded: (questionId: string, answer: AnswerWithAdmin) => void;
  onApprove?: (questionId: string) => void;
  onReject?: (questionId: string) => void;
}

/* ---------------------------------------------------------------------- */
/* Deterministic "randomness" — same id always produces the same sticker  */
/* ---------------------------------------------------------------------- */

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const STICKERS = [bento, best, chips, egg, fish, nice, smile, soyasauce, sparkle, spice, stamp, tofu];

const QuestionCard = ({
  id,
  title,
  description,
  answers = [],
  status,
  top = 0,
  left = 0,
  isAnswered = false,
  dragConstraintsRef,
  isAdmin,
  onAnswerAdded,
  onApprove,
  onReject,
}: QuestionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isDraggingRef = useRef(false);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const isPending = status === "PENDING";

  // Derive a stable "sticker look" from the question id
  const hash = hashId(id);
  const sticker = STICKERS[Math.floor(hash / STICKERS.length) % STICKERS.length];
  const rotation = (hash % 13) - 6; // -6deg to +6deg
  const stickerRotation = ((hash % 7) - 3) * 2;
  const stickerSize = 250 + (hash % 30);

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

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onApprove) return;
    setApproving(true);
    try {
      await onApprove(id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onReject) return;

    const confirmed = window.confirm(
      "Reject and delete this question? This can't be undone."
    );
    if (!confirmed) return;

    setRejecting(true);
    try {
      await onReject(id);
    } finally {
      setRejecting(false);
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
        onClick={handleCardClick}
        animate={{ rotate: expanded ? 0 : rotation }}
        whileHover={!expanded ? { rotate: 0, scale: 1.06 } : undefined}
        whileTap={!expanded ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        role="button"
        tabIndex={0}
        aria-label={expanded ? "Collapse question" : "Reveal question"}
        onKeyDown={(e) => {
          const target = e.target as HTMLElement;

          // 🚨 ignore typing inside input/textarea/contenteditable
          if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            (target as HTMLElement).isContentEditable
          ) {
            return;
          }
          if (e.key === "Enter" || e.key === " ") handleCardClick();
        }}
        style={{
          transformOrigin: "center",
        }}
        className={
          expanded
            ? "relative max-h-[700px] w-[min(92vw,20rem)] sm:w-80 cursor-pointer overflow-hidden rounded-[2rem] border border-[#EDE3D6] bg-[#FBF7F0]/95 p-5 text-left text-[#2C2420] backdrop-blur-md shadow-[0_20px_60px_-40px_rgba(43,36,32,0.35)]"
            : "relative flex h-44 w-44 sm:h-52 sm:w-52 cursor-pointer items-center justify-center overflow-visible"
        }
      >
        
        {/* ---- STICKER (closed) ---- */}
        {!expanded && (
          <>
            {/* pending badge */}
            {isPending && (
              <span className="absolute -top-1 -right-1 z-10 rounded-full bg-[#8B7355] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                Pending
              </span>
            )}

            {/* sticker */}
            <Image
              src={sticker}
              alt=""
              width={stickerSize}
              height={stickerSize}
              draggable={false}
              style={{
                transform: `rotate(${stickerRotation}deg)`,
                filter: `
                  drop-shadow(0 0 0 ${isAnswered ? "white" : "rgba(254, 243, 199, 1)"})
                  drop-shadow(4px 0 0 ${isAnswered ? "white" : "rgba(254, 243, 199, 1)"})
                  drop-shadow(-4px 0 0 ${isAnswered ? "white" : "rgba(254, 243, 199, 1)"})
                  drop-shadow(0 4px 0 ${isAnswered ? "white" : "rgba(254, 243, 199, 1)"})
                  drop-shadow(0 -4px 0 ${isAnswered ? "white" : "rgba(254, 243, 199, 1)"})
                `,
              }}
              className={`
                pointer-events-none
                select-none
                object-contain
                ${isPending ? "grayscale opacity-60" : ""}
              `}
            />
          </>
        )}

        {/* ---- FULL CARD (open) ---- */}
        {expanded && (
          <div className="relative z-10 space-y-4">
            {/* META ROW */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B8A892]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Anonymous
              </span>

              <div className="flex items-center gap-2">
                {isPending ? (
                  <span className="rounded-full bg-stone-500 px-2.5 py-1 text-[11px] font-medium text-white">
                    Pending review
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      isAnswered
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isAnswered ? "Answered" : "No response"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                  }}
                  aria-label="Collapse question"
                  className="rounded-full p-1 text-[#B8A892] transition hover:bg-black/5 hover:text-[#2C2420]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* TITLE + DESCRIPTION */}
            <div className="space-y-2">
              <h2 className="font-serif text-[17px] font-medium leading-snug text-[#2C2420]">
                {title}
              </h2>

              {description && (
                <p className="text-[13px] leading-relaxed text-[#8B7355]">
                  {description}
                </p>
              )}
            </div>

            <div className="h-px w-full bg-[#EDE3D6]" />

            {/* ANSWERS */}
            <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="max-h-[350px] space-y-3 overflow-y-auto pr-2">
                {answers.length === 0 ? (
                  <p className="text-[12px] italic text-[#B8A892]">No responses yet.</p>
                ) : (
                  answers.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="relative pl-3 text-[13px] leading-relaxed text-[#5C4D42]"
                    >
                      <span className="absolute left-0 top-1 h-[70%] w-[1px] bg-[#EDE3D6]" />
                      <div className="text-[13px] leading-relaxed">{a.content}</div>
                      <div className="mt-1 text-[11px] text-[#B8A892]">
                        — {a.admin?.username ?? "Leader"}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {isAdmin && (
                <div className="border-t border-[#EDE3D6] pt-3">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="rounded-3xl border border-[#EDE3D6] bg-white/70 p-3">
                      <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Add your answer..."
                        className="w-full bg-transparent text-[13px] text-[#2C2420] placeholder:text-[#B8A892] outline-none"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="submit"
                        disabled={submitting || !answerText.trim()}
                        className="cursor-pointer rounded-full bg-[#D85A30] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c44f28] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting ? "Saving…" : "Submit"}
                      </button>
                      <span className="text-[11px] text-[#B8A892]">Press Enter to submit</span>
                    </div>

                    {submitError && <p className="text-xs text-rose-600">{submitError}</p>}
                  </form>
                </div>
              )}

              {/* MODERATION ACTIONS — admins only, pending questions only */}
              {isAdmin && isPending && (onApprove || onReject) && (
                <div className="flex items-center gap-2 border-t border-[#EDE3D6] pt-3">
                  {onApprove && (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving || rejecting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {approving ? "Approving…" : "Approve"}
                    </button>
                  )}

                  {onReject && (
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={approving || rejecting}
                      className="flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {rejecting ? "Rejecting…" : "Reject"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </DraggableCard>
  );
};

export default QuestionCard;