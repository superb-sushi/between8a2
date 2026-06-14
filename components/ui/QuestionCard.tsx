"use client";

import { useState } from "react";
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
  dragConstraintsRef?: React.RefObject<HTMLElement>;
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
}: QuestionCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <DraggableCard id={id} style={{ top, left }} dragConstraintsRef={dragConstraintsRef}>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        onClick={() => setExpanded((v) => !v)}
        whileHover={{ scale: 1.01 }}
        className={`relative w-80 cursor-pointer overflow-hidden rounded-[2rem] border p-5 text-left backdrop-blur-md transition-colors duration-300 ${
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
                className="space-y-3"
              >
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
                      {/* thin editorial line */}
                      <span
                        className={`absolute left-0 top-1 h-[70%] w-[1px] ${
                          isAnswered ? "bg-black/10" : "bg-white/20"
                        }`}
                      />

                      {a.content}
                    </motion.div>
                  ))
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