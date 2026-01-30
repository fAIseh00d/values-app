"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ValueCard } from "./ValueCard";
import { values } from "@/lib/values";
import { cn } from "@/lib/utils";

interface SortColumnProps {
  id: string;
  title: string;
  cardIds: string[];
  colorClass: string;
}

export function SortColumn({ id, title, cardIds, colorClass }: SortColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const cardData = cardIds.map(
    (cardId) => values.find((v) => v.id === cardId)!
  );

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn("rounded-t-lg p-4 text-center", colorClass)}>
        <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-white/90 text-sm mt-1">
          {cardIds.length} {cardIds.length === 1 ? "card" : "cards"}
        </p>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-4 bg-muted/30 rounded-b-lg min-h-[500px] transition-colors",
          isOver && "bg-primary/10 ring-2 ring-primary"
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {cardData.map((value, index) => (
              <ValueCard key={value.id} value={value} index={index} />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {cardIds.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Drop cards here</p>
          </div>
        )}
      </div>
    </div>
  );
}
