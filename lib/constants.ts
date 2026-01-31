import type { ColumnType } from './cookies';

export const COLUMN_ORDER = ["mostImportant", "moderatelyImportant", "leastImportant"] as const;
export const COLUMN_NAMES = COLUMN_ORDER as readonly ["mostImportant", "moderatelyImportant", "leastImportant"];
export const COLUMN_COLORS = {
  mostImportant: "bg-gradient-to-r from-purple-600 to-indigo-600",
  moderatelyImportant: "bg-gradient-to-r from-blue-500 to-cyan-500",
  leastImportant: "bg-gradient-to-r from-gray-500 to-slate-500",
} as const;

export const DRAG_CONFIG = {
  ACTIVATION_DISTANCE: 8,
  TOUCH_DELAY_MOBILE: 1_000_000,
  TOUCH_DELAY_DESKTOP: 200,
  TOUCH_TOLERANCE: 8,
  REBALANCE_DELAY: 100,
  ANIMATION_DURATION: 250,
} as const;