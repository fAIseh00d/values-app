export interface ComparisonRecord {
  winner: string;
  loser: string;
  logLikelihood: number;
}

export interface BradleyTerryState {
  mu: Record<string, number>;
  fisher: Record<string, number>;
  sigma: Record<string, number>;
  
  // Preference graph for cycle detection
  preferenceGraph: Map<string, Set<string>>; // winner -> Set<losers they beat>
  cycleCount: number;
  
  // Comparison tracking
  comparisonHistory: ComparisonRecord[];
  likelihoodHistory: number[];
  rankHistory: string[][]; // history of top-K rankings at each step
  
  // Adaptive stopping
  minComparisons: number;
  maxComparisons: number;
  used: number;
  
  allCardIds: string[];
  appearedCount: Record<string, number>;
}

// Constants
const EPSILON = 0.01;
const BASE_LEARNING_RATE = 0.15;

// Stopping criteria parameters
const WINDOW_SIZE = 5;
const TOP_K_CRITICAL = 5;  // Top 5 must be rock solid
const TOP_K_IMPORTANT = 11; // Top 11 matters for ordering
const LIKELIHOOD_EPSILON = 0.02;
const SIGMA_TOP5 = 0.35;    // Achievable threshold for top 5 with ~40 comparisons
const SIGMA_TOP11 = 0.5;    // Moderate threshold for top 6-11

// Inconsistency handling
const INCONSISTENCY_THRESHOLD = 0.1;  // Cycle ratio above which we extend comparisons
const MAX_COMPARISONS_EXTENSION = 1.5;  // Extend max by 50% for inconsistent users

export function initBradleyTerry(
  cardIds: string[],
  minComparisons?: number,
  maxComparisons?: number
): BradleyTerryState {
  const mu: Record<string, number> = {};
  const fisher: Record<string, number> = {};
  const sigma: Record<string, number> = {};
  const appearedCount: Record<string, number> = {};

  cardIds.forEach((id) => {
    mu[id] = 0;
    fisher[id] = EPSILON;
    sigma[id] = 1 / Math.sqrt(EPSILON);
    appearedCount[id] = 0;
  });

  return {
    mu,
    fisher,
    sigma,
    preferenceGraph: new Map(),
    cycleCount: 0,
    comparisonHistory: [],
    likelihoodHistory: [],
    rankHistory: [],
    minComparisons: minComparisons ?? Math.ceil(cardIds.length * 0.8), // ~26 for 33 cards
    maxComparisons: maxComparisons ?? Math.ceil(cardIds.length * 2.0), // ~60 for 33 cards
    used: 0,
    allCardIds: cardIds,
    appearedCount,
  };
}

export function calculateProbability(mu_i: number, mu_j: number): number {
  const exp_i = Math.exp(mu_i);
  const exp_j = Math.exp(mu_j);
  return exp_i / (exp_i + exp_j);
}

/**
 * Check if adding edge winner->loser creates a cycle
 * A cycle exists if there's already a path from loser to winner
 */
function wouldCreateCycle(
  graph: Map<string, Set<string>>,
  winner: string,
  loser: string
): boolean {
  // BFS/DFS from loser to see if we can reach winner
  const visited = new Set<string>();
  const queue = [loser];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === winner) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const neighbors = graph.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  return false;
}

/**
 * Calculate total log-likelihood of all comparisons given current mu values
 */
function calculateLogLikelihood(
  mu: Record<string, number>,
  history: Array<{ winner: string; loser: string }>
): number {
  let ll = 0;
  for (const { winner, loser } of history) {
    const p = calculateProbability(mu[winner]!, mu[loser]!);
    ll += Math.log(Math.max(p, 0.0001));
  }
  return ll;
}

/**
 * Get top K items by mu score
 */
function getTopK(mu: Record<string, number>, k: number): string[] {
  return Object.entries(mu)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id]) => id);
}

/**
 * Calculate selection score for a pair - used for active learning
 */
export function calculateSelectionScore(
  state: BradleyTerryState,
  i: string,
  j: string
): number {
  const p = calculateProbability(state.mu[i]!, state.mu[j]!);
  const uncertainty = 1 - 2 * Math.abs(p - 0.5); // Higher when p ≈ 0.5
  const combinedSigma = state.sigma[i]! + state.sigma[j]!;
  
  // Bonus for items in top 11 that need more data
  const topK = getTopK(state.mu, TOP_K_IMPORTANT);
  const iInTop = topK.includes(i);
  const jInTop = topK.includes(j);
  const topBonus = (iInTop ? 1.5 : 1) * (jInTop ? 1.5 : 1);
  
  // Coverage bonus for items that haven't appeared much
  const iCount = state.appearedCount[i] ?? 0;
  const jCount = state.appearedCount[j] ?? 0;
  const coverageBonus = 1 / (1 + Math.min(iCount, jCount) * 0.1);

  return uncertainty * combinedSigma * topBonus * coverageBonus;
}

