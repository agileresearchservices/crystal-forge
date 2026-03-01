# UI Components Agent

---
**name:** ui-components
**description:** Handle tasks involving React components, accessibility, dark mode, Monaco editor, resizable panels, onboarding tour, and styling. Use when modifying components, fixing dark mode issues, improving accessibility, or updating the UI.

---

## Domain Knowledge

Crystal Forge follows WCAG 2.1 Level AA accessibility standards (100/100 Lighthouse score) and full dark mode support. Every component must have a focus ring pattern and dark mode classes.

### Critical Component Rules
1. **'use client' directive:** All interactive components MUST start with `'use client'` — forgetting this causes hydration errors
2. **Modal pattern:** `{ isOpen: boolean; onClose: () => void }` — use shadcn Dialog with `open={isOpen} onOpenChange={onClose}`
3. **Focus ring:** All interactive elements need `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`
4. **Dark mode:** Every `bg-white` MUST have `dark:bg-gray-900`; every `text-gray-900` MUST have `dark:text-gray-100`
5. **ARIA labels:** Icon-only buttons need `aria-label="..."`; forms need proper labels and descriptions

### Component Hierarchy
```
page.tsx (layout)
├── ConnectionModal
├── HelpMenu
├── AutoStartTour
├── FieldList (sidebar, draggable)
├── QueryBuilder (droppable, main visual builder)
├── JSONPreview (Monaco editor, bidirectional sync)
├── AggregationsPanel (Explore/Build tabs)
└── ResultsPanel (Documents/Aggregations/Metadata/JSON tabs)
```

### JSONPreview/Monaco Editor
**Key Features:**
- Bidirectional sync: Edit visual → JSON updates; Edit JSON → visual updates
- Dev Tools format: Support `GET /index/_search\n{...}` format
- Debounced parsing: 300ms delay to avoid lag during typing
- `isEditing` flag: Prevents infinite loops between visual and JSON
- Error UI: Red ring on invalid JSON + error message below

**Sync Flow:**
1. Visual builder changes → `serializeQueryState()` → JSON updates automatically
2. User edits JSON → 300ms debounce → try parse → `deserializeQueryState()` → update query
3. If error → show red ring + error message, don't update query

**Dev Tools Extraction:**
```typescript
const devToolsRegex = /^(GET|POST|PUT|DELETE|HEAD)\s+[^\n]*\n/;
const jsonStr = text.replace(devToolsRegex, '').trim();
```

### Dark Mode Implementation
**Provider:** next-themes `ThemeProvider`

**Theme Values:** `'light'`, `'dark'`, `'system'` (follows OS preference)

**Tailwind Classes:** Always pair light and dark:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

**Recharts Colors:**
- Light: `#6366f1` (indigo-500)
- Dark: `#818cf8` (indigo-400)

**Test:** Verify every color in both light and dark modes

### Focus Ring Pattern
**Standard:** `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`

**Dark Mode:** `dark:ring-offset-gray-900` (white offset in light, gray offset in dark)

**Example:**
```tsx
<button className="px-4 py-2 bg-indigo-500 text-white rounded
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   dark:bg-indigo-600 dark:ring-offset-gray-900">
  Click Me
</button>
```

### ARIA & Accessibility
**Live Regions:** `role="status" aria-live="polite" aria-atomic="true"` for announcements

**Alerts:** `role="alert" aria-live="assertive"` for errors

**Labels:** All icon-only buttons need `aria-label="Action description"`

**Touch Targets:** All buttons/inputs minimum 44x44px

**Keyboard:** Tab through all interactive elements; Enter/Space activate; Escape closes modals

### Resizable Panels
**Hook:** `useResizablePanels()` manages panel sizes + localStorage

**Storage:** `crystal-forge-panel-sizes` as `{ vertical: [n, n], horizontal: [n, n, n] }`

**Keyboard:** Arrow keys adjust size ±10%; Shift+Arrow ±25%

**Structure:** `ResizablePanelGroup` → `ResizablePanel` → content → `ResizableHandle` → next panel

**Files:**
- `apps/web/hooks/useResizablePanels.ts` - Hook
- `apps/web/components/ui/resizable.tsx` - shadcn components
- `apps/web/app/page.tsx` - Layout using panels

### Onboarding Tour
**Hook:** `useOnboardingTour()` with `startTour()`, `hasTourCompleted()`, `resetTourCompletion()`

**Auto-start:** `AutoStartTour` component checks if not completed AND not connected (2-second delay)

**localStorage Key:** `crystal-forge:tour-completed` = `'true'`

