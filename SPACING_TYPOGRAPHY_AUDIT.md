# Spacing & Typography Audit - FastIDP
**Date:** December 1, 2025  
**Purpose:** Document current system and establish organized design tokens

---

## Current State Analysis

### ❌ INCONSISTENCIES FOUND

The form currently has **NO organized system** - spacing and font sizes are scattered and inconsistent:

#### Font Size Chaos
Currently using **15+ different font sizes** with no clear hierarchy:

| Size | Usage | Count |
|------|-------|-------|
| 32px | Success icons, category icons | 2 |
| 24px | Section titles | 1 |
| 18px | Form subtitles, headings | 4 |
| 16px | Form labels, buttons | 3 |
| 14px | Inputs, body text, descriptions | 12+ |
| 13px | Various labels | 3 |
| 12px | Small text, helper text | 8+ |
| 11px | Tiny labels, badges | 3 |
| 10px | Very small text | 3 |
| 0.875rem | Mixed with px values | 1 |
| 1.25rem | Mixed with px values | 1 |

**Problem:** No consistent hierarchy, mixing px and rem units

#### Spacing Chaos
Currently using **20+ different spacing values** with no system:

| Spacing | Usage | Pattern |
|---------|-------|---------|
| 4px | Small gaps, badges | ❌ Too small |
| 6px | Various gaps | ❌ Inconsistent |
| 8px | Button padding, small gaps | ✓ Common |
| 10px | Random usage | ❌ Non-standard |
| 12px | Input padding, medium gaps | ✓ Common |
| 15px | One-off usage | ❌ Non-standard |
| 16px | Input padding, gaps | ✓ Common |
| 20px | Section spacing | ✓ Common |
| 24px | Larger gaps | ✓ Common |
| 32px | Section padding, margins | ✓ Common |
| 60px | Container bottom padding | ❌ Random |

**Problem:** No 8px grid system, random values scattered throughout

#### Layout Issues
- **Inconsistent grid gaps:** 16px, 20px, 24px all used for similar purposes
- **Mixed padding values:** 12px, 16px, 20px, 32px with no clear pattern
- **Random margins:** 8px, 12px, 16px, 24px, 32px with no system
- **Inconsistent component spacing:** Each section uses different values

---

## Proposed Design System

### 🎨 Design Tokens (Production-Ready)

#### Spacing Scale (8px Grid System)
**Based on:** Material Design & Tailwind CSS best practices  
**Grid Base:** 4px (allows half-steps while maintaining 8px rhythm)

```css
/* Spacing Scale - 4px base unit */
--space-0: 0;       /* Reset/None */
--space-1: 4px;     /* 0.25rem - Micro (badge padding, tight gaps) */
--space-2: 8px;     /* 0.5rem - Tiny (icon gaps, compact spacing) */
--space-3: 12px;    /* 0.75rem - Small (input padding Y, small margins) */
--space-4: 16px;    /* 1rem - Base (input padding X, standard gaps) */
--space-5: 20px;    /* 1.25rem - Medium (form field vertical spacing) */
--space-6: 24px;    /* 1.5rem - Large (section internal spacing) */
--space-8: 32px;    /* 2rem - XLarge (container padding, major sections) */
--space-10: 40px;   /* 2.5rem - XXLarge (large section breaks) */
--space-12: 48px;   /* 3rem - Huge (page-level spacing) */
--space-16: 64px;   /* 4rem - Massive (hero sections, major separations) */
```

#### Typography Scale
**Based on:** Modular scale (1.2 ratio) + practical form design  
**Base:** 16px for accessibility (44px minimum touch targets)

