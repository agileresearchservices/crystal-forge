# Onboarding Tour

## Purpose
Reference for driver.js tour configuration, 15 tour steps, and localStorage persistence.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/components/Tour/OnboardingTour.tsx` | `useOnboardingTour()` hook + main tour logic |
| `apps/web/components/Tour/AutoStartTour.tsx` | Auto-start component for first-time users |
| `apps/web/constants/tour-steps.ts` | All 15 tour step definitions |

## useOnboardingTour() Hook

### Signature
```typescript
function useOnboardingTour() {
  const startTour: () => void;
  const hasTourCompleted: () => boolean;
  const resetTourCompletion: () => void;
  const currentStep: number;
}
```

### Usage
```typescript
import { useOnboardingTour } from '@/components/Tour/OnboardingTour';

function MyComponent() {
  const { startTour, hasTourCompleted } = useOnboardingTour();

  return (
    <button onClick={startTour}>
      {hasTourCompleted() ? 'Replay Tour' : 'Start Tour'}
    </button>
  );
}
```

## AutoStartTour Component

### Conditions for Auto-Start
```typescript
export function AutoStartTour() {
  const { hasTourCompleted } = useOnboardingTour();
  const { isConnected } = useConnectionContext();

  useEffect(() => {
    // Auto-start if:
    // 1. Tour not completed AND
    // 2. User not connected to OpenSearch
    if (!hasTourCompleted() && !isConnected) {
      setTimeout(() => {
        startTour();
      }, 2000); // 2-second delay after page load
    }
  }, [hasTourCompleted, isConnected]);

  return null; // No visual output
}
```

**Delay Rationale:** 2 seconds allows page to fully render before tour starts

### Implementation Pattern
```tsx
// In page.tsx
export default function HomePage() {
  return (
    <>
      <AutoStartTour />
      {/* Rest of app */}
    </>
  );
}
```

## localStorage Persistence

### Key
```typescript
const TOUR_COMPLETION_KEY = 'crystal-forge:tour-completed';
```

### Storage Format
```typescript
// When tour completed:
localStorage[TOUR_COMPLETION_KEY] = 'true';

// Check completion:
const isCompleted = localStorage.getItem(TOUR_COMPLETION_KEY) === 'true';
```

### Reset Tour
```typescript
function resetTourCompletion() {
  localStorage.removeItem(TOUR_COMPLETION_KEY);
}
```

**Usage:** In Help menu "Reset Tour" option

## Driver.js Configuration

### Initialization
```typescript
import { driver } from 'driver.js';

const driverObj = driver({
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  allowClose: true,
  onDestroyed: () => {
    localStorage.setItem(TOUR_COMPLETION_KEY, 'true');
  }
});
```

**Options:**
- `showProgress: true` — Display step counter (e.g., "1 / 15")
- `showButtons: ['next', 'previous', 'close']` — Show navigation buttons
- `allowClose: true` — Allow ESC key to close
- `onDestroyed` callback — Called when tour ends (mark as completed)

## All 15 Tour Steps

### Step 1: Welcome
```typescript
{
  element: '#tour-welcome',
  title: 'Welcome to Crystal Forge',
  description: 'Crystal Forge is a visual query builder for OpenSearch. Let\'s explore the interface!',
  side: 'bottom'
}
```

**Element ID:** `#tour-welcome` (usually a banner or heading at top of page)

### Step 2: Connection Status
```typescript
{
  element: '#tour-connection-status',
  title: 'Connection Status',
  description: 'Check your OpenSearch connection status here. Click to connect.',
  side: 'bottom'
}
```

**Element ID:** `#tour-connection-status` (Connection button or status indicator)

### Step 3: Connect Button
```typescript
{
  element: '#tour-connect-button',
  title: 'Connect to OpenSearch',
  description: 'Click here to configure your OpenSearch connection.',
  side: 'bottom'
}
```

**Element ID:** `#tour-connect-button` (Main connection button)

### Step 4: Field List
```typescript
{
  element: '#tour-field-list',
  title: 'Available Fields',
  description: 'See all fields from your index here. Click any field to add it to your query.',
  side: 'right'
}
```

**Element ID:** `#tour-field-list` (Left sidebar with fields)

### Step 5: Field Search
```typescript
{
  element: '#tour-field-search',
  title: 'Search Fields',
  description: 'Filter the field list by typing a field name.',
  side: 'right'
}
```

**Element ID:** `#tour-field-search` (Search input in field list)

### Step 6: Query Builder
```typescript
{
  element: '#tour-query-builder',
  title: 'Query Builder',
  description: 'Build your query visually by dragging fields or clicking the + button. No JSON needed!',
  side: 'left'
}
```

**Element ID:** `#tour-query-builder` (Main visual builder area)

### Step 7: Bool Clauses
```typescript
{
  element: '#tour-bool-clauses',
  title: 'Boolean Clauses',
  description: 'Use Must (AND), Should (OR), Must Not (NOT), and Filter clauses to structure your query.',
  side: 'left'
}
```

