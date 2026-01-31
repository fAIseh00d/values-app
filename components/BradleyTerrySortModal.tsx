"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  initBradleyTerry,
  selectNextPair,
  updateAfterComparison,
  shouldStop,
  getInconsistencyLevel,
  getInconsistencyColor,
  getConfidenceInfo,
  getFinalRanking,
  getEffectiveMaxComparisons,
  hasExtendedComparisons,
  type BradleyTerryState,
  type InconsistencyLevel,
} from "@/lib/bradleyTerry";
import { useLocale } from "@/lib/localeProvider";

const BT_COOKIE_NAME = "bradleyTerrySortState";

function saveBTStateToCookies(state: BradleyTerryState) {
  const serialized = {
    mu: state.mu,
    fisher: state.fisher,
    sigma: state.sigma,
    preferenceGraph: Array.from(state.preferenceGraph.entries()).map(
      ([k, v]) => [k, Array.from(v)]
    ),
    cycleCount: state.cycleCount,
    comparisonHistory: state.comparisonHistory,
    likelihoodHistory: state.likelihoodHistory,
    rankHistory: state.rankHistory,
    minComparisons: state.minComparisons,
    maxComparisons: state.maxComparisons,
    used: state.used,
    allCardIds: state.allCardIds,
    appearedCount: state.appearedCount,
  };

  document.cookie = `${BT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(serialized))}; path=/; max-age=86400`;
}

function loadBTStateFromCookies(): BradleyTerryState | null {
  const cookies = document.cookie.split(";");
  const btCookie = cookies.find((c) =>
    c.trim().startsWith(`${BT_COOKIE_NAME}=`)
  );

  if (!btCookie) return null;

  try {
    const value = decodeURIComponent(btCookie.split("=")[1]!);
    const parsed = JSON.parse(value);

    return {
      mu: parsed.mu,
      fisher: parsed.fisher,
      sigma: parsed.sigma,
      preferenceGraph: new Map(
        parsed.preferenceGraph.map(([k, v]: [string, string[]]) => [
          k,
          new Set(v),
        ])
      ),
      cycleCount: parsed.cycleCount,
      comparisonHistory: parsed.comparisonHistory,
      likelihoodHistory: parsed.likelihoodHistory,
      rankHistory: parsed.rankHistory,
      minComparisons: parsed.minComparisons,
      maxComparisons: parsed.maxComparisons,
      used: parsed.used,
      allCardIds: parsed.allCardIds,
      appearedCount: parsed.appearedCount,
    };
  } catch (e) {
    console.warn("Failed to parse BT state from cookies:", e);
    return null;
  }
}

function clearBTCookies() {
  document.cookie = `${BT_COOKIE_NAME}=; path=/; max-age=0`;
}

interface BradleyTerrySortModalProps {
  open: boolean;
  onClose: () => void;
  cardIds: string[];
  valueMap: Record<string, { name: string; description: string }>;
  onComplete: (newOrder: string[]) => void;
}

