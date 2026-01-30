"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SortColumn } from "@/components/SortColumn";
import { IntroModal } from "@/components/IntroModal";
import { ValueCard } from "@/components/ValueCard";
import { initializeColumns, values } from "@/lib/values";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

// Save columns to cookies
const saveColumnsToCookies = (columns: Columns) => {
  try {
    setCookie("valuesCardSortColumns", JSON.stringify(columns));
  } catch (e) {
    console.warn("Failed to save columns to cookies:", e);
  }
};

// Clear saved cookies
const clearSavedCookies = () => {
  setCookie("valuesCardSortColumns", "", -1); // Expire immediately
};

type ColumnType = "mostImportant" | "moderatelyImportant" | "leastImportant";

interface Columns {
  mostImportant: string[];
  moderatelyImportant: string[];
  leastImportant: string[];
}

export default function Home() {
  const [columns, setColumns] = useState<Columns>({
    mostImportant: [],
    moderatelyImportant: [],
    leastImportant: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    
    // Try to load saved columns from cookies
    const savedColumns = getCookie("valuesCardSortColumns");
    let columnsToSet: Columns;
    
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Validate the saved data structure
        if (parsed.mostImportant && parsed.moderatelyImportant && parsed.leastImportant) {
          columnsToSet = balanceColumns(parsed);
        } else {
          columnsToSet = balanceColumns(initializeColumns());
        }
      } catch (e) {
        console.warn("Failed to parse saved columns, using default:", e);
        columnsToSet = balanceColumns(initializeColumns());
      }
    } else {
      columnsToSet = balanceColumns(initializeColumns());
    }
    
    setColumns(columnsToSet);

    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem("valuesCardSortIntroSeen");
    if (!hasSeenIntro) {
      setShowIntro(true);
      localStorage.setItem("valuesCardSortIntroSeen", "true");
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const balanceColumns = (columnsToBalance: Columns): Columns => {
    const balancedColumns = { ...columnsToBalance };
    const columnOrder: ColumnType[] = ["mostImportant", "moderatelyImportant", "leastImportant"];

    // Balance from left to right
    for (let i = 0; i < columnOrder.length; i++) {
      const currentCol = columnOrder[i];
      const nextCol = columnOrder[i + 1];

      // If current column has more than 11, move overflow to next column
      while (balancedColumns[currentCol].length > 11 && nextCol) {
        const overflow = balancedColumns[currentCol].pop()!;
        balancedColumns[nextCol].unshift(overflow);
      }
    }

    // Balance from right to left (in case last column overflowed)
    for (let i = columnOrder.length - 1; i > 0; i--) {
      const currentCol = columnOrder[i];
      const prevCol = columnOrder[i - 1];

      // If current column has more than 11, move overflow to previous column
      while (balancedColumns[currentCol].length > 11) {
        const overflow = balancedColumns[currentCol].shift()!;
        balancedColumns[prevCol].push(overflow);
      }
    }

    // Fill underflow from next column
    for (let i = 0; i < columnOrder.length - 1; i++) {
      const currentCol = columnOrder[i];
      const nextCol = columnOrder[i + 1];

      while (balancedColumns[currentCol].length < 11 && balancedColumns[nextCol].length > 0) {
        const card = balancedColumns[nextCol].shift()!;
        balancedColumns[currentCol].push(card);
      }
    }

    return balancedColumns;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active card is in
    let sourceColumn: ColumnType | null = null;
    for (const [columnName, cardIds] of Object.entries(columns)) {
      if (cardIds.includes(activeId)) {
        sourceColumn = columnName as ColumnType;
        break;
      }
    }

    if (!sourceColumn) return;

    // Determine target column
    let targetColumn: ColumnType;
    if (["mostImportant", "moderatelyImportant", "leastImportant"].includes(overId)) {
      targetColumn = overId as ColumnType;
    } else {
      // Over a card, find which column it's in
      targetColumn = sourceColumn;
      for (const [columnName, cardIds] of Object.entries(columns)) {
        if (cardIds.includes(overId)) {
          targetColumn = columnName as ColumnType;
          break;
        }
      }
    }

    // Only proceed if moving to a different column
    if (sourceColumn !== targetColumn) {
      const newColumns = { ...columns };

      // Remove from source
      newColumns[sourceColumn] = newColumns[sourceColumn].filter((id) => id !== activeId);

      // Add to target
      const targetIndex = newColumns[targetColumn].indexOf(overId);
      if (targetIndex !== -1) {
        newColumns[targetColumn].splice(targetIndex, 0, activeId);
      } else {
        newColumns[targetColumn].push(activeId);
      }

      // Balance columns to maintain 11 cards per column
      const balancedColumns = balanceColumns(newColumns);
      setColumns(balancedColumns);
      saveColumnsToCookies(balancedColumns);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setIsRebalancing(false);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active card is in
    let sourceColumn: ColumnType | null = null;
    for (const [columnName, cardIds] of Object.entries(columns)) {
      if (cardIds.includes(activeId)) {
        sourceColumn = columnName as ColumnType;
        break;
      }
    }

    if (!sourceColumn) return;

    // Determine target column
    let targetColumn: ColumnType;
    if (["mostImportant", "moderatelyImportant", "leastImportant"].includes(overId)) {
      targetColumn = overId as ColumnType;
    } else {
      // Over a card, find which column it's in
      targetColumn = sourceColumn;
      for (const [columnName, cardIds] of Object.entries(columns)) {
        if (cardIds.includes(overId)) {
          targetColumn = columnName as ColumnType;
          break;
        }
      }
    }

    const newColumns = { ...columns };

    // Same column - reorder
    if (sourceColumn === targetColumn) {
      const columnCards = [...newColumns[sourceColumn]];
      const oldIndex = columnCards.indexOf(activeId);
      const newIndex = columnCards.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        newColumns[sourceColumn] = arrayMove(columnCards, oldIndex, newIndex);
      }
      setColumns(newColumns);
      saveColumnsToCookies(newColumns);
      setIsRebalancing(false);
    } else {
      // Cross-column move - trigger rebalancing animation
      setIsRebalancing(true);
      
      // Note: The actual move was already handled in handleDragOver
      // Now we just need to rebalance columns to maintain 11 cards each
      
      // Balance columns to maintain 11 cards per column
      const balancedColumns = balanceColumns(newColumns);
      
      // Use setTimeout to ensure animation plays
      setColumns(balancedColumns);
      saveColumnsToCookies(balancedColumns);
      setTimeout(() => setIsRebalancing(false), 250);
    }
  };

  const handleReset = () => {
    const initialized = initializeColumns();
    const balancedColumns = balanceColumns(initialized);
    setColumns(balancedColumns);
    saveColumnsToCookies(balancedColumns);
    clearSavedCookies();
  };

  const activeValue = activeId ? values.find((v) => v.id === activeId) : null;

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <IntroModal open={showIntro} onClose={() => setShowIntro(false)} />

      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Values Card Sort
            </h1>
            <p className="text-gray-600 mb-4">
              Identify and prioritize your personal values
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIntro(true)}
              >
                Show Instructions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Cards
              </Button>
            </div>
          </div>

          {/* Card Sort Area */}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isRebalancing ? 'animating' : ''}`}>
              <SortColumn
                id="mostImportant"
                title="Most Important"
                cardIds={columns.mostImportant}
                colorClass="bg-gradient-to-r from-purple-600 to-indigo-600"
              />
              <SortColumn
                id="moderatelyImportant"
                title="Moderately Important"
                cardIds={columns.moderatelyImportant}
                colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
              <SortColumn
                id="leastImportant"
                title="Least Important"
                cardIds={columns.leastImportant}
                colorClass="bg-gradient-to-r from-gray-500 to-slate-500"
              />
            </div>

            <DragOverlay>
              {activeValue ? (
                <Card className="cursor-grabbing shadow-2xl rotate-3 scale-105 bg-white border-2 border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm md:text-base uppercase tracking-wide mb-1">
                          {activeValue.name}
                        </h3>
                        <p className="hidden md:block text-xs text-muted-foreground leading-relaxed">
                          {activeValue.description}
                        </p>
                        <p className="md:hidden text-xs text-muted-foreground line-clamp-2">
                          {activeValue.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Based on the Values Card Sort exercise from{" "}
              <span className="font-semibold">Stop Self-Sabotage</span> by Dr. Judy Ho
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
