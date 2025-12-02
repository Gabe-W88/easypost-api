# 🚀 Quick Start Card - Next Agent

## Current State
```
Commit: 09542a3
File: apply.jsx (8,210 lines)
Media Queries: 12 (needs consolidation to 3)
Status: READY TO START
```

## Your Mission
Consolidate 12 duplicate media queries → 3 clean breakpoints, then enhance mobile visual design.

## Start Here (in order)
1. Read `AGENT_HANDOFF.md` (complete context) ⭐
2. Read `MOBILE_OPTIMIZATION_PLAN.md` (implementation steps)
3. Skim `MOBILE_OPTIMIZATION_REVIEW.md` (lessons learned)
4. Open `apply.jsx` line 5841 (first media query)
5. Begin Phase 1: Consolidation

## Phase 1: Consolidation (15 min)
**Goal:** Merge 12 media queries → 3 breakpoints
- 768px (Tablet/Mobile)
- 480px (Small Mobile)  
- 360px (Extra Small)

**Expected Result:** Remove ~230 lines of duplicates

## Quick Verification
```bash
# Before consolidation:
grep -n "@media (max-width:" apply.jsx | wc -l  # = 12

# After consolidation:
grep -n "@media (max-width:" apply.jsx | wc -l  # = 3
```

## DO NOT BREAK ❌
- validateField(allData) parameter
- Button layout (space-between)
- Form validation (green/red borders)
- Desktop spacing (16px gaps)
- Design token usage

## Success Criteria ✅
- 3 clean media queries
- ~230 lines removed
- No compilation errors
- Desktop unchanged
- Professional mobile appearance

## Time Budget
Total: 90 minutes (Consolidation: 15m, Enhancement: 75m)

## Need Help?
See `AGENT_HANDOFF.md` FAQ section

---
**Ready to start? Begin with Phase 1 in MOBILE_OPTIMIZATION_PLAN.md** 🎯
