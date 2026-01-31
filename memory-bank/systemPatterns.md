# System Patterns

- **Architecture**: Client-side React app with App Router; `app/layout.tsx` provides root shell with Tailwind, `app/page.tsx` renders the card sort interface. All state management happens client-side (useState for card positions/columns).
- **Data model**: 33 value cards stored as constant array with `{ id, name, description }`. Runtime state now keeps a canonical `LinkedListState` built from a flattened order (new `lib/linkedList.ts`); the visual columns are derived by slicing that order via `columnsFromOrder` and rebalanced to preserve 11 cards per column, ensuring every move keeps the list consistent for future auto-sorting logic.
- **Drag & Drop pattern**: @dnd-kit provides sortable contexts for each column. When a card moves, auto-rebalancing ensures 11 cards per column by shifting overflow to the next column.
- **Responsive strategy**: Desktop shows full card descriptions; mobile hides descriptions by default and reveals via tooltip/tap. Three-column grid on desktop, stacked columns on mobile.
- **Build pipeline**: Static export to `./out` via GitHub Actions; no server-side logic needed since all interactions are client-side.
- **Patterns to follow**: Keep card data immutable, use React hooks for state, ensure accessibility (keyboard navigation, ARIA labels), test touch events on mobile.
