"use client";

interface DropZoneProps {
  id: string;
  children?: React.ReactNode;
  onDrop?: (cardId: string, zoneId: string) => void;
}

export function DropZone({ id, children }: DropZoneProps) {
  return (
    <div
      data-dropzone-id={id}
      className="relative w-full h-full border border-dashed border-zinc-400/30 rounded-xl"
    >
      {children}
    </div>
  );
}