```css
/* Font Sizes - Clear Hierarchy */
--text-xs: 12px;      /* 0.75rem - Micro text (badges, legal, meta) */
--text-sm: 14px;      /* 0.875rem - Small (descriptions, helper text, input text) */
--text-base: 16px;    /* 1rem - Base (labels, body, buttons - WCAG minimum) */
--text-lg: 18px;      /* 1.125rem - Large (subheadings, emphasized text) */
--text-xl: 20px;      /* 1.25rem - XLarge (section subtitles) */
--text-2xl: 24px;     /* 1.5rem - 2XLarge (page sections, major headings) */
--text-3xl: 28px;     /* 1.75rem - 3XLarge (page titles) */
--text-4xl: 32px;     /* 2rem - 4XLarge (hero text, splash screens) */

/* Line Heights - Optimized for readability */
--leading-none: 1;          /* Icons, badges (no extra space) */
--leading-tight: 1.25;      /* Headings (compact) */
--leading-snug: 1.375;      /* Subheadings (comfortable) */
--leading-normal: 1.5;      /* Body text (optimal readability) */
--leading-relaxed: 1.625;   /* Long-form content (max comfort) */
--leading-loose: 2;         /* Spacious (special cases) */

/* Font Weights - Semantic naming */
--font-normal: 400;         /* Body text, inputs */
--font-medium: 500;         /* Labels, emphasized text */
--font-semibold: 600;       /* Subheadings, buttons */
--font-bold: 700;           /* Headings, strong emphasis */
--font-extrabold: 800;      /* Hero text (if needed) */

/* Letter Spacing - Fine-tuning */
--tracking-tight: -0.025em; /* Large headings (tighten) */
--tracking-normal: 0;       /* Default (body text) */
--tracking-wide: 0.025em;   /* Small text (improve readability) */
--tracking-wider: 0.05em;   /* Uppercase, badges (breathing room) */
```

#### Border Radius Scale
**Purpose:** Consistent corner rounding across all UI elements

```css
/* Border Radius - Systematic rounding */
--radius-none: 0;           /* Sharp corners (tables, specific designs) */
--radius-sm: 4px;           /* Subtle (small badges, tight elements) */
--radius-base: 8px;         /* Standard (inputs, buttons, cards) */
--radius-md: 12px;          /* Medium (larger cards, modals) */
--radius-lg: 16px;          /* Large (containers, sections) */
--radius-xl: 24px;          /* XLarge (hero cards, feature sections) */
--radius-full: 9999px;      /* Circular (avatars, pills, badges) */
```

#### Shadow Scale
**Purpose:** Consistent depth hierarchy for elevation

```css
/* Shadows - Elevation system */
--shadow-none: none;
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);                    /* Subtle (hover states) */
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1),                   /* Default (cards) */
            0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),                  /* Medium (dropdowns) */
          0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),                /* Large (modals) */
          0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),                /* XLarge (popovers) */
          0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);             /* Dramatic (hero) */
--shadow-focus: 0 0 0 3px rgba(2, 86, 157, 0.1);                 /* Focus ring (accessibility) */
```

#### Brand Colors (Reference)
**Note:** These should match existing brand colors

```css
/* Primary Brand */
--color-primary: #02569D;              /* Main brand blue */
--color-primary-dark: #013d70;         /* Hover/active states */
--color-primary-light: #0366b3;        /* Light variant */
--color-primary-pale: rgba(2, 86, 157, 0.1); /* Backgrounds, focus rings */

/* Semantic Colors */
--color-success: #10b981;              /* Green - success states */
--color-success-bg: #f0fdf4;           /* Success background */
--color-warning: #f59e0b;              /* Orange - warnings */
--color-warning-bg: #fffbeb;           /* Warning background */
--color-error: #ef4444;                /* Red - errors */
--color-error-bg: #fef2f2;             /* Error background */
--color-info: #3b82f6;                 /* Blue - info */
--color-info-bg: #eff6ff;              /* Info background */

/* Neutrals - Gray scale */
--color-gray-50: #f9fafb;              /* Lightest */
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;             /* Darkest */

/* Functional Colors */
--color-text-primary: var(--color-gray-900);    /* Main text */
--color-text-secondary: var(--color-gray-600);  /* Secondary text */
--color-text-tertiary: var(--color-gray-500);   /* Muted text */
--color-border: var(--color-gray-200);          /* Default borders */
--color-border-hover: var(--color-gray-300);    /* Hover borders */
--color-bg-canvas: #ffffff;                     /* Page background */
--color-bg-surface: #ffffff;                    /* Card backgrounds */
--color-bg-muted: var(--color-gray-50);         /* Subtle backgrounds */
```