**Element ID:** `#tour-bool-clauses` (Clause tabs: Must/Should/Must Not/Filter)

### Step 8: Active Clause Indicator
```typescript
{
  element: '#tour-active-clause',
  title: 'Active Clause',
  description: 'The highlighted tab shows which clause new fields will be added to.',
  side: 'bottom'
}
```

**Element ID:** `#tour-active-clause` (Currently selected clause tab)

### Step 9: JSON Panel
```typescript
{
  element: '#tour-json-panel',
  title: 'JSON Preview',
  description: 'See the OpenSearch query in JSON format. You can also edit JSON directly here!',
  side: 'left'
}
```

**Element ID:** `#tour-json-panel` (Monaco editor showing JSON)

### Step 10: Execute Button
```typescript
{
  element: '#tour-execute-button',
  title: 'Execute Query',
  description: 'Click to run your query against OpenSearch.',
  side: 'left'
}
```

**Element ID:** `#tour-execute-button` (Query execution button)

### Step 11: Results Panel
```typescript
{
  element: '#tour-results-panel',
  title: 'Query Results',
  description: 'Results will appear here as a table. You can view aggregations, metadata, and raw JSON.',
  side: 'top'
}
```

**Element ID:** `#tour-results-panel` (Results table area)

### Step 12: Dark Mode Toggle
```typescript
{
  element: '#tour-dark-mode',
  title: 'Dark Mode',
  description: 'Toggle between light and dark themes.',
  side: 'left'
}
```

**Element ID:** `#tour-dark-mode` (Theme toggle button)

### Step 13: Panel Resize
```typescript
{
  element: '#tour-panel-resize',
  title: 'Resize Panels',
  description: 'Drag the dividers to resize panels and customize your workspace.',
  side: 'left'
}
```

**Element ID:** `#tour-panel-resize` (Resize handle between panels)

### Step 14: Help Menu
```typescript
{
  element: '#tour-help-menu',
  title: 'Help Menu',
  description: 'Access guides, keyboard shortcuts, and documentation.',
  side: 'left'
}
```

**Element ID:** `#tour-help-menu` (Help/question mark icon)

### Step 15: Explore Tab
```typescript
{
  element: '#tour-explore-tab',
  title: 'Explore Fields',
  description: 'Use aggregations to explore field values before building queries.',
  side: 'left'
}
```

**Element ID:** `#tour-explore-tab` (Explore tab in right panel)

## Step Definition Type

```typescript
interface TourStep {
  element: string;              // CSS selector for element to highlight
  title: string;                // Step title
  description: string;          // Step description (can include HTML)
  side?: 'top' | 'bottom' | 'left' | 'right'; // Popup position
  highlightClass?: string;      // Custom highlight class
  allowClicksInsideElement?: boolean; // Allow interactions while touring
}
```

## Theme Customization

### Dark Mode Styling
```typescript
const driverObj = driver({
  // ... options
  overlayColor: 'rgba(0, 0, 0, 0.7)',
  popoverClass: 'driver-popover-dark',
  // Add dark mode specific styles
});
```

**Tailwind Dark Mode:** Tour uses `dark:` classes to adapt to theme

## Error Handling

### Element Not Found
```typescript
// If #tour-connect-button doesn't exist:
driverObj.defineSteps([
  {
    element: '#tour-connect-button', // May not exist in some views
    title: 'Connect',
    description: '...',
    allowClicksInsideElement: true
  }
]);
```

**Mitigation:** Use `data-tour-step` attributes instead of IDs if elements are conditionally rendered

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Tour doesn't start on page load | Auto-start conditions not met; check localStorage | Clear `crystal-forge:tour-completed` from localStorage |
| Step highlights wrong element | Element ID doesn't match | Verify element has correct ID attribute; use DevTools inspector |
| Tour closes unexpectedly | ESC key pressed or onDestroyed trigger | Check if any modals are intercepting ESC |
| "Replay Tour" button doesn't work | `resetTourCompletion()` not called | Verify `resetTourCompletion` is bound to button click |
| Step appears in wrong location | `side` property set incorrectly | Adjust `side` value based on element position on page |
| Tour progress bar missing | `showProgress: true` but styles not loaded | Check driver.js CSS is imported |

## Do / Don't

| Do | Don't |
|---|---|
| Add `id="tour-*"` attributes to all featured elements | Use class selectors for tour targets |
| Call `localStorage.setItem(..., 'true')` when tour completes | Assume tour completion without persisting |
| Wrap AutoStartTour in useEffect with proper dependencies | Call `startTour()` in render phase |
| Test tour with both completed and first-time users | Test only on fresh browser (no localStorage) |
| Use `allowClicksInsideElement: true` for interactive steps | Disable all interactions during tour |
| Show 2-second delay before auto-starting | Start immediately on page load (too jarring) |
| Support "Replay Tour" in Help menu | Hide tour after first completion |
| Verify all 15 step elements exist before deploying | Trust that all elements will exist |
