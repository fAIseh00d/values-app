# Active Context

- **Current focus**: Refining the linked-list-backed card order so the upcoming pairwise auto-sorting prompts operate on a single canonical structure.

- **Recent changes**: 
  - Installed Tailwind CSS v4, @dnd-kit, shadcn/ui dependencies
  - Created all 33 value cards with data from Dr. Judy Ho's exercise
  - Built IntroModal, ValueCard, SortColumn components
  - Implemented main page with drag-and-drop logic and auto-balancing
  - Configured Tailwind v4 with @import syntax
  - Successfully built production bundle
  - **Fixed drag-and-drop animation issue**: Added `onDragOver` handler to enable cross-column animations. Cards now animate smoothly when moving between columns, not just within columns.
  - **Implemented spill-over logic**: Created `balanceColumns` function that maintains 11 cards per column automatically. When a column exceeds 11 cards, overflow moves to the next column; when it has fewer than 11 cards, it pulls cards from the next column.
  - **Added persistent state**: Card positions are now saved to cookies and restored automatically between sessions. Users won't lose their progress when they refresh or return to the site.
  - **Extracted card data to JSON**: Moved all card data to `/data/values.json` for easy editing. Implemented dynamic column balancing that automatically calculates distribution based on the number of cards (33 cards = 11+11+11, 20 cards = 7+7+6, etc.).
  - **Canonical linked-list order**: Added `lib/linkedList.ts`, now persist a single flattened order through cookies, derive the three visual columns via `columnsFromOrder`, and have every move update `LinkedListState` so auto-balancing stably roots in one consistent list instead of mirroring column arrays.

- **Next steps**: 
  1. Manually verify desktop/mobile drag-and-drop (including rebalancing and persisted order) over the new linked-list state.
  2. Prepare and document the pairwise user prompting strategy that will work off the canonical order.
  3. Push to main branch.
  4. Verify GitHub Actions deployment to Pages and test the live site.