export function selectNextPair(
  state: BradleyTerryState
): [string, string] | null {
  // Ensure coverage first - every item should appear at least once
  const uncoveredCards = state.allCardIds.filter(
    (id) => state.appearedCount[id]! === 0
  );

  if (uncoveredCards.length >= 2) {
    // Pair two uncovered cards
    return [uncoveredCards[0]!, uncoveredCards[1]!];
  }
  
  if (uncoveredCards.length === 1) {
    // Pair uncovered with a covered card that has high uncertainty
    const uncovered = uncoveredCards[0]!;
    let bestPartner = state.allCardIds.find((id) => id !== uncovered)!;
    let bestScore = -Infinity;
    
    for (const id of state.allCardIds) {
      if (id === uncovered) continue;
      const score = state.sigma[id]!;
      if (score > bestScore) {
        bestScore = score;
        bestPartner = id;
      }
    }
    return [uncovered, bestPartner];
  }

  // Use acquisition function for optimal pair selection
  let bestPair: [string, string] | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < state.allCardIds.length; i++) {
    for (let j = i + 1; j < state.allCardIds.length; j++) {
      const cardI = state.allCardIds[i]!;
      const cardJ = state.allCardIds[j]!;
      const score = calculateSelectionScore(state, cardI, cardJ);

      if (score > bestScore) {
        bestScore = score;
        bestPair = [cardI, cardJ];
      }
    }
  }

  return bestPair;
}

export function updateAfterComparison(
  state: BradleyTerryState,
  winner: string,
  loser: string
): BradleyTerryState {
  const newState: BradleyTerryState = {
    ...state,
    mu: { ...state.mu },
    fisher: { ...state.fisher },
    sigma: { ...state.sigma },
    appearedCount: { ...state.appearedCount },
    preferenceGraph: new Map(state.preferenceGraph),
    comparisonHistory: [...state.comparisonHistory],
    likelihoodHistory: [...state.likelihoodHistory],
    rankHistory: [...state.rankHistory],
  };

  // Update appeared count
  newState.appearedCount[winner] = (newState.appearedCount[winner] ?? 0) + 1;
  newState.appearedCount[loser] = (newState.appearedCount[loser] ?? 0) + 1;

  // Check for cycle before adding to graph
  if (wouldCreateCycle(newState.preferenceGraph, winner, loser)) {
    newState.cycleCount = state.cycleCount + 1;
  }

  // Add edge to preference graph
  if (!newState.preferenceGraph.has(winner)) {
    newState.preferenceGraph.set(winner, new Set());
  }
  // Clone the set before modifying
  const winnerEdges = new Set(newState.preferenceGraph.get(winner));
  winnerEdges.add(loser);
  newState.preferenceGraph.set(winner, winnerEdges);

  // Calculate probability before update (for gradient)
  const p_winner = calculateProbability(
    newState.mu[winner]!,
    newState.mu[loser]!
  );

  // Adaptive learning rate based on inconsistency
  const inconsistencyRatio = state.used > 0 ? state.cycleCount / state.used : 0;
  const learningRate = BASE_LEARNING_RATE / (1 + inconsistencyRatio * 2);

  // SGD update
  const p_loser = 1 - p_winner;
  const gradient_winner = learningRate * (1 - p_winner);
  const gradient_loser = -learningRate * p_loser;

  newState.mu[winner] = newState.mu[winner]! + gradient_winner;
  newState.mu[loser] = newState.mu[loser]! + gradient_loser;

  // Update Fisher information
  newState.fisher[winner] = newState.fisher[winner]! + p_winner * (1 - p_winner);
  newState.fisher[loser] = newState.fisher[loser]! + p_loser * (1 - p_loser);

  // Update uncertainty (sigma)
  newState.sigma[winner] = 1 / Math.sqrt(newState.fisher[winner]! + EPSILON);
  newState.sigma[loser] = 1 / Math.sqrt(newState.fisher[loser]! + EPSILON);

  // Calculate and store log-likelihood
  const simplifiedHistory = [
    ...state.comparisonHistory.map(c => ({ winner: c.winner, loser: c.loser })),
    { winner, loser }
  ];
  const ll = calculateLogLikelihood(newState.mu, simplifiedHistory);
  
  newState.comparisonHistory.push({ winner, loser, logLikelihood: ll });
  newState.likelihoodHistory.push(ll);

  // Store current top-K ranking
  const currentTopK = getTopK(newState.mu, TOP_K_IMPORTANT);
  newState.rankHistory.push(currentTopK);

  // Increment used count
  newState.used = newState.used + 1;

  return newState;
}

