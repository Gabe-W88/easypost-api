# Mobile Optimization Plan - The Right Way
**Last Updated:** December 1, 2025  
**Status:** READY TO EXECUTE  
**Primary Document:** See AGENT_HANDOFF.md for complete context

## Current State (Post-Rollback)
- **Status:** Rolled back to commit `09542a3` (pre-mobile-optimization checkpoint)
- **File:** apply.jsx (8,210 lines)
- **Media Queries:** 12 duplicate/conflicting blocks
- **Git Branch:** main (1 commit ahead of origin)
- **Issues:** 
  - Weak visual hierarchy
  - Poor input styling
  - Insufficient touch targets
  - Duplicate/conflicting CSS
  - No systematic mobile design approach

---

## The Systematic Approach

### Phase 1: Consolidate & Clean (Foundation)
**Goal:** Remove technical debt, create clean base for improvements

**Tasks:**
1. Analyze all 12 media query blocks
2. Identify duplicates and conflicts
3. Consolidate into 3 clean breakpoints:
   - `@media (max-width: 768px)` - Tablet/Mobile
   - `@media (max-width: 480px)` - Small Mobile
   - `@media (max-width: 360px)` - Extra Small

**Expected Outcome:**
- Remove ~230 lines of duplicate code
- Single source of truth per breakpoint
- No conflicting rules

---

### Phase 2: Mobile Design Standards

**Typography Hierarchy:**
- Section Titles: 22px → 20px → 18px (700 weight, #1f2937)
- Subtitles: 19px → 17px → 16px (600 weight, #374151)
- Labels: 15px → 14px → 13px (600 weight, #1f2937)
- Input Text: 16px all breakpoints (prevents iOS zoom)

**Touch Targets:**
- Optimal: 56px (768px)
- Comfortable: 54px (480px)
- Minimum: 52px (360px)

**Visual Design:**
- Borders: 2px solid #d1d5db (emphasis)
- Shadows: 0 1px 2px (subtle depth)
- Border Radius: 8-12px
- Spacing: 24px → 20px → 16px gaps
- Colors: High contrast (#1f2937 for labels)

---

## Implementation Order

### Step 1: Consolidation (15 min)
Merge 12 media queries → 3 clean breakpoints

### Step 2: 768px Enhancement (30 min)
Typography, inputs, layout, interactive elements

### Step 3: 480px Scaling (15 min)
Proportional reduction while maintaining usability

### Step 4: 360px Optimization (10 min)
Compact but functional

### Step 5: Validation (15 min)
Error checks, visual inspection, testing

---

## Success Criteria
✅ 3 clean media queries (no duplicates)
✅ Clear typography hierarchy
✅ 52-56px touch targets
✅ Professional input styling
✅ No compilation errors
✅ Desktop functionality intact

---

**Estimated Time:** 90 minutes total

**Ready to Execute?** 
Next command: "Start Phase 1: Consolidation"
