"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "./ui/card";
import { Tooltip } from "./ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValueCard as ValueCardType } from "@/lib/values";

interface ValueCardProps {
  value: ValueCardType;
  index: number;
  isMobile?: boolean;
  onMoveCard?: (cardId: string, direction: 'up' | 'down') => void;
}

export function ValueCard({ value, index, isMobile = false, onMoveCard }: ValueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: value.id,
    animateLayoutChanges: () => true,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="will-change-transform">
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing hover:shadow-lg bg-white",
          "transition-all duration-200 ease-out",
          "h-32 md:h-40",
          isDragging && "opacity-30"
        )}
      >
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-start justify-between gap-2 h-full">
            <div className="flex-1 min-w-0 flex flex-col h-full">
              <h3 className="font-bold text-sm md:text-base uppercase tracking-wide mb-1 flex-shrink-0">
                {value.name}
              </h3>
              {/* Description - responsive line clamp */}
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 overflow-hidden line-clamp-3 md:line-clamp-4">
                {value.description}
              </p>
            </div>
            
            {/* Mobile: Movement controls */}
            {isMobile && onMoveCard && (
              <div className="md:hidden flex-shrink-0 flex flex-col gap-2">
                <button
                  className="p-2 rounded hover:bg-muted disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveCard(value.id, 'up');
                  }}
                  title="Move up"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded hover:bg-muted disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveCard(value.id, 'down');
                  }}
                  title="Move down"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Desktop: Info icon with tooltip */}
            {!isMobile && (
              <div className="hidden md:flex-shrink-0">
                <Tooltip content={value.description} side="left">
                  <button
                    className="p-1 rounded-full hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
