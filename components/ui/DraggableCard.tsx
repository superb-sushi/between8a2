"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  onDragEnd?: (id: string, x: number, y: number) => void;
  className?: string;
  style?: CSSProperties;
  dragConstraintsRef?: React.RefObject<HTMLElement>;
}

export function DraggableCard({
  id,
  children,
  onDragEnd,
  className,
  style,
  dragConstraintsRef,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [constraints, setConstraints] = useState({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (dragConstraintsRef) return;

    const updateConstraints = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setConstraints({
        left: -rect.left,
        top: -rect.top,
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.bottom,
      });
    };

    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, [dragConstraintsRef]);

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraintsRef ?? constraints}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragEnd?.(id, info.point.x, info.point.y);
      }}
      whileDrag={{
        scale: 1.08,
        zIndex: 50,
        cursor: "grabbing",
      }}
      className={`absolute cursor-grab active:cursor-grabbing ${className ?? ""}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}