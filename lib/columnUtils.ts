import type { ColumnType, Columns } from '@/lib/cookies';
import { calculateColumnDistribution } from './values';
import { values } from './values';

export function balanceColumns(columnsToBalance: Columns): Columns {
  const balancedColumns = { ...columnsToBalance };
  const columnOrder: ColumnType[] = ["mostImportant", "moderatelyImportant", "leastImportant"];
  const distribution = calculateColumnDistribution(values.length);

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

export function findColumnForCard(columns: Columns, cardId: string): ColumnType | null {
  for (const [columnName, cardIds] of Object.entries(columns)) {
    if (cardIds.includes(cardId)) {
      return columnName as ColumnType;
    }
  }
  return null;
}