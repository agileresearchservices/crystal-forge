# Accessibility & WCAG 2.1 AA

## Purpose
Reference for accessibility patterns, color contrast, focus indicators, and ARIA conventions.

## Key Files
| File | Purpose |
|---|---|
| `apps/web/components/` | All interactive components with focus/ARIA |
| `apps/web/components/ui/button.tsx` | Focus ring pattern (shadcn) |
| `apps/web/app/page.tsx` | Main layout with semantic HTML |
| `apps/web/lib/colors.ts` | Color palette with contrast ratios |

## WCAG 2.1 Level AA Standards

**Target:** 100/100 Lighthouse accessibility score

**Key Metrics:**
- Text color contrast: 4.5:1 minimum (normal text), 3:1 minimum (large text)
- Focus indicators: Visible on all interactive elements
- Keyboard navigation: Tab through all interactive elements
- Semantic HTML: Proper heading hierarchy, landmark roles

## Focus Indicator Pattern

### Standard Focus Ring
```typescript
// Tailwind classes
focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
```

**Visual:**
- `ring-2`: 2px ring
- `ring-offset-2`: 2px white/light space between element and ring
- `ring-indigo-500`: #6366f1 (primary accent color)

**Dark Mode:**
```typescript
focus:outline-none focus:ring-2 focus:ring-offset-2
dark:ring-offset-gray-900 focus:ring-indigo-500
```

### Button Focus Example
```tsx
<button
  className="px-4 py-2 bg-indigo-500 text-white rounded
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
             dark:bg-indigo-600 dark:ring-offset-gray-900"
>
  Submit
</button>
```

## Color Contrast Standards

### Primary Colors
| Color | Hex | Light/Dark | Contrast (min 4.5:1) |
|---|---|---|---|
| Indigo | #6366f1 | Light background | 5.2:1 on white |
| Indigo | #6366f1 | Dark background | 4.8:1 on gray-900 |
| Red (Error) | #ef4444 | Light background | 5.1:1 on white |
| Green (Success) | #16a34a | Light background | 4.5:1 on white |
| Gray (Text) | #374151 | Light background | 8.2:1 on white |

### Text Color Mappings
| Element | Light Mode | Dark Mode | Contrast |
|---|---|---|---|
| Primary text | `text-gray-900` | `dark:text-gray-100` | 21:1 |
| Secondary text | `text-gray-600` | `dark:text-gray-400` | 9.8:1 |
| Muted text | `text-gray-500` | `dark:text-gray-500` | 7.1:1 |
| Error text | `text-red-600` | `dark:text-red-500` | 5.2:1 |
| Success text | `text-green-600` | `dark:text-green-500` | 4.5:1 |

### Background Mappings
| Element | Light Mode | Dark Mode |
|---|---|---|
| Page background | `bg-white` | `dark:bg-gray-900` |
| Card background | `bg-white` | `dark:bg-gray-800` |
| Input background | `bg-gray-50` | `dark:bg-gray-800` |
| Hover background | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |
| Active background | `bg-indigo-50` | `dark:bg-gray-700` |

## ARIA Conventions

### Live Regions (Real-time Updates)
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="text-green-600"
>
  Query executed successfully. Found 1,234 results.
</div>
```

**Usage:**
- Connection status updates
- Query execution feedback
- Search result count

**Attributes:**
- `role="status"`: Implicit live region
- `aria-live="polite"`: Announce after current speech ends
- `aria-atomic="true"`: Announce entire region content, not just changes

### Alert Regions (Urgent)
```tsx
<div
  role="alert"
  aria-live="assertive"
  className="text-red-600"
>
  Error: Invalid query syntax
</div>
```

**Usage:**
- Error messages
- Validation failures
- Critical warnings

**Difference from status:** `aria-live="assertive"` interrupts current speech

### Button Labels
```tsx
<button
  aria-label="Add field to query"
  className="p-2 hover:bg-gray-100"
>
  <PlusIcon />
</button>
```

**When to use:**
- Icon-only buttons
- Unclear button purpose

### Form Labels
```tsx
<label htmlFor="index-select" className="block font-medium text-gray-700">
  Select Index
</label>
<select
  id="index-select"
  aria-label="Available indices"
  aria-describedby="index-help"
>
  {/* options */}
</select>
<span id="index-help" className="text-sm text-gray-500">
  Choose an index to query
</span>
```

### Descriptions
```tsx
<input
  id="range-from"
  aria-describedby="range-help"
  type="number"
/>
<span id="range-help" className="text-sm text-gray-500">
  Start value for range query