/**
 * Calculate variance of likelihood over a window
 * More robust than comparing just two snapshots
 */
function calculateWindowVariance(values: number[], windowSize: number): number {
  if (values.length < windowSize) return Infinity;
  const recent = values.slice(-windowSize);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length;
  return variance;
}

/**
 * Calculate Kendall tau correlation between two rankings
 * Returns value between -1 (perfectly reversed) and 1 (identical)
 */
function kendallTau(rankingA: string[], rankingB: string[]): number {
  const n = rankingA.length;
  if (n !== rankingB.length || n < 2) return 0;

  // Create position maps
  const posA = new Map(rankingA.map((id, idx) => [id, idx]));
  const posB = new Map(rankingB.map((id, idx) => [id, idx]));

  // Count concordant and discordant pairs
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const idI = rankingA[i]!;
      const idJ = rankingA[j]!;

      const posI_B = posB.get(idI);
      const posJ_B = posB.get(idJ);

      if (posI_B === undefined || posJ_B === undefined) continue;

      // In rankingA: i comes before j (i < j)
      // In rankingB: check if same order
      if ((posI_B < posJ_B) === (i < j)) {
        concordant++;
      } else {
        discordant++;
      }
    }
  }

  const totalPairs = (n * (n - 1)) / 2;
  if (totalPairs === 0) return 0;

  return (concordant - discordant) / totalPairs;
}


/**
 * Get extended max comparisons based on inconsistency level
 */
function getExtendedMaxComparisons(state: BradleyTerryState): number {
  const cycleRatio = state.used > 0 ? state.cycleCount / state.used : 0;

  if (cycleRatio > INCONSISTENCY_THRESHOLD) {
    // Extend max comparisons for inconsistent users
    return Math.floor(state.maxComparisons * MAX_COMPARISONS_EXTENSION);
  }

  return state.maxComparisons;
}

/**
 * Check if stopping criteria are met
 */
export function shouldStop(state: BradleyTerryState): boolean {
  // Hard minimum
  if (state.used < state.minComparisons) return false;

  // Extended maximum based on inconsistency
  const effectiveMax = getExtendedMaxComparisons(state);
  if (state.used >= effectiveMax) return true;

  // Need enough history for window comparison
  if (state.likelihoodHistory.length < WINDOW_SIZE + 1) return false;
  if (state.rankHistory.length < WINDOW_SIZE + 1) return false;

  // Check inconsistency level - don't stop early if user is lying
  const cycleRatio = state.used > 0 ? state.cycleCount / state.used : 0;
  const isInconsistent = cycleRatio > INCONSISTENCY_THRESHOLD;

  // 1. Likelihood convergence using window variance (not just snapshot)
  const likelihoodVariance = calculateWindowVariance(state.likelihoodHistory, WINDOW_SIZE);
  const likelihoodConverged = likelihoodVariance < LIKELIHOOD_EPSILON ** 2;

  if (!likelihoodConverged) return false;


  // 3. Top-5 uncertainty must be low (rock solid)
  const top5 = getTopK(state.mu, TOP_K_CRITICAL);
  const maxSigmaTop5 = Math.max(...top5.map(id => state.sigma[id]!));
  if (maxSigmaTop5 >= SIGMA_TOP5) return false;

  // 4. Top-11 uncertainty should be reasonable
  const top11 = getTopK(state.mu, TOP_K_IMPORTANT);
  const maxSigmaTop11 = Math.max(...top11.map(id => state.sigma[id]!));
  if (maxSigmaTop11 >= SIGMA_TOP11) return false;

  // 5. Top-K rank stability using Kendall tau (more robust than set comparison)
  const currentRanking = state.rankHistory[state.rankHistory.length - 1]!;
  const pastRanking = state.rankHistory[state.rankHistory.length - WINDOW_SIZE - 1]!;

  // Top 3 must be exactly the same (most critical)
  const top3Stable = currentRanking.slice(0, 3).every(
    (id, idx) => pastRanking[idx] === id
  );
  if (!top3Stable) return false;

  // Use Kendall tau for Top-11 stability only (not full ranking)
  const currentTop11 = currentRanking.slice(0, TOP_K_IMPORTANT);
  const pastTop11 = pastRanking.slice(0, TOP_K_IMPORTANT);
  const tau = kendallTau(currentTop11, pastTop11);
  const KENDALL_TAU_THRESHOLD = isInconsistent ? 0.8 : 0.9;
  if (tau < KENDALL_TAU_THRESHOLD) return false;

  // 6. For inconsistent users, require sustained stability across windows
  if (isInconsistent) {
    const recentRankings = state.rankHistory.slice(-3);
    if (recentRankings.length >= 3) {
      const tau1 = kendallTau(
        recentRankings[0]!.slice(0, TOP_K_IMPORTANT),
        recentRankings[1]!.slice(0, TOP_K_IMPORTANT)
      );
      const tau2 = kendallTau(
        recentRankings[1]!.slice(0, TOP_K_IMPORTANT),
        recentRankings[2]!.slice(0, TOP_K_IMPORTANT)
      );
      if (tau1 < 0.85 || tau2 < 0.85) return false;
    }
  }

  return true;
}

