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
}

export function ValueCard({ value, index }: ValueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing transition-all hover:shadow-lg",
          isDragging && "opacity-50 shadow-2xl scale-105"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm md:text-base uppercase tracking-wide mb-1">
                {value.name}
              </h3>
              {/* Desktop: Show full description */}
              <p className="hidden md:block text-xs text-muted-foreground leading-relaxed">
                {value.description}
              </p>
              {/* Mobile: Truncated description */}
              <p className="md:hidden text-xs text-muted-foreground line-clamp-2">
                {value.description}
              </p>
            </div>
            
            {/* Mobile: Info icon with tooltip */}
            <div className="md:hidden flex-shrink-0">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
