# Web Designer Expert Skill

A comprehensive Claude Code skill for professional web design, accessibility auditing, responsive design validation, and performance optimization.

**Location:** `~/.claude/skills/web-designer/`
**Created:** 2025-12-31
**Status:** Complete and ready to use

---

## Overview

The **web-designer** skill enhances Claude's capabilities for web design, layout architecture, Next.js development, and performance optimization. It includes expert guidance, validation scripts, and comprehensive reference documentation.

### Total Package: 116KB
- 9 files organized in a structured directory
- 50+ working code examples
- Complete WCAG 2.1 accessibility coverage
- Next.js 15+ (App Router) best practices
- Advanced layout patterns using modern CSS

---

## Contents

### Core Files

1. **SKILL.md** (6.8KB)
   - Expert prompt defining web designer capabilities
   - Core competencies across 6 major areas
   - Decision framework for design choices
   - Deep Next.js and layout expertise

2. **README.md** (8.1KB)
   - How to use the skill
   - File structure and organization
   - Getting started guide
   - Example prompts for common tasks

### Reference Documents (5 files)

3. **accessibility-wcag.md** (7.9KB)
   - Complete WCAG 2.1 checklist (Level A, AA, AAA)
   - 10-point quick audit
   - Common mistakes and solutions
   - Testing tools and resources

4. **design-patterns.md** (11KB)
   - Layout patterns (sidebar, card grid, hero)
   - Navigation patterns (hamburger, breadcrumb, tabs)
   - Form patterns (floating labels, checkboxes, multi-step)
   - Component states (hover, focus, disabled, loading, error)
   - Mobile-first CSS approach

5. **nextjs-patterns.md** (16KB) - NEW
   - Layout architecture (root, nested, responsive)
   - Server Components vs Client Components
   - Dynamic routing patterns
   - Image and font optimization
   - Data fetching strategies (Server Components, ISR)
   - Loading states and Suspense
   - Error handling with error.tsx
   - Metadata and SEO patterns
   - Authentication flows
   - Performance optimization

6. **web-layouts.md** (14KB) - NEW
   - CSS Grid patterns (Holy Grail, auto-fit, subgrid, asymmetric)
   - Flexbox patterns (navigation, sidebar, centered)
   - Container queries (size-aware responsive design)
   - Masonry layouts (CSS Grid, CSS Columns)
   - Sticky positioning patterns
   - Aspect ratio maintenance
   - Complex multi-level layouts
   - Responsive typography with clamp()
   - Print-friendly layouts
   - Z-index management

7. **performance-checklist.md** (9.3KB)
   - Core Web Vitals (LCP, FID, CLS)
   - Image optimization strategies
   - JavaScript and CSS optimization
   - Font loading optimization
   - Caching strategies
   - Network optimization
   - Performance monitoring
   - Performance budgets

### Validation Scripts (2 files)

8. **scripts/check-contrast.py** (7.5KB)
   - WCAG color contrast validator
   - Checks AA (4.5:1) and AAA (7:1) compliance
   - Supports hex, rgb, and named colors
   - JSON file input support
   - Large text mode for 18pt+

   **Usage:**
   ```bash
   python ~/.claude/skills/web-designer/scripts/check-contrast.py \
     --bg "#ffffff" --fg "#000000" --verbose
   ```

9. **scripts/validate-responsive.py** (12KB)
   - Responsive design validator
   - Checks viewport meta tag
   - Image accessibility (alt text, srcset, dimensions)
   - Touch target sizes (44x44px minimum)
   - Font sizes for readability
   - Media query coverage

   **Usage:**
   ```bash
   python ~/.claude/skills/web-designer/scripts/validate-responsive.py \
     --file index.html --verbose
   ```

---

## Key Features

### Web Design Expertise
- Visual hierarchy, spacing, typography, color theory
- Component design patterns and APIs
- Interaction design and animations
- Design systems and tokens
- Mobile-first responsive design

### Accessibility (WCAG 2.1)
- Visual accessibility (contrast, sizing, readability)
- Semantic HTML and proper hierarchies
- Keyboard navigation and focus management
- Screen reader support and ARIA
- Motor accessibility (touch targets)
- Cognitive accessibility (clarity, consistency)

### Next.js Expertise (App Router)
- Layout architecture and nested layouts
- Server Components vs Client Components
- Dynamic routing and static generation
- Image optimization (next/image)
- Font optimization (next/font)
- Data fetching patterns
- Loading states and Suspense
- Error boundaries
- Metadata and SEO
- Authentication patterns

### Web Layout Patterns
- CSS Grid (Holy Grail, auto-fit, subgrid)
- Flexbox (navigation, sidebars, centered)
- Container Queries (modern responsive)
- Masonry layouts
- Sticky positioning
- Aspect ratio maintenance
- Responsive typography
- Complex multi-level layouts

### Performance Optimization
- Core Web Vitals (LCP, FID, CLS)
- Image optimization and responsive images
- JavaScript and CSS optimization
- Font loading strategies
- Caching and CDN strategies
- Performance monitoring and budgets

---

## Installation

The skill is installed at: `~/.claude/skills/web-designer/`

To use with Claude Code:
1. Invoke the skill in conversation (Claude discovers it automatically)
2. Run validation scripts directly
3. Reference documentation files for guidance

---

## Usage Examples

### Ask Claude Design Questions

**Next.js & Layout:**
```
"How should I structure my Next.js app layout for a dashboard with sidebar?"
"Create a responsive Holy Grail layout with CSS Grid"
"Help me design a card grid that adapts to container sizes using container queries"
```

**Accessibility:**
```
"Check if my button colors pass WCAG AA contrast requirements"
"Help me design an accessible form with a multi-step stepper"
"Design an accessible dropdown menu with keyboard support"
```

**Performance:**
```
"Optimize my largest contentful paint - where should I start?"
"What's the best way to optimize images in my Next.js product gallery?"
"How can I improve my Core Web Vitals score?"
```

### Run Validation Scripts

**Check color contrast:**
```bash
python ~/.claude/skills/web-designer/scripts/check-contrast.py \
  --bg "#ffffff" --fg "#333333" --verbose
```

**Validate responsive design:**
```bash
python ~/.claude/skills/web-designer/scripts/validate-responsive.py \
  --file index.html --strict
```

---

## File Organization

```
~/.claude/skills/web-designer/
├── SKILL.md                           (expert prompt)
├── README.md                          (getting started)
├── scripts/
│   ├── check-contrast.py              (WCAG validator)
│   └── validate-responsive.py         (responsive checker)
└── references/
    ├── accessibility-wcag.md          (WCAG 2.1 guide)
    ├── design-patterns.md             (component patterns)
    ├── nextjs-patterns.md             (Next.js guide)
    ├── performance-checklist.md       (Core Web Vitals)
    └── web-layouts.md                 (CSS layout patterns)
```

---

## Design Principles

1. **Accessibility First** - WCAG 2.1 compliance for all designs
2. **Mobile-First** - Start with mobile, enhance for larger screens
3. **Performance Matters** - Optimize for Core Web Vitals
4. **Progressive Enhancement** - Basic functionality works everywhere
5. **Semantic HTML** - Use correct elements for meaning
6. **Inclusive Design** - Design for everyone (disabilities, devices, networks)
7. **Consistency** - Reuse patterns from design system
8. **Testing** - Verify with real users and tools

---

## Skills & Standards Covered

### Frameworks & Tools
- Next.js 15+ (App Router)
- React Server Components
- Tailwind CSS
- CSS Modules
- TypeScript

### Standards
- WCAG 2.1 (Levels A, AA, AAA)
- ARIA 1.2 Authoring Practices
- HTML5 Semantics
- Core Web Vitals
- OpenGraph & Structured Data

### Testing Tools
- axe DevTools
- Lighthouse
- WebAIM Contrast Checker
- WAVE
- NVDA / JAWS / VoiceOver

---

## Quick Reference

### Accessibility Checklist (10 points)
1. ✅ Viewport meta tag present
2. ✅ Text has sufficient color contrast (4.5:1)
3. ✅ Images have alt text
4. ✅ Form labels associated with inputs
5. ✅ All functionality available via keyboard
6. ✅ Focus visible on interactive elements
7. ✅ Heading hierarchy is logical (h1, h2, h3...)
8. ✅ Links describe their purpose
9. ✅ Error messages are clear and specific
10. ✅ HTML is semantic (not all divs)

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5 seconds
- **FID** (First Input Delay): < 100 milliseconds
- **CLS** (Cumulative Layout Shift): < 0.1

### Next.js Essentials
- Use Server Components by default
- Keep Client Components small
- Optimize images with next/image
- Optimize fonts with next/font
- Implement proper error boundaries
- Use Suspense for loading states
- Cache data appropriately

### Layout Patterns
- CSS Grid for structure
- Flexbox for alignment
- Container Queries for component-level responsiveness
- Aspect Ratio for proportions
- Sticky positioning for headers/sidebars

---

## Resources & References

### Official Documentation
- [WCAG 2.1 Specification](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [web.dev](https://web.dev/)

### Accessibility
- [WebAIM](https://webaim.org/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

### Performance
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

---

## Integration with Crystal Forge

This skill is complementary to the Crystal Forge project and can be used for:
- Designing the Crystal Forge UI and components
- Ensuring accessibility of the query builder interface
- Optimizing performance of the application
- Implementing responsive layouts
- Creating component patterns for the query builder

---

## Notes

- The skill is self-contained in `~/.claude/skills/web-designer/`
- All Python scripts are executable and require Python 3.6+
- Reference documents use Markdown for easy reading
- Examples are production-ready and can be copied directly
- Scripts support JSON configuration files for batch processing

---

## Future Enhancements

Potential additions:
- Component library examples (shadcn/ui, headless UI)
- Animation and interaction patterns
- Data visualization best practices
- E-commerce specific patterns
- Admin dashboard patterns
- Dark mode implementation guide
- Internationalization (i18n) patterns

---

## Created By

Claude Code (claude.ai/code)
Created: 2025-12-31

Skill Package: Web Designer Expert
Total Size: 116KB
Files: 9
Code Examples: 50+
Documentation: Complete
