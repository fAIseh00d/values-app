import { Locale } from '@/lib/i18n';

export interface ValueEntry {
  id: string;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
}

export interface LocalizedValue {
  id: string;
  name: string;
  description: string;
}

// Import values from JSON file
import valuesData from '@/data/values.json';
export const values: ValueEntry[] = valuesData;

export function getLocalizedValues(locale: Locale): LocalizedValue[] {
  return values.map((entry) => ({
    id: entry.id,
    name: entry.names[locale] ?? entry.names['en'],
    description: entry.descriptions[locale] ?? entry.descriptions['en'],
  }));
}

export function getLocalizedValueMap(locale: Locale): Record<string, LocalizedValue> {
  return Object.fromEntries(getLocalizedValues(locale).map((value) => [value.id, value]));
}

// Utility function to calculate dynamic column distribution
export function calculateColumnDistribution(totalCards: number): number[] {
  const columnCount = 3; // Always use 3 columns
  const baseCardsPerColumn = Math.floor(totalCards / columnCount);
  const remainder = totalCards % columnCount;
  
  const distribution: number[] = [];
  
  // Distribute cards evenly with remainder going to leftmost columns
  for (let i = 0; i < columnCount; i++) {
    if (i < remainder) {
      distribution.push(baseCardsPerColumn + 1);
    } else {
      distribution.push(baseCardsPerColumn);
    }
  }
  
  return distribution;
}

// Utility function to shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize three columns with dynamic distribution
export function initializeColumns(): {
  mostImportant: string[];
  moderatelyImportant: string[];
  leastImportant: string[];
} {
  const distribution = calculateColumnDistribution(values.length);
  const shuffled = shuffleArray(values.map(v => v.id));
  
  let startIndex = 0;
  return {
    mostImportant: shuffled.slice(startIndex, startIndex + distribution[0]),
    moderatelyImportant: shuffled.slice(startIndex + distribution[0], startIndex + distribution[0] + distribution[1]),
    leastImportant: shuffled.slice(startIndex + distribution[0] + distribution[1]),
  };
}

