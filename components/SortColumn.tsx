"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ValueCard } from "./ValueCard";
import type { LocalizedValue } from "@/lib/values";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/localeProvider";

interface SortColumnProps {
  id: string;
  title: string;
  cardIds: string[];
  targetCount?: number;
  colorClass: string;
  isMobile?: boolean;
  onMoveCard?: (cardId: string, direction: 'up' | 'down') => void;
  valueMap: Record<string, LocalizedValue>;
}

export function SortColumn({ id, title, cardIds, targetCount, colorClass, isMobile = false, onMoveCard, valueMap }: SortColumnProps) {
  const { t } = useLocale();
  const { setNodeRef, isOver } = useDroppable({ id });

  const cardData = cardIds.map(
    (cardId) => valueMap[cardId] ?? { id: cardId, name: cardId, description: "" }
  );

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn("rounded-t-lg p-4 text-center", colorClass)}>
        <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-white/90 text-sm mt-1">
          {t('columns.cardsCount', { count: cardIds.length })}
        </p>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-4 bg-muted/30 rounded-b-lg min-h-[500px] transition-all duration-200",
          isOver && "bg-primary/10 ring-2 ring-primary"
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 transition-all duration-200">
            {cardData.map((value, index) => (
              <ValueCard
                key={value.id}
                value={value}
                index={index}
                isMobile={isMobile}
                onMoveCard={onMoveCard}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {cardIds.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">{t('columns.emptyState')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