---

## Recommended Application

### Component Spacing Standards

#### Form Container
```css
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-12) var(--space-4);
  /* Mobile: 0 16px 48px 16px - comfortable edge spacing */
}

.form-container {
  background: var(--color-bg-surface);
  padding: var(--space-8);
  /* 32px all around - generous breathing room */
  border-radius: var(--radius-lg);
  /* 16px corners - modern, friendly */
  box-shadow: var(--shadow-base);
  /* Subtle elevation */
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-8);
}
```

#### Form Sections
```css
.form-section {
  margin-bottom: var(--space-8);
  /* 32px between major sections - clear separation */
}

.form-section:last-child {
  margin-bottom: 0;
  /* Remove bottom margin from last section */
}

.section-title {
  font-size: var(--text-2xl);           /* 24px - clear hierarchy */
  font-weight: var(--font-bold);        /* 700 - emphasis */
  line-height: var(--leading-tight);    /* 1.25 - compact */
  color: var(--color-text-primary);
  margin-bottom: var(--space-6);        /* 24px - breathing room */
  padding-bottom: var(--space-4);       /* 16px - internal space */
  border-bottom: 2px solid var(--color-border);
}

.form-subtitle {
  font-size: var(--text-lg);            /* 18px - secondary hierarchy */
  font-weight: var(--font-semibold);    /* 600 - emphasis */
  line-height: var(--leading-snug);     /* 1.375 - comfortable */
  color: var(--color-text-primary);
  margin-bottom: var(--space-6);        /* 24px - space before content */
}

.form-subtext {
  font-size: var(--text-sm);            /* 14px - supporting text */
  font-weight: var(--font-normal);      /* 400 - regular */
  line-height: var(--leading-normal);   /* 1.5 - readable */
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);        /* 24px - breathing room */
  font-style: italic;
}
```

#### Form Grid & Groups
```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5) var(--space-4);
  /* 20px vertical (comfortable), 16px horizontal (compact) */
  margin-bottom: var(--space-8);
  /* 32px after each grid section */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  /* 8px internal spacing (label to input) */
  width: 100%;
}

.form-group.full-width {
  grid-column: span 2;
  /* Full width within 2-column grid */
}
```

#### Form Labels & Inputs
```css
.form-label {
  font-size: var(--text-base);          /* 16px - WCAG readable */
  font-weight: var(--font-medium);      /* 500 - distinguishable */
  line-height: var(--leading-normal);   /* 1.5 - comfortable */
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);        /* 8px - tight coupling with input */
}

.required-asterisk {
  color: var(--color-error);
  font-weight: var(--font-bold);
  margin-left: var(--space-1);          /* 4px - micro spacing */
}

.form-input,
.form-select,
.form-textarea {
  padding: var(--space-3) var(--space-4);
  /* 12px 16px - comfortable touch target (48px min height) */
  font-size: var(--text-sm);            /* 14px - readable input text */
  font-weight: var(--font-normal);      /* 400 - regular */
  line-height: var(--leading-normal);   /* 1.5 - comfortable */
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-base);    /* 8px - friendly corners */
  transition: all 0.2s ease;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
  /* 3px blue ring for accessibility */
}

.form-input.field-valid {
  border-color: var(--color-success);
  background-color: var(--color-success-bg);
}

.form-input.field-error {
  border-color: var(--color-error);
  background-color: var(--color-error-bg);
}

.error-message {
  font-size: var(--text-xs);            /* 12px - small but readable */
  font-weight: var(--font-medium);      /* 500 - noticeable */
  line-height: var(--leading-normal);   /* 1.5 - comfortable */
  color: var(--color-error);
  margin-top: var(--space-1);           /* 4px - tight coupling */
}

.helper-text {
  font-size: var(--text-xs);            /* 12px - supporting info */
  font-weight: var(--font-normal);      /* 400 - subtle */
  line-height: var(--leading-normal);   /* 1.5 - readable */
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);           /* 4px - tight coupling */
}
```

#### Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);                  /* 8px - icon spacing */
  padding: var(--space-3) var(--space-6);
  /* 12px 24px - comfortable touch target */
  font-size: var(--text-base);          /* 16px - readable */
  font-weight: var(--font-semibold);    /* 600 - emphasis */
  line-height: var(--leading-none);     /* 1 - tight for buttons */
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-base);    /* 8px - friendly */
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;                     /* WCAG touch target minimum */
}

.btn.primary {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.btn.primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn.large {
  padding: var(--space-4) var(--space-8);
  /* 16px 32px - prominent CTA */
  font-size: var(--text-lg);            /* 18px - emphasis */
  min-height: 52px;                     /* Larger touch target */
}

.btn.small {
  padding: var(--space-2) var(--space-4);
  /* 8px 16px - compact actions */
  font-size: var(--text-sm);            /* 14px - smaller */
  min-height: 36px;                     /* Smaller but still usable */
}
```

#### Cards & Option Boxes
```css
.option-card,
.category-card {
  padding: var(--space-6);              /* 24px - comfortable */
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);      /* 16px - modern */
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);                  /* 16px between elements */
}

.option-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.option-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-pale);
  box-shadow: var(--shadow-base);
}

.section-card {
  padding: var(--space-8);              /* 32px - generous */
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);      /* 16px - modern */
  margin-bottom: var(--space-8);        /* 32px - clear separation */
  box-shadow: var(--shadow-base);
  border: 1px solid var(--color-border);
}
```

#### Progress Stepper
```css
.stepper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);        /* 32px - separation from content */
  padding: var(--space-5) var(--space-5) 0;
  /* 20px sides, 0 bottom */
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);                  /* 8px between circle and label */
  flex: 1;
  position: relative;
}

