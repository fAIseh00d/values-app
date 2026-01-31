"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  rectIntersection,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SortColumn } from "@/components/SortColumn";
import { IntroModal } from "@/components/IntroModal";
import { BradleyTerrySortModal } from "@/components/BradleyTerrySortModal";
import {
  values,
  calculateColumnDistribution,
  getLocalizedValueMap,
  shuffleArray,
} from "@/lib/values";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/localeProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  getCookie,
  saveColumnsToCookies,
  clearSavedCookies,
  type ColumnType,
  type Columns,
} from "@/lib/cookies";
import {
  balanceColumns,
  columnsFromOrder,
  flattenColumns,
  findColumnForCard,
} from "@/lib/columnUtils";
import {
  createLinkedListFromOrder,
  linkedListToArray,
  type LinkedListState,
} from "@/lib/linkedList";

export default function Home() {
  const { t, locale } = useLocale();
  const [linkedList, setLinkedList] = useState<LinkedListState>(() => {
    const initialOrder = shuffleArray(values.map((value) => value.id));
    return createLinkedListFromOrder(initialOrder);
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showBTSort, setShowBTSort] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [btResetKey, setBtResetKey] = useState(0); // Key to force BT modal remount on reset
  const currentOrder = useMemo(() => linkedListToArray(linkedList), [linkedList]);
  const columns = useMemo(() => columnsFromOrder(currentOrder), [currentOrder]);


  // Initialize on mount
  useEffect(() => {
    // Effect only runs client-side to avoid hydration issues; allow this state change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const fallbackOrder = shuffleArray(values.map((value) => value.id));
    const savedOrder = getCookie("valuesCardSortColumns");
    let orderToSet: string[] = fallbackOrder;

    const isColumnsObject = (value: unknown): value is Columns => {
      return (
        typeof value === "object" &&
        value !== null &&
        Array.isArray((value as Columns).mostImportant) &&
        Array.isArray((value as Columns).moderatelyImportant) &&
        Array.isArray((value as Columns).leastImportant)
      );
    };
    
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          orderToSet = parsed;
        } else if (isColumnsObject(parsed)) {
          const balanced = balanceColumns(parsed);
          orderToSet = flattenColumns(balanced);
        }
      } catch (e) {
        console.warn("Failed to parse saved columns, using default:", e);
      }
    }

    setLinkedList(createLinkedListFromOrder(orderToSet));

    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem("valuesCardSortIntroSeen");
    if (!hasSeenIntro) {
      setShowIntro(true);
      localStorage.setItem("valuesCardSortIntroSeen", "true");
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: isMobile
        ? {
            delay: 1_000_000,
            tolerance: 8,
          }
        : {
            delay: 200,
            tolerance: 8,
          },
    })
  );

  const persistColumns = (updatedColumns: Columns) => {
    const balancedColumns = balanceColumns(updatedColumns);
    const nextOrder = flattenColumns(balancedColumns);
    setLinkedList(createLinkedListFromOrder(nextOrder));
    saveColumnsToCookies(nextOrder);
  };

  const persistOrder = (order: string[]) => {
    persistColumns(columnsFromOrder(order));
  };

  // Mobile handlers for up/down buttons - linked-list structure
  const handleMoveCard = (cardId: string, direction: 'up' | 'down') => {
    const flatList = [...currentOrder];
    const flatIndex = flatList.indexOf(cardId);

    if (flatIndex === -1) {
      return;
    }

    let moved = false;
    if (direction === 'up' && flatIndex > 0) {
      [flatList[flatIndex - 1], flatList[flatIndex]] = [flatList[flatIndex], flatList[flatIndex - 1]];
      moved = true;
    } else if (direction === 'down' && flatIndex < flatList.length - 1) {
      [flatList[flatIndex], flatList[flatIndex + 1]] = [flatList[flatIndex + 1], flatList[flatIndex]];
      moved = true;
    }

    if (!moved) {
      return;
    }

    persistOrder(flatList);
    setTimeout(() => {}, 100);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active card is in
    const sourceColumn = findColumnForCard(columns, activeId);

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

      persistColumns(newColumns);
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
    const sourceColumn = findColumnForCard(columns, activeId);

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
        persistColumns(newColumns);
      }
      setIsRebalancing(false);
    } else {
      // Cross-column move - trigger rebalancing animation
      setIsRebalancing(true);
      
      // Note: The actual move was already handled in handleDragOver
      // Now we just need to rebalance columns to maintain 11 cards each
      
      // Balance columns to maintain calculated distribution
      // Use setTimeout to ensure animation plays
      const balancedColumns = balanceColumns(newColumns);
      persistColumns(balancedColumns);
      setTimeout(() => setIsRebalancing(false), 250);
    }
  };

  const handleReset = () => {
    const shuffledOrder = shuffleArray(values.map((value) => value.id));
    setLinkedList(createLinkedListFromOrder(shuffledOrder));
    clearSavedCookies();
    setBtResetKey(prev => prev + 1); // Force BT modal to remount and reinitialize
  };

  const handleBTSortComplete = (newOrder: string[]) => {
    persistOrder(newOrder);
  };

  const handleStartSorting = () => {
    setShowBTSort(true);
  };

  const localizedValueMap = useMemo(() => getLocalizedValueMap(locale), [locale]);
  const activeValue = activeId ? localizedValueMap[activeId] : null;

  // Calculate current distribution for display and info
  const distribution = calculateColumnDistribution(values.length);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <IntroModal
        open={showIntro}
        onClose={() => setShowIntro(false)}
        onStartSorting={handleStartSorting}
        cardCount={values.length}
        cardsPerColumn={distribution[0]}
      />

      <BradleyTerrySortModal
        key={btResetKey}
        open={showBTSort}
        onClose={() => setShowBTSort(false)}
        cardIds={currentOrder}
        valueMap={localizedValueMap}
        onComplete={handleBTSortComplete}
      />

      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('app.title')}
            </h1>
            <p className="text-gray-600 mb-4">
              {t('app.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIntro(true)}
              >
                {t('app.showInstructions')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBTSort(true)}
                className="bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 border-purple-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t('btSort.buttonText')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('app.reset', { count: values.length })}
              </Button>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Card Sort Area */}
          {isMobile ? (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isRebalancing ? 'animating' : ''}`}>
              <SortColumn
                id="mostImportant"
                title={t('columns.mostImportant')}
                cardIds={columns.mostImportant}
                targetCount={distribution[0]}
                colorClass="bg-gradient-to-r from-purple-600 to-indigo-600"
                isMobile={isMobile}
                onMoveCard={handleMoveCard}
                valueMap={localizedValueMap}
              />
              <SortColumn
                id="moderatelyImportant"
                title={t('columns.moderatelyImportant')}
                cardIds={columns.moderatelyImportant}
                targetCount={distribution[1]}
                colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
                isMobile={isMobile}
                onMoveCard={handleMoveCard}
                valueMap={localizedValueMap}
              />
              <SortColumn
                id="leastImportant"
                title={t('columns.leastImportant')}
                cardIds={columns.leastImportant}
                targetCount={distribution[2]}
                colorClass="bg-gradient-to-r from-gray-500 to-slate-500"
                isMobile={isMobile}
                onMoveCard={handleMoveCard}
                valueMap={localizedValueMap}
              />
            </div>
          ) : (
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
                  title={t('columns.mostImportant')}
                  cardIds={columns.mostImportant}
                  targetCount={distribution[0]}
                  colorClass="bg-gradient-to-r from-purple-600 to-indigo-600"
                  isMobile={isMobile}
                  onMoveCard={handleMoveCard}
                  valueMap={localizedValueMap}
                />
                <SortColumn
                  id="moderatelyImportant"
                  title={t('columns.moderatelyImportant')}
                  cardIds={columns.moderatelyImportant}
                  targetCount={distribution[1]}
                  colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
                  isMobile={isMobile}
                  onMoveCard={handleMoveCard}
                  valueMap={localizedValueMap}
                />
                <SortColumn
                  id="leastImportant"
                  title={t('columns.leastImportant')}
                  cardIds={columns.leastImportant}
                  targetCount={distribution[2]}
                  colorClass="bg-gradient-to-r from-gray-500 to-slate-500"
                  isMobile={isMobile}
                  onMoveCard={handleMoveCard}
                  valueMap={localizedValueMap}
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
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {activeValue.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p dangerouslySetInnerHTML={{ __html: t('footer.text') }} />
          </div>
        </div>
      </main>
    </>
  );
}