export function BradleyTerrySortModal({
  open,
  onClose,
  cardIds,
  valueMap,
  onComplete,
}: BradleyTerrySortModalProps) {
  const { t } = useLocale();
  const [btState, setBtState] = useState<BradleyTerryState>(() => {
    // Try to load saved state on initial mount
    const savedState = loadBTStateFromCookies();
    if (savedState && savedState.allCardIds.length === cardIds.length) {
      return savedState;
    }
    return initBradleyTerry(cardIds);
  });
  
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(() => {
    const savedState = loadBTStateFromCookies();
    const state = savedState && savedState.allCardIds.length === cardIds.length 
      ? savedState 
      : initBradleyTerry(cardIds);
    return selectNextPair(state);
  });
  
  const [isComplete, setIsComplete] = useState(() => {
    const savedState = loadBTStateFromCookies();
    if (savedState && savedState.allCardIds.length === cardIds.length) {
      return shouldStop(savedState);
    }
    return false;
  });
  
  const [finalRanking, setFinalRanking] = useState<string[]>(() => {
    const savedState = loadBTStateFromCookies();
    if (savedState && savedState.allCardIds.length === cardIds.length && shouldStop(savedState)) {
      return getFinalRanking(savedState);
    }
    return [];
  });

  const handleChoice = (winner: string, loser: string) => {
    const newState = updateAfterComparison(btState, winner, loser);
    setBtState(newState);
    saveBTStateToCookies(newState);

    // Check adaptive stopping criteria
    if (shouldStop(newState)) {
      const ranking = getFinalRanking(newState);
      setFinalRanking(ranking);
      setIsComplete(true);
      setCurrentPair(null);
      clearBTCookies();
    } else {
      const nextPair = selectNextPair(newState);
      setCurrentPair(nextPair);
    }
  };

  const handleApplyRanking = () => {
    onComplete(finalRanking);
    clearBTCookies();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleRestart = () => {
    clearBTCookies();
    const newState = initBradleyTerry(cardIds);
    setBtState(newState);
    setIsComplete(false);
    setFinalRanking([]);
    setCurrentPair(selectNextPair(newState));
  };

  const inconsistencyLevel = getInconsistencyLevel(btState);
  const confidenceInfo = getConfidenceInfo(btState);

  const getConsistencyText = (level: InconsistencyLevel): string => {
    switch (level) {
      case "consistent":
        return t("btSort.consistencyNormal");
      case "some_inconsistency":
        return t("btSort.consistencyNoisy");
      case "inconsistent":
        return t("btSort.consistencyHighlyInconsistent");
    }
  };

  const inconsistencyColorClass = getInconsistencyColor(inconsistencyLevel);

  // Calculate progress based on confidence rather than fixed budget
  const progress = Math.round(confidenceInfo.overallProgress * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {t("btSort.title")}
              </DialogTitle>
              <DialogDescription>{t("btSort.description")}</DialogDescription>
            </div>
            {!isComplete && btState.used > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="text-xs"
              >
                {t("btSort.restart")}
              </Button>
            )}
          </div>
        </DialogHeader>

        {!isComplete && currentPair ? (
          <div className="space-y-6">
            {/* Progress & Stats */}
            <div className="space-y-3">
              {/* Overall Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("btSort.progress")}</span>
                  <span>{t("btSort.comparisonsAdaptive", { count: btState.used })}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Confidence Meters */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>{t("btSort.top5Confidence")}</span>
                    <span>{Math.round(confidenceInfo.top5Confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${confidenceInfo.top5Confidence * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>{t("btSort.top11Confidence")}</span>
                    <span>{Math.round(confidenceInfo.top11Confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${confidenceInfo.top11Confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consistency Indicator */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{t("btSort.consistency")}</span>
                {btState.cycleCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({t("btSort.cyclesDetected", { count: btState.cycleCount })})
                  </span>
                )}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${inconsistencyColorClass}`}
              >
                {getConsistencyText(inconsistencyLevel)}
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPair.map((cardId, index) => {
                const value = valueMap[cardId];
                if (!value) return null;

                return (
                  <button
                    key={cardId}
                    onClick={() =>
                      handleChoice(cardId, currentPair[index === 0 ? 1 : 0]!)
                    }
                    className="group relative"
                  >
                    <Card className="h-full transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 hover:border-purple-500 cursor-pointer">
                      <CardContent className="p-6 h-full flex flex-col justify-between min-h-[200px]">
                        <div>
                          <h3 className="font-bold text-lg md:text-xl uppercase tracking-wide mb-3 text-gray-900">
                            {value.name}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                            {value.description}
                          </p>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium group-hover:bg-purple-200 transition-colors">
                            {t("btSort.chooseThis")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

            {/* Info text */}
            <div className="flex justify-center">
              <p className="text-sm text-gray-500">{t("btSort.adaptiveHint")}</p>
            </div>
          </div>
        ) : isComplete ? (
          <div className="space-y-6">
            {/* Completion Message */}
            <div className="text-center py-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("btSort.completedTitle")}
              </h3>
              <p className="text-gray-600">
                {t("btSort.completedDescriptionAdaptive", { count: btState.used })}
              </p>
            </div>

            {/* Final Stats */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {btState.used}
                </div>
                <div className="text-xs text-gray-500">{t("btSort.comparisons")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(confidenceInfo.top5Confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500">{t("btSort.top5Confidence")}</div>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${inconsistencyColorClass}`}
              >
                {getConsistencyText(inconsistencyLevel)}
              </div>
            </div>

            {/* Preview Top 5 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                {t("btSort.topValuesPreview")}
              </h4>
              <ol className="space-y-2">
                {finalRanking.slice(0, 5).map((cardId, index) => {
                  const value = valueMap[cardId];
                  if (!value) return null;
                  return (
                    <li key={cardId} className="flex items-start gap-3">
                      <span className="font-bold text-purple-600 min-w-[1.5rem]">
                        {index + 1}.
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">
                          {value.name}
                        </span>
                        <p className="text-sm text-gray-600">
                          {value.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                {t("btSort.cancel")}
              </Button>
              <Button
                onClick={handleApplyRanking}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {t("btSort.applyRanking")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {t("btSort.initializing")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