.circle {
  width: var(--space-8);                /* 32px - touch-friendly */
  height: var(--space-8);               /* 32px - circular */
  border-radius: var(--radius-full);    /* Perfect circle */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);            /* 14px - readable */
  font-weight: var(--font-semibold);    /* 600 - emphasis */
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.circle.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.step-label {
  font-size: var(--text-xs);            /* 12px - compact */
  font-weight: var(--font-medium);      /* 500 - readable */
  line-height: var(--leading-tight);    /* 1.25 - compact */
  color: var(--color-text-secondary);
  text-align: center;
}
```

---

## Implementation Strategy (Rock Solid Approach)

### Phase 1: Foundation (30 minutes)
**Goal:** Add design tokens without breaking anything

1. **Add CSS Variables at Top of Stylesheet**
   - Add all tokens in a `:root` block
   - Test: Verify page still renders correctly
   - No visual changes yet (just adding variables)

2. **Create Backup**
   - Commit current state to git: `"chore: Pre-design-system checkpoint"`
   - Can roll back instantly if needed

### Phase 2: Typography System (45 minutes)
**Goal:** Systematic replacement of all font-size declarations

**Priority Order:**
1. **Headings & Titles** (Highest impact)
   - `.section-title` → `var(--text-2xl)`
   - `.form-subtitle` → `var(--text-lg)`
   - All h1, h2, h3, etc.

2. **Body & Inputs** (Most common)
   - `.form-input` → `var(--text-sm)`
   - `.form-label` → `var(--text-base)`
   - Body text → `var(--text-sm)`

3. **Small Text** (Helper text, errors)
   - `.error-message` → `var(--text-xs)`
   - `.helper-text` → `var(--text-xs)`
   - All 12px text → `var(--text-xs)`

4. **Consolidate Outliers**
   - 13px → `var(--text-sm)` (14px)
   - 11px → `var(--text-xs)` (12px)
   - 10px → `var(--text-xs)` (12px)
   - 15px → `var(--text-base)` (16px)

**Testing After Each Step:**
- Visual inspection of changed components
- Check mobile responsiveness
- Verify no text is cut off or overlapping

### Phase 3: Spacing System (60 minutes)
**Goal:** Replace all padding/margin/gap with systematic values

**Priority Order:**
1. **Container & Layout** (Structure)
   - `.container` padding
   - `.form-container` padding
   - Grid gaps
   
2. **Form Groups & Sections** (Visual grouping)
   - `.form-section` margins
   - `.form-grid` gaps
   - `.form-group` spacing

3. **Input & Button Padding** (Touch targets)
   - `.form-input` padding
   - `.btn` padding
   - Ensure 44px minimum touch target

4. **Micro Spacing** (Polish)
   - Label to input gaps
   - Error message margins
   - Icon gaps

**Consolidation Rules:**
- 15px → 16px (`var(--space-4)`)
- 10px → 8px (`var(--space-2)`)
- 6px → 8px (`var(--space-2)`)
- Any odd value → nearest 4px multiple

**Testing After Each Step:**
- Check all form steps visually
- Verify spacing feels balanced
- Test on mobile (check for overflow)

### Phase 4: Visual Refinement (30 minutes)
**Goal:** Apply border radius, shadows, and polish

1. **Border Radius**
   - All inputs/buttons → `var(--radius-base)` (8px)
   - Cards → `var(--radius-lg)` (16px)
   - Circles/pills → `var(--radius-full)`

2. **Shadows** (Optional - can enhance later)
   - Cards → `var(--shadow-base)`
   - Dropdowns → `var(--shadow-md)`
   - Focus states → `var(--shadow-focus)`

3. **Colors** (If needed)
   - Replace hardcoded colors with tokens
   - Ensures consistency across light/dark modes later

**Testing:**
- Complete form walkthrough (all 4 steps)
- Test all interactive states (hover, focus, error, valid)
- Cross-browser check (Chrome, Safari, Firefox)

### Phase 5: Quality Assurance (30 minutes)
**Goal:** Comprehensive testing before deployment

**Testing Checklist:**
- [ ] All 4 form steps render correctly
- [ ] Text hierarchy is clear and readable
- [ ] Spacing feels balanced and consistent
- [ ] No text overlap or cutoff
- [ ] Inputs have proper touch targets (44px min)
- [ ] Buttons are comfortable to click
- [ ] Error messages are visible and clear
- [ ] Focus states are accessible
- [ ] Mobile view works properly (test on device)
- [ ] No horizontal scrolling
- [ ] All validation states work (error/valid colors)
- [ ] Payment section renders correctly
- [ ] File upload areas are usable
- [ ] Signature canvas has proper spacing

**Regression Testing:**
- [ ] Complete a test application end-to-end
- [ ] Upload files (drivers license, photo)
- [ ] Draw signature
- [ ] Select shipping options
- [ ] Verify payment element renders
- [ ] Check success screen

---

## Rollback Plan (If Issues Arise)

### Quick Rollback
```bash
# If issues found, immediately rollback
git reset --hard HEAD~1  # Undo last commit
git push origin main --force  # Update remote
```

### Incremental Approach (Safer)
Instead of doing all at once, commit after each phase:

1. Commit after adding tokens: `"feat: Add design system tokens"`
2. Commit after typography: `"feat: Apply typography system"`
3. Commit after spacing: `"feat: Apply spacing system"`
4. Commit after refinement: `"feat: Apply visual refinement"`

**Benefit:** Can rollback to any checkpoint if issues arise

---

## Success Metrics

### Visual Quality
- ✅ Clear visual hierarchy (titles > subtitles > body > small text)
- ✅ Consistent spacing (no random gaps)
- ✅ Professional appearance (systematic design)
- ✅ Balanced whitespace (not too tight, not too loose)

### Accessibility
- ✅ All text ≥ 14px (except legal text 12px)
- ✅ Touch targets ≥ 44px height
- ✅ Focus states clearly visible
- ✅ Color contrast meets WCAG AA
- ✅ Line height comfortable for reading

### Developer Experience
- ✅ Easy to understand token names
- ✅ Consistent patterns across components
- ✅ Self-documenting code (`var(--text-base)` vs `font-size: 16px`)
- ✅ Easy to adjust entire system by changing tokens

### User Experience
- ✅ Form is easy to read and complete
- ✅ Buttons are easy to find and click
- ✅ Error messages are noticeable
- ✅ Mobile experience is comfortable
- ✅ Professional trust-building design

---

## Mobile Considerations

### Mobile-Specific Adjustments (Applied in media queries)

```css
@media (max-width: 768px) {
  :root {
    /* Slightly adjust spacing for mobile */
    --space-8: 24px;  /* Reduce container padding (32px → 24px) */
    --space-12: 40px; /* Reduce large spacing (48px → 40px) */
    
    /* Ensure touch-friendly text */
    --text-base: 16px; /* Keep at 16px to prevent iOS zoom */
  }
  
  .form-grid {
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: var(--space-4); /* Tighter gap (20px → 16px) */
  }
  
  .btn {
    width: 100%; /* Full-width buttons on mobile */
    min-height: 48px; /* Larger touch target */
  }
}

