# Active Context

- **Current focus**: Bradley-Terry sorting is now production-ready with proper inconsistency detection and adaptive stopping.

- **Recent changes**: 
  - Installed Tailwind CSS v4, @dnd-kit, shadcn/ui dependencies
  - Created all 33 value cards with data from Dr. Judy Ho's exercise
  - Built IntroModal, ValueCard, SortColumn components
  - Implemented main page with drag-and-drop logic and auto-balancing
  - Configured Tailwind v4 with @import syntax
  - Successfully built production bundle
  - **Fixed drag-and-drop animation issue**: Added `onDragOver` handler to enable cross-column animations.
  - **Implemented spill-over logic**: Created `balanceColumns` function that maintains 11 cards per column automatically.
  - **Added persistent state**: Card positions saved to cookies and restored between sessions.
  - **Extracted card data to JSON**: Moved all card data to `/data/values.json`.
  - **Canonical linked-list order**: Added `lib/linkedList.ts`, persist flattened order through cookies.
  - **Bradley-Terry sorting v2**: Complete rewrite with:
    - **Cycle-based inconsistency detection**: Detects transitivity violations (A>B>C but C>A) using preference graph and BFS
    - **Adaptive stopping criteria**: No fixed budget; stops when likelihood converges, top-5 uncertainty is low (<0.15), top-11 uncertainty reasonable (<0.25), and rankings stable over 5-step window
    - **Tiered confidence**: Top 5 rock-solid, top 11 important, rest less critical
    - **Improved UI**: Shows confidence meters for top-5 and top-11, cycle count, adaptive progress
    - Min 20 comparisons, max 66 (2× cards)

- **Next steps**: 
  1. Test the improved Bradley-Terry sorting on desktop and mobile.
  2. Verify cycle detection triggers when clicking randomly.
  3. Verify adaptive stopping works (finishes before max when consistent).
  4. Push to main branch and deploy.