</span>
```

## Semantic HTML

### Heading Hierarchy
```tsx
<h1>Crystal Forge Query Builder</h1>           {/* Page title — only one h1 */}
<section>
  <h2>Query Builder</h2>                        {/* Major section */}
  <h3>Boolean Clauses</h3>                      {/* Subsection */}
</section>
<section>
  <h2>Results</h2>
</section>
```

### Landmark Roles
```tsx
<header role="banner">
  {/* Top navigation, logo */}
</header>

<main role="main">
  {/* Primary content */}
</main>

<aside role="complementary">
  {/* Field list sidebar */}
</aside>

<footer role="contentinfo">
  {/* Footer info */}
</footer>
```

## Dark Mode Implementation

### Theme Detection
```typescript
// Automatic detection: follows system preference
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### Theme Provider
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  enableColorScheme={false}
>
  {/* App content */}
</ThemeProvider>
```

### Pairing Light/Dark Classes
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Contrast maintained in both modes
</div>
```

**Critical:** Every light-mode color class must have a dark mode pair.

### Recharts Colors for Dark Mode
```typescript
const chartColor = isDark ? '#818cf8' : '#6366f1';
```

| Component | Light | Dark |
|---|---|---|
| Bar/Line | `#6366f1` | `#818cf8` |
| Area fill | `#6366f1` (40% opacity) | `#818cf8` (40% opacity) |
| Tooltip bg | White | Gray-800 |
| Text | Gray-900 | Gray-100 |

## Touch Target Size

All interactive elements (buttons, inputs, links) must be at least **44x44px**:

```tsx
<button className="px-4 py-2 min-h-11 min-w-11">
  {/* Minimum 44x44px touch target */}
</button>
```

## Keyboard Navigation

### Standard Keys
| Key(s) | Action |
|---|---|
| `Tab` | Move focus forward |
| `Shift+Tab` | Move focus backward |
| `Enter` | Activate button / select option |
| `Space` | Toggle checkbox / activate button |
| `Escape` | Close modal / cancel operation |
| `Arrow Keys` | Navigate menu / adjust panel size (±10%, Shift+25%) |

### Implementation
```tsx
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click or press Enter
</button>
```

## Accessible Modal Pattern

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent aria-labelledby="modal-title" aria-describedby="modal-description">
    <h2 id="modal-title">Confirm Delete</h2>
    <p id="modal-description">This action cannot be undone.</p>
    <DialogFooter>
      <button onClick={onClose}>Cancel</button>
      <button onClick={onConfirm} autoFocus>Delete</button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Key Points:**
- Focus returns to trigger button on close
- Esc key closes dialog
- Proper ARIA labels/descriptions

## Testing for Accessibility

### Automated (Lighthouse)
```bash
# Chrome DevTools > Lighthouse > Accessibility
# Target: 100/100
```

### Manual Testing
1. **Keyboard-only:** Tab through entire app, verify all interactive elements reachable
2. **Screen Reader (VoiceOver on Mac):** `Cmd+F5` to enable; verify all text announced
3. **Color Contrast:** Use WebAIM contrast checker or browser extension (axe, Lighthouse)
4. **Focus Indicators:** Verify visible in both light and dark modes

### Browser Extensions
- **axe DevTools:** Run full accessibility audit
- **WAVE:** Visual feedback for accessibility issues
- **Lighthouse:** Built-in Chrome DevTools

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Focus ring barely visible | Ring color insufficient contrast or no offset | Use `ring-offset-2` + indigo; test on both light/dark |
| Text unreadable on colored background | Contrast < 4.5:1 | Use WebAIM contrast checker; adjust text color |
| Button not keyboard-accessible | Missing `onKeyDown` handler for Enter/Space | Add key handler to all interactive elements |
| Screen reader announces nothing | Missing `aria-label` or `role` | Add labels to icon-only buttons; use semantic HTML |
| Dark mode text invisible | Missing `dark:` class on text color | Pair every text color with `dark:` variant |
| Modal closes but focus lost | Focus not returned to trigger | Store trigger ref; focus on modal close |
| Heading hierarchy broken | Skipped levels (h1 → h3, no h2) | Use sequential heading levels only |

## Do / Don't

| Do | Don't |
|---|---|
| Use Tailwind `focus:` classes for all interactive elements | Add custom focus styles with CSS |
| Test with keyboard only (no mouse) | Test only with mouse |
| Pair light/dark colors in all components | Define light mode without dark mode pair |
| Use semantic HTML (button, input, label) | Use div with onclick for buttons |
| Set minimum 44x44px touch targets | Use < 32px buttons for touch devices |
| Use `aria-live` for real-time updates | Assume screen reader sees dynamic updates |
| Test in both light and dark themes | Test only in light mode |
| Use `aria-label` for icon-only buttons | Leave icon buttons without labels |
