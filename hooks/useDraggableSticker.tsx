import { useState } from "react";
import type { PanInfo } from "framer-motion";

export function useDraggableSticker() {
  const [isDragging, setIsDragging] = useState(false);

  return {
    drag: true,
    dragMomentum: false,
    dragElastic: 0.18,

    onDragStart: () => setIsDragging(true),
    onDragEnd: (_: MouseEvent, info: PanInfo) => {
      setIsDragging(false);
    },

    whileDrag: {
      scale: 1.08,
      rotate: 0,
      zIndex: 50,
      cursor: "grabbing",
    },

    data: {
      isDragging,
    },
  };
}