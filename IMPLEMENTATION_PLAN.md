# Values Card Sort - Implementation Plan

## Overview
Build an interactive web application for Dr. Judy Ho's Values Card Sort exercise using Next.js, Tailwind CSS, shadcn/ui, and @dnd-kit for drag-and-drop functionality.

## Core Requirements

### 1. Data Structure
- **33 Value Cards** with:
  - ID (unique identifier)
  - Name (e.g., "ACCEPTANCE", "ADVENTURE")
  - Description (e.g., "To be open and accepting of myself, others, and life events")

### 2. Three-Column Layout
- **Column 1**: "Most Important" (11 cards)
- **Column 2**: "Moderately Important" (11 cards)
- **Column 3**: "Least Important" (11 cards)

### 3. Initial State
- Cards randomly distributed across columns (11 per column)
- Linked-list ordering: cards flow Column 1 → Column 2 → Column 3, top-to-bottom, left-to-right

### 4. Drag & Drop Behavior
- Users can drag cards between columns
- **Auto-balancing**: When a card is moved, the system automatically rebalances to maintain 11 cards per column
- **Reflow pattern**: Cards shift from the end of one column to the start of the next column when rebalancing

### 5. Introductory Modal
- Shows on first visit explaining the exercise
- Summarized content from PDF:
  - Purpose: Identify and prioritize personal values
  - Instructions: Sort 33 cards evenly (11 per column)
  - Guideline: Rank based on current life priorities
  - Reminder: No right or wrong answers, just be honest

### 6. Responsive Design

#### Desktop (≥1024px)
- Three columns side-by-side
- Full card descriptions visible
- Hover states for drag feedback
- Generous spacing

#### Tablet (768px - 1023px)
- Three columns, slightly narrower
- Full descriptions visible
- Touch-friendly drag targets

#### Mobile (<768px)
- Three columns stacked or in horizontal scroll
- **Hide descriptions by default** to save space
- **Tap card for tooltip/modal** to view full description
- Larger touch targets for dragging
- Consider single-column view with tabs/sections

## Technical Architecture

