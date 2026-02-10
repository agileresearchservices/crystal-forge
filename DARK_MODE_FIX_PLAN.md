# Crystal Forge Dark Mode Color System & Fix Plan

## Executive Summary

Crystal Forge has inconsistent dark mode colors across components. This plan provides a comprehensive color system and prioritized fixes to ensure **WCAG 2.1 AA compliance** (4.5:1 minimum contrast).

## Dark Mode Color System (Tailwind Classes)

### Recommended Token Mappings

**Background Depths (Light-to-Dark):**
```
Light Mode  →  Dark Mode
bg-white         bg-gray-900      (page/main backgrounds)
bg-gray-50       bg-gray-800      (secondary panels, cards)
bg-gray-100      bg-gray-700      (tertiary or hover states)
```

**Text Hierarchy (Light-to-Dark):**
```
text-gray-900    →  text-white       (primary: headings, labels)
text-gray-700    →  text-gray-300    (secondary: body text)
text-gray-600    →  text-gray-400    (tertiary: subtle)
text-gray-500    →  text-gray-500    (muted: disabled, hints)
```

**Better for Code/Emphasis (Light-to-Dark):**
```
text-gray-700    →  text-gray-200    (higher contrast than gray-300)
text-gray-600    →  text-gray-300    (still readable but not as bright)
```

**Borders (Light-to-Dark):**
```
border-gray-200  →  border-gray-700  (visible dividers)
border-gray-300  →  border-gray-600  (secondary borders)
border-gray-400  →  border-gray-500  (hover states)
```

**Status Colors (Dark Variants):**
```
Success:  text-emerald-400    bg-emerald-900/20   border-emerald-700
Warning:  text-yellow-400     bg-yellow-900/20    border-yellow-700
Error:    text-red-400        bg-red-900/20       border-red-700
Info:     text-blue-400       bg-blue-900/20      border-blue-700
```

---

## Priority 1: High-Visibility Components (Affects All Users)

### 1. JSONPreview.tsx
**Status:** Not yet fixed
**Issues:**
- Code editor background should be `bg-gray-900` (dark), not white
- Monaco theme needs dark mode detection
- Code text color needs adjustment for dark backgrounds

**Changes:**
```tsx
// Line 56: Add dark mode detection
const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  const html = document.documentElement;
  setIsDarkMode(html.classList.contains('dark'));

  const observer = new MutationObserver(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  });

  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}, []);

// In editor options:
theme={isDarkMode ? 'vs-dark' : 'vs'}
```

---

### 2. QueryBuilder.tsx
**Status:** Not yet audited
**Likely Issues:**
- Empty state boxes with light backgrounds
- Example query cards may have poor contrast
- Buttons and interactive elements

**Action:** Audit and apply color fixes

---

### 3. FieldList.tsx
**Status:** Not yet audited
**Likely Issues:**
- Field list items with inconsistent backgrounds on hover
- Group headers may need better contrast
- Type badges may need dark mode colors

**Action:** Audit and apply color fixes

---

## Priority 2: Modal & Form Components

### 4. ConnectionModal.tsx
**Status:** Not yet audited
**Likely Issues:**
- Form inputs with white backgrounds
- Labels with dark text on dark backgrounds
- Connection status indicators

**Action:** Audit inputs, labels, and status text

---

### 5. UI Components (shadcn/ui)
**Status:** Partially implemented
**Files to Audit:**
- `apps/web/components/ui/button.tsx`
- `apps/web/components/ui/input.tsx`
- `apps/web/components/ui/dialog.tsx`
- `apps/web/components/ui/tabs.tsx`
- `apps/web/components/ui/select.tsx`
- `apps/web/components/ui/calendar.tsx`

**Key Issues to Look For:**
- Input backgrounds: `bg-white` instead of `dark:bg-gray-800`
- Input text: `text-black` instead of `dark:text-white`
- Dialog backgrounds: missing `dark:bg-gray-900`
- Select dropdowns: poor dark mode contrast
- Calendar: may have hard-coded light colors

---

