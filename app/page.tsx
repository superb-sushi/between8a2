"use client";

import { useEffect, useRef, useState } from "react";
import GooeyPage from "./gooey-demo"
import QuestionCard from "@/components/ui/QuestionCard"
import { QuestionWithAnswers } from "@/types/prisma"

const getRandomPosition = () => ({
  top: 40 + Math.floor(Math.random() * 520),
  left: 24 + Math.floor(Math.random() * 920),
})

export default function Home() {
  const dragContainerRef = useRef<HTMLDivElement | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);

  useEffect(() => {
    fetch("/api/get-questions")
      .then((res) => res.json())
      .then(setQuestions);
  }, []);
  
  return (
    <div ref={dragContainerRef} className="relative min-h-screen">
      <GooeyPage />

      <div>
        {questions.map((q) => {
          const { top, left } = getRandomPosition()
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
            />
          )
        })}
      </div>
    </div>
  )
}