### Dependencies to Install
```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "@dnd-kit/utilities": "^3.x"
  },
  "devDependencies": {
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### shadcn/ui Components Needed
- **Dialog**: Introductory modal
- **Card**: Visual container for value cards
- **Tooltip**: Mobile descriptions
- **Button**: "Start Sorting" button in modal

### File Structure
```
app/
├── layout.tsx          # Root layout with Tailwind
├── page.tsx            # Main card sort interface
├── components/
│   ├── IntroModal.tsx      # Welcome/instructions modal
│   ├── ValueCard.tsx       # Individual draggable card
│   ├── SortColumn.tsx      # Droppable column container
│   └── CardTooltip.tsx     # Mobile tooltip for descriptions
├── lib/
│   ├── values.ts           # 33 value cards data
│   └── utils.ts            # shadcn/ui cn() utility
└── globals.css         # Tailwind directives
```

## Implementation Steps

### Phase 1: Setup & Configuration
1. ✅ Initialize memory bank
2. Install Tailwind CSS (`pnpm add -D tailwindcss postcss autoprefixer`)
3. Configure Tailwind (`npx tailwindcss init -p`)
4. Set up shadcn/ui (`npx shadcn-ui@latest init`)
5. Install @dnd-kit packages
6. Install required shadcn/ui components (dialog, card, tooltip, button)

### Phase 2: Data & Core Components
1. Create `lib/values.ts` with all 33 value cards
2. Build `ValueCard.tsx` component
   - Display name and description
   - Draggable with @dnd-kit
   - Responsive: full description on desktop, icon/truncated on mobile
3. Build `SortColumn.tsx` component
   - Droppable zone with @dnd-kit
   - Header with column title
   - Visual feedback when dragging over

### Phase 3: Drag & Drop Logic
1. Set up @dnd-kit contexts in `page.tsx`
2. Implement drag handlers:
   - `handleDragStart`: Track which card is being dragged
   - `handleDragEnd`: Update card positions and trigger rebalance
3. **Auto-balancing algorithm**:
   - When a card moves to a column, check if column has >11 cards
   - If overflow: move last card(s) to the start of the next column
   - If underflow in a column: pull first card(s) from the next column
   - Maintain linked-list flow: Col1 → Col2 → Col3

### Phase 4: Introductory Modal
1. Create `IntroModal.tsx` with shadcn Dialog
2. Content sections:
   - **Header**: "Values Card Sort Exercise"
   - **What it is**: Brief explanation of values identification
   - **How to use**: 
     - "Sort 33 value cards into three columns"
     - "Each column should have exactly 11 cards"
     - "Drag cards to rearrange them based on importance to you"
     - "Cards will automatically rebalance"
   - **Remember**: "Rank based on your current priorities. No right or wrong answers."
3. Show modal on initial load (use localStorage to track if user has seen it)
4. "Start Sorting" button to close modal

### Phase 5: Responsive Design
1. **Desktop styles**:
   - Three-column grid with `grid-cols-3`
   - Card size: comfortable padding, readable text
   - Full descriptions visible
2. **Mobile styles**:
   - Consider horizontal scroll or stacked columns
   - Hide descriptions: show only value name
   - Add info icon/button to trigger tooltip
3. **Tooltip implementation**:
   - On mobile: tap card to show tooltip with description
   - Use shadcn Tooltip or custom modal for better touch experience

### Phase 6: Polish & UX
1. **Visual feedback**:
   - Highlight column when dragging over it
   - Smooth animations for card rebalancing
   - Drop shadow on dragged card
2. **Accessibility**:
   - Keyboard navigation support
   - ARIA labels for screen readers
   - Focus management
3. **State persistence** (optional):
   - Save card order to localStorage
   - Add "Reset" button to shuffle cards again

### Phase 7: Testing & Deployment
1. Test drag-and-drop on desktop (mouse)
2. Test on mobile (touch)
3. Test responsive breakpoints
4. Test accessibility (keyboard, screen reader)
5. Push to `main` branch
6. Verify GitHub Actions build and deploy

## Key Implementation Details

### Auto-Balancing Algorithm (Pseudocode)
```typescript
function rebalanceColumns(columns: Column[], movedCard: Card, targetColumn: number) {
  // Add card to target column
  columns[targetColumn].push(movedCard);
  
  // Rebalance from left to right
  for (let i = 0; i < columns.length; i++) {
    while (columns[i].length > 11 && i < columns.length - 1) {
      // Move overflow to next column
      const overflow = columns[i].pop();
      columns[i + 1].unshift(overflow);
    }
    
    while (columns[i].length < 11 && i < columns.length - 1) {
      // Pull from next column
      const card = columns[i + 1].shift();
      columns[i].push(card);
    }
  }
  
  return columns;
}
```

### Linked-List Flow Visualization
```
Column 1 (Most Important)
┌─────┐
│ 1   │ ←─ Top of list
│ 2   │
│ ... │
│ 11  │ ─┐
└─────┘  │
         ↓
Column 2 (Moderately Important)
┌─────┐  │
│ 12  │ ←┘
│ 13  │
│ ... │
│ 22  │ ─┐
└─────┘  │
         ↓
Column 3 (Least Important)
┌─────┐  │
│ 23  │ ←┘
│ 24  │
│ ... │
│ 33  │ ←─ Bottom of list
└─────┘
```

## Design Considerations

### Color Scheme
- **Column headers**: Gradient from important (warm) to least (cool)
  - Most Important: Purple/Indigo gradient
  - Moderately Important: Blue gradient
  - Least Important: Gray/Slate gradient
- **Cards**: Clean white/light background with subtle shadow
- **Hover/Drag**: Increase shadow, slight scale transform

### Typography
- **Card names**: Bold, uppercase, ~16-18px
- **Descriptions**: Regular weight, ~14px, muted color
- **Column headers**: Large, bold, ~20-24px

### Spacing
- **Desktop**: Generous padding (p-6), large gaps between columns (gap-6)
- **Mobile**: Tighter spacing (p-4, gap-4) to fit more cards

## Success Criteria
- ✅ All 33 value cards render correctly
- ✅ Drag and drop works smoothly on desktop and mobile
- ✅ Auto-balancing maintains 11 cards per column
- ✅ Introductory modal displays on first visit
- ✅ Responsive design works from 320px to 4K displays
- ✅ Tooltips show descriptions on mobile
- ✅ Accessible via keyboard navigation
- ✅ Deploys successfully to GitHub Pages

## Future Enhancements (Post-MVP)
- Export sorted values as PDF/image
- Share results via link
- Save multiple sorting sessions
- Compare value changes over time
- Add analytics (anonymous) to see most common "Most Important" values
- Multi-language support
- Dark mode toggle