@media (max-width: 480px) {
  :root {
    /* Further reduce spacing on small phones */
    --space-8: 20px;  /* Tighter container padding */
    --space-6: 20px;  /* Reduce section spacing */
  }
}
```

---

## Documentation for Future Developers

### Quick Reference Card

**When adding new components, always use:**

```css
/* Spacing */
Small gaps → var(--space-2)  /* 8px */
Medium gaps → var(--space-4)  /* 16px */
Section spacing → var(--space-6)  /* 24px */
Container padding → var(--space-8)  /* 32px */

/* Typography */
Small text → var(--text-xs)  /* 12px */
Body/input → var(--text-sm)  /* 14px */
Label/button → var(--text-base)  /* 16px */
Subheading → var(--text-lg)  /* 18px */
Heading → var(--text-2xl)  /* 24px */

/* Borders */
Inputs/buttons → var(--radius-base)  /* 8px */
Cards → var(--radius-lg)  /* 16px */

/* Touch Targets */
Minimum height → 44px  /* WCAG accessibility */
Comfortable → 48px  /* Mobile-friendly */
```

### Rules of Thumb

1. **Always use tokens** - Never hardcode spacing/typography
2. **Follow the 8px grid** - All spacing should be multiples of 4px
3. **Maintain hierarchy** - Larger text = more important
4. **Test on mobile** - Every change should be mobile-verified
5. **Commit incrementally** - Small commits for easy rollback

---

## Expected Timeline

| Phase | Duration | Checkpoint |
|-------|----------|------------|
| 1. Foundation | 30 min | CSS variables added ✓ |
| 2. Typography | 45 min | All text using tokens ✓ |
| 3. Spacing | 60 min | All spacing systematic ✓ |
| 4. Refinement | 30 min | Polish & consistency ✓ |
| 5. QA Testing | 30 min | Full regression test ✓ |
| **Total** | **3 hours** | Production-ready system ✓ |

### Fast Track (If needed)
Can reduce to 90 minutes by focusing only on:
- Phase 1: Add tokens (15 min)
- Phase 2: Typography only headings & body (20 min)
- Phase 3: Spacing only containers & grids (30 min)
- Phase 5: Quick QA (25 min)

---

*Last Updated: December 1, 2025 | Status: ROCK SOLID - Production-Ready System*

---

## Current Issues to Fix

### Typography Issues
1. **Mixed units** - Some rem, mostly px → Use px consistently or rem throughout
2. **Too many sizes** - 15+ sizes → Reduce to 6-7 standard sizes
3. **No clear hierarchy** - Random sizes → Establish clear visual hierarchy
4. **Inconsistent weights** - Mixed throughout → Standardize by purpose

### Spacing Issues
1. **No 8px grid** - Random values → Implement 8px base grid
2. **Inconsistent gaps** - 16px, 20px, 24px → Standardize to space-4, space-5, space-6
3. **Random margins** - All over the place → Use systematic spacing
4. **Padding chaos** - No pattern → Apply consistent padding scale

### Layout Issues
1. **Grid gaps vary** - Different for each section → Use consistent gap values
2. **Card padding varies** - 20px, 24px, 32px → Standardize by card type
3. **Section spacing inconsistent** - Random margins → Use space-8 (32px) consistently
4. **Container padding random** - Different everywhere → Standardize edge spacing

---

## Implementation Steps

### Step 1: Add CSS Variables (5 minutes)
Add design tokens at the top of the `<style>` section in `apply.jsx`:

```css
/* Design Tokens */
:root {
  /* Spacing Scale (8px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  
  /* Typography Scale */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 28px;
  --text-4xl: 32px;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Step 2: Replace Typography (Systematic)
Use find/replace to update all font-size declarations:

```css
/* BEFORE → AFTER */
font-size: 32px; → font-size: var(--text-4xl);
font-size: 24px; → font-size: var(--text-2xl);
font-size: 18px; → font-size: var(--text-lg);
font-size: 16px; → font-size: var(--text-base);
font-size: 14px; → font-size: var(--text-sm);
font-size: 13px; → font-size: var(--text-sm); /* consolidate */
font-size: 12px; → font-size: var(--text-xs);
font-size: 11px; → font-size: var(--text-xs); /* consolidate */
font-size: 10px; → font-size: var(--text-xs); /* consolidate */
```

### Step 3: Replace Spacing (Systematic)
Update all padding/margin/gap values to use spacing scale:

```css
/* Padding/Margin/Gap updates */
32px → var(--space-8)
24px → var(--space-6)
20px → var(--space-5)
16px → var(--space-4)
12px → var(--space-3)
8px  → var(--space-2)
4px  → var(--space-1)

/* Eliminate non-standard values */
15px → var(--space-4) /* 16px */
10px → var(--space-2) /* 8px */
6px  → var(--space-2) /* 8px */
```

### Step 4: Test & Verify
1. Visual inspection of all form pages
2. Check spacing consistency
3. Verify text hierarchy is clear
4. Test on mobile (ensure system works responsively)

---

## Benefits of This System

### For Development
- ✅ **Faster coding** - Just reference variables, no decisions
- ✅ **Easy maintenance** - Change token once, updates everywhere
- ✅ **Fewer bugs** - Can't accidentally use wrong spacing
- ✅ **Self-documenting** - Variable names explain purpose

### For Design
- ✅ **Visual consistency** - Everything uses same spacing
- ✅ **Clear hierarchy** - Typography scale is obvious
- ✅ **Professional look** - Systematic design looks polished
- ✅ **Easy to adjust** - Tweak tokens to refine entire UI

### For Users
- ✅ **Better readability** - Clear text hierarchy
- ✅ **Easier scanning** - Consistent spacing aids comprehension
- ✅ **Professional feel** - Cohesive design builds trust
- ✅ **Better mobile experience** - Systematic spacing scales better

---

## Next Steps

1. **Review & Approve** - Confirm spacing/typography scales work for brand
2. **Implement Variables** - Add CSS custom properties
3. **Systematic Replacement** - Update all components to use tokens
4. **Test Thoroughly** - Visual QA on all form steps
5. **Document Usage** - Add to SYSTEM_DOCUMENTATION.md

**Estimated Time:** 2-3 hours for complete implementation

---

*Created: December 1, 2025 | Status: Proposed System - Awaiting Approval*