**Tour Steps:** 15 steps total; each needs element ID: `#tour-connect-button`, `#tour-query-builder`, etc.

**Reset:** "Reset Tour" in Help menu → `localStorage.removeItem('crystal-forge:tour-completed')`

### Common Component Patterns

**Modal Pattern:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent aria-labelledby="modal-title" aria-describedby="modal-description">
    <h2 id="modal-title">Title</h2>
    <p id="modal-description">Description</p>
    <DialogFooter>
      <button onClick={onClose}>Cancel</button>
      <button onClick={onConfirm} autoFocus>Confirm</button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Button with Tooltip:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button aria-label="Copy to clipboard">
      <CopyIcon />
    </button>
  </TooltipTrigger>
  <TooltipContent>Copy query to clipboard</TooltipContent>
</Tooltip>
```

**Form Input:**
```tsx
<label htmlFor="field-search" className="block font-medium text-gray-700 dark:text-gray-300">
  Search Fields
</label>
<input
  id="field-search"
  type="text"
  aria-describedby="search-help"
  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>
<span id="search-help" className="text-sm text-gray-500 dark:text-gray-400">
  Start typing to filter field list
</span>
```

## Common Tasks

### Adding New Component
1. **Create file:** `apps/web/components/MyComponent.tsx`
2. **Start with:** `'use client'` directive
3. **Define interface:** `interface MyComponentProps { ... }`
4. **Add focus ring:** All interactive elements
5. **Add dark mode:** Pair every light color class with `dark:` variant
6. **Add ARIA:** Labels, descriptions, roles where needed
7. **Export:** Default export or named export

### Fixing Dark Mode
1. **Symptom:** Text invisible or background too light/dark
2. **Find:** Component CSS classes or Tailwind utilities
3. **Check:** Every `bg-`, `text-`, `border-` class has `dark:` pair
4. **Test:** Toggle dark mode in UI; verify contrast (4.5:1 min)
5. **Recharts:** If chart, update color constants for dark mode

### Improving Accessibility
1. **Run Lighthouse:** DevTools > Lighthouse > Accessibility (target 100/100)
2. **Check focus:** Tab through UI; ensure focus ring visible everywhere
3. **Check contrast:** Use WebAIM contrast checker (min 4.5:1 for normal text)
4. **Check ARIA:** Verify form labels, button labels, live regions
5. **Test with screen reader:** VoiceOver (Mac) or NVDA (Windows)

### Modifying Monaco Editor
1. **File:** `apps/web/components/JSONPreview.tsx`
2. **Update schema:** Edit `opensearchQuerySchema` in `lib/opensearch-schema.ts`
3. **Update completions:** Edit completion provider in `lib/monaco-completions.ts`
4. **Test:** Paste JSON, verify sync works; edit JSON, verify visual update

### Adding Tour Step
1. **File:** `apps/web/constants/tour-steps.ts`
2. **Add element ID:** `<div id="tour-my-feature">` in component
3. **Add step config:** `{ element: '#tour-my-feature', title: '...', description: '...' }`
4. **Test:** Run tour in UI; verify step highlights correct element

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Component not rendering | Missing `'use client'` directive on interactive component | Add `'use client'` at top of file |
| Focus ring not visible | Missing focus classes or wrong color | Add `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500` |
| Dark mode text invisible | Missing `dark:text-` class for text color | Pair every `text-*` with `dark:text-*` |
| Modal doesn't close | Missing `onOpenChange={onClose}` handler | Use Dialog `open={isOpen} onOpenChange={onClose}` pattern |
| Monaco editor not syncing | `isEditing` flag not managed | Check debounce sets flag; verify flow |
| Tour step shows wrong element | Element ID doesn't match selector | Verify element has correct ID; check DevTools |
| Screen reader can't read content | Missing ARIA labels or semantic HTML | Add `aria-label`, proper heading hierarchy, form labels |

## Do / Don't

| Do | Don't |
|---|---|
| Start with `'use client'` on all interactive components | Forget `'use client'` (causes hydration errors) |
| Pair every light color class with `dark:` | Define light mode without dark mode |
| Test dark mode in UI (not just code review) | Assume dark mode works |
| Use focus ring pattern on all interactive elements | Skip focus styling; rely on browser default |
| Test with keyboard navigation | Test only with mouse |
| Test with screen reader (VoiceOver/NVDA) | Assume ARIA labels work without testing |
| Use shadcn/ui components (Dialog, Tooltip, etc.) | Build custom components from scratch |
| Run Lighthouse accessibility audit | Skip automated testing |
