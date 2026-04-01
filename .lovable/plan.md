

# Mobile Responsiveness & Theme Audit - Findings and Fixes

## Test Results Summary

### 375px (Mobile) - All Pages
- **Homepage**: Clean layout, hero text readable, trust badges stack properly, CTAs visible, footer columns stack correctly. Mobile bottom actions bar renders well.
- **Shop/Strains**: Single column product grid, search + filters stack vertically, floating cart button positioned well.
- **Auth/Login**: Form centered, fields full-width, readable labels. Good spacing.
- **About**: Hero and content sections flow well, proper text wrapping.
- **Footer**: Two-column layout for Patient/Support links, Legal section below. Clean.

### 768px (Tablet) - All Pages
- **Homepage**: Hero fills viewport, trust badges in single row, CTAs side-by-side. Hamburger menu still visible (good - `xl:flex` breakpoint at 1280px).
- **Shop**: 2-column product grid, filters and search inline. Works well.

### 1280px (Desktop)
- **BUG: Nav link clipping** - "Research" is truncated to "rch" at exactly 1280px. The `overflow-hidden` on the nav container combined with logo + 5 nav links + language switcher + theme toggle + eligibility CTA + login button causes the first link to be clipped.
- **Shop**: 2-column grid with all terpene filters visible in a single row. Clean.
- **Auth**: Form centered in card, good proportions.

## Issues Found

### Issue 1: Navigation Overflow at 1280px (Critical)
The desktop nav (`NavigationMenu.tsx` line 32) has `overflow-hidden` which clips the "Research" link. At exactly 1280px (`xl` breakpoint), the combined width of logo + nav + right actions exceeds available space.

**Fix**: Remove `overflow-hidden` from the nav, and reduce the `xl` breakpoint threshold or reduce padding/gaps. Alternatively, switch `xl:flex` to a higher breakpoint like `2xl` and keep the hamburger menu until ~1440px, OR reduce nav item padding from `px-3.5` to `px-2.5` at the `xl` breakpoint.

**Recommended approach**: 
- Keep `xl:flex` (1280px) as the desktop breakpoint
- Remove `overflow-hidden` from NavigationMenu
- Reduce nav link padding from `px-3.5` to `px-2.5 xl:px-3` 
- Reduce gap between right-side action buttons from `gap-2` to `gap-1.5`

### Issue 2: Theme Contrast Review
The current light/dark theme uses sage-teal tones throughout. Both modes appear to have adequate contrast:
- Light mode: Dark teal text on sage-cream backgrounds
- Dark mode: Off-white text on warm charcoal with sage undertones
- The theme toggle slider in the header works but is subtle (moon/sun icons flanking a small slider)

No contrast issues detected in the current palette. The user mentioned "colour change is too big" - this likely refers to the theme toggle slider being visually prominent. No changes needed to the color values themselves.

## Implementation Steps

### Step 1: Fix nav clipping at 1280px
- In `NavigationMenu.tsx`: Remove `overflow-hidden`, reduce `gap-1.5` to `gap-1`
- Reduce nav item `px-3.5` to `px-2.5` at xl, scaling to `px-3.5` at 2xl
- In `Header.tsx` line 202: Reduce right actions `gap-2` to `gap-1.5`

### Step 2: Verify fix
- Retest at 1280px to confirm "Research" is fully visible
- Confirm no overflow/scrollbar appears

### Technical Details

Files to modify:
1. `src/components/NavigationMenu.tsx` - Line 32: remove `overflow-hidden`, reduce gap; Line 42: reduce padding
2. `src/layout/Header.tsx` - Line 202: reduce right-side gap