/**
 * Get inconsistency score based on cycle count
 */
export function getInconsistencyScore(state: BradleyTerryState): number {
  if (state.used === 0) return 0;
  
  // Ratio of cycles to comparisons, scaled
  const cycleRatio = state.cycleCount / state.used;
  
  // Scale to 0-2 range approximately
  return cycleRatio * 10;
}

export type InconsistencyLevel = "consistent" | "some_inconsistency" | "inconsistent";

export function getInconsistencyLevel(state: BradleyTerryState): InconsistencyLevel {
  const cycleRatio = state.used > 0 ? state.cycleCount / state.used : 0;
  
  if (cycleRatio < 0.05) return "consistent";
  if (cycleRatio < 0.15) return "some_inconsistency";
  return "inconsistent";
}

export function getInconsistencyColor(level: InconsistencyLevel): string {
  switch (level) {
    case "consistent":
      return "text-green-700 bg-green-100";
    case "some_inconsistency":
      return "text-yellow-700 bg-yellow-100";
    case "inconsistent":
      return "text-red-700 bg-red-100";
  }
}

/**
 * Get confidence level for the current ranking
 */
export function getConfidenceInfo(state: BradleyTerryState): {
  top5Confidence: number;
  top11Confidence: number;
  overallProgress: number;
} {
  if (state.used === 0) {
    return { top5Confidence: 0, top11Confidence: 0, overallProgress: 0 };
  }

  const top5 = getTopK(state.mu, TOP_K_CRITICAL);
  const top11 = getTopK(state.mu, TOP_K_IMPORTANT);
  
  // Confidence = 1 - normalized sigma (clamped to 0-1)
  const avgSigmaTop5 = top5.reduce((sum, id) => sum + state.sigma[id]!, 0) / top5.length;
  const avgSigmaTop11 = top11.reduce((sum, id) => sum + state.sigma[id]!, 0) / top11.length;
  
  // Map sigma to confidence (lower sigma = higher confidence)
  // Initial sigma is ~10, target is 0.15-0.25
  const top5Confidence = Math.min(1, Math.max(0, 1 - avgSigmaTop5 / 2));
  const top11Confidence = Math.min(1, Math.max(0, 1 - avgSigmaTop11 / 2));
  
  // Overall progress considers multiple factors
  const coverageRatio = Object.values(state.appearedCount).filter(c => c > 0).length / state.allCardIds.length;
  const minProgressRatio = state.used / state.minComparisons;
  
  const overallProgress = Math.min(1, (coverageRatio + minProgressRatio + top11Confidence) / 3);
  
  return { top5Confidence, top11Confidence, overallProgress };
}

export function getFinalRanking(state: BradleyTerryState): string[] {
  return [...state.allCardIds].sort((a, b) => state.mu[b]! - state.mu[a]!);
}

/**
 * Get remaining comparisons count for UI display
 * Returns the effective max (extended if user is inconsistent)
 */
export function getEffectiveMaxComparisons(state: BradleyTerryState): number {
  return getExtendedMaxComparisons(state);
}

/**
 * Check if comparisons have been extended due to inconsistency
 */
export function hasExtendedComparisons(state: BradleyTerryState): boolean {
  const cycleRatio = state.used > 0 ? state.cycleCount / state.used : 0;
  return cycleRatio > INCONSISTENCY_THRESHOLD;
}