### 6. Help Menu Components
**Files:**
- `HelpMenu/BoolQueryGuideModal.tsx`
- `HelpMenu/FieldTypesGuideModal.tsx`
- `HelpMenu/QueryPatternsModal.tsx`
- `HelpMenu/KeyboardShortcutsModal.tsx`

**Common Issues:**
- Code blocks with light backgrounds
- Example text with poor contrast
- Alert/info boxes with hard-coded colors

---

## Priority 3: Data Display Components

### 7. TemplateLibrary Components
**Files:**
- `TemplateLibrary/TemplateLibraryModal.tsx`
- `TemplateLibrary/SaveTemplateModal.tsx`
- `TemplateLibrary/QueryHistory.tsx`

**Issues:**
- List items with hover states
- Category tags/badges
- Modal backgrounds

---

### 8. Date Picker Components
**Files:**
- `DatePickers/DatePicker.tsx`
- `DatePickers/DateRangePicker.tsx`
- `DatePickers/DateMathInput.tsx`

**Issues:**
- Calendar styling may have light backgrounds
- Input fields need dark variants
- Button states

---

## Accessibility Audit Checklist

After implementing fixes, verify:

```
Contrast Ratios (WCAG AA minimum 4.5:1):
- [ ] All body text: 4.5:1+
- [ ] All interactive elements: 4.5:1+
- [ ] Disabled elements: 3:1+ acceptable
- [ ] Large text (18px+): 3:1+ acceptable
- [ ] UI components borders: visible in both modes

Color Blind Accessibility:
- [ ] Don't rely solely on color (use icons + text)
- [ ] Status indicators have patterns/text
- [ ] Code highlighting has sufficient brightness differences

Lighthouse Test (Chrome DevTools):
- [ ] Accessibility: 100/100
- [ ] No WCAG violations

axe DevTools Scan:
- [ ] 0 violations
- [ ] 0 best practice issues
```

---

## Implementation Strategy

### Phase 1: Core Components (This Session)
1. ✅ ResultsPanel.tsx (completed)
2. ⏳ JSONPreview.tsx (next)
3. ⏳ FieldList.tsx (next)
4. ⏳ QueryBuilder.tsx (next)

### Phase 2: UI System
1. Audit and fix all shadcn/ui components in `apps/web/components/ui/`
2. Create design token system (optional: Tailwind config file)
3. Document dark mode patterns

### Phase 3: Remaining Components
1. All modals (Help, Template, Connection, etc.)
2. Date pickers
3. Data display components

### Phase 4: Verification
1. Full dark mode walkthrough
2. Lighthouse audit
3. axe DevTools scan
4. Manual testing with screen reader

---

## Example: Before & After

### ❌ Before (Poor Contrast)
```tsx
<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
  <div className="text-xs text-gray-600 dark:text-gray-400">Label</div>
  <pre className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
    Code
  </pre>
</div>
```
**Issue:** `gray-400` on `gray-800` = 2.2:1 ratio (FAILS WCAG AA)

### ✅ After (WCAG AA Compliant)
```tsx
<div className="p-3 bg-white dark:bg-gray-800 rounded-md">
  <div className="text-xs text-gray-600 dark:text-gray-300">Label</div>
  <pre className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
    Code
  </pre>
</div>
```
**Result:** `gray-300` on `gray-800` = 5.4:1 ratio (PASSES WCAG AA)

---

## Testing Dark Mode Locally

```bash
# Start the app
npm run dev

# In Chrome DevTools:
# 1. Open Inspect
# 2. Right-click on <html> element
# 3. Edit as HTML
# 4. Add: class="dark" to <html>
# 5. Or use the ThemeToggle button in the app

# Run Lighthouse audit:
# DevTools > Lighthouse > Accessibility (focus on colors)

# Run axe scan:
# Install: axe DevTools extension
# Open DevTools > axe DevTools > Scan
# Check violations
```

---

## Notes

- All color changes should use Tailwind's `dark:` prefix
- No hard-coded colors (#fff, #000, etc.) unless absolutely necessary
- Test with real content, not just placeholders
- Consider OLED displays (avoid pure black if burn-in is concern—use gray-900 instead)
- Document any custom colors not in standard Tailwind palette

