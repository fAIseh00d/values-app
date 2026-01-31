import type { ColumnType, Columns } from '@/lib/cookies';
import { calculateColumnDistribution } from './values';

export const columnOrder: ColumnType[] = [
  "mostImportant",
  "moderatelyImportant",
  "leastImportant",
];

export function balanceColumns(columnsToBalance: Columns): Columns {
  const balancedColumns = { ...columnsToBalance };
  const totalCards = columnOrder.reduce((sum, columnName) => {
    return sum + balancedColumns[columnName].length;
  }, 0);
  const distribution = calculateColumnDistribution(totalCards);

  // Balance from left to right
  for (let i = 0; i < columnOrder.length; i++) {
    const currentCol = columnOrder[i];
    const nextCol = columnOrder[i + 1];

    // If current column has more than its target, move overflow to next column
    while (balancedColumns[currentCol].length > distribution[i] && nextCol) {
      const overflow = balancedColumns[currentCol].pop()!;
      balancedColumns[nextCol].unshift(overflow);
    }
  }

  // Balance from right to left (in case last column overflowed)
  for (let i = columnOrder.length - 1; i > 0; i--) {
    const currentCol = columnOrder[i];
    const prevCol = columnOrder[i - 1];

    // If current column has more than its target, move overflow to previous column
    while (balancedColumns[currentCol].length > distribution[i]) {
      const overflow = balancedColumns[currentCol].shift()!;
      balancedColumns[prevCol].push(overflow);
    }
  }

  // Fill underflow from next column
  for (let i = 0; i < columnOrder.length - 1; i++) {
    const currentCol = columnOrder[i];
    const nextCol = columnOrder[i + 1];

    while (balancedColumns[currentCol].length < distribution[i] && balancedColumns[nextCol].length > 0) {
      const card = balancedColumns[nextCol].shift()!;
      balancedColumns[currentCol].push(card);
    }
  }

  return balancedColumns;
}

export function columnsFromOrder(order: string[]): Columns {
  const distribution = calculateColumnDistribution(order.length);
  const columns: Columns = {
    mostImportant: [],
    moderatelyImportant: [],
    leastImportant: [],
  };

  let cursor = 0;
  columnOrder.forEach((columnName, columnIndex) => {
    const count = distribution[columnIndex];
    columns[columnName] = order.slice(cursor, cursor + count);
    cursor += count;
  });

  return columns;
}

export function flattenColumns(columns: Columns): string[] {
  return columnOrder.reduce<string[]>((result, columnName) => {
    result.push(...columns[columnName]);
    return result;
  }, []);
}

export function findColumnForCard(columns: Columns, cardId: string): ColumnType | null {
  for (const [columnName, cardIds] of Object.entries(columns)) {
    if (cardIds.includes(cardId)) {
      return columnName as ColumnType;
    }
  }
  return null;
}