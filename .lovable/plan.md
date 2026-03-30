

## Fix Cart UX: Toast Overlap + Cart Discoverability

### Problems
1. **Toast covers cart button** — "Added to cart" toast appears bottom-right, overlapping the floating cart button at `bottom-6 right-6`
2. **Cart hard to find** — floating button blends in, no persistent header cart icon on shop pages

### Solution

#### 1. Move toast position to top-right
**File: `src/components/ui/sonner.tsx`**
- Add `position="top-right"` to the Sonner component so toasts no longer overlap the floating cart button

#### 2. Improve floating cart button visibility
**File: `src/components/shop/FloatingCartButton.tsx`**
- Add a subtle pulse animation when items are in the cart (attracts attention)
- Increase size slightly and add a stronger shadow for better visibility
- On mobile: position it above the bottom actions bar (`bottom-20` instead of `bottom-6`) so it doesn't get hidden

#### 3. Add cart icon to shop header
**File: `src/layout/Header.tsx`**
- When on a `/shop` route, render the `CartButton` component in the header bar (desktop and mobile) for persistent cart access
- This gives users a second, always-visible way to open the cart

#### 4. Make "Added to cart" toast actionable
**File: `src/components/shop/ProductCard.tsx`**
- Replace the plain toast with one that includes a "View Cart" action button, so users can jump straight to their cart after adding an item

### Files changed
1. `src/components/ui/sonner.tsx` — add `position="top-right"`
2. `src/components/shop/FloatingCartButton.tsx` — pulse animation, mobile positioning
3. `src/layout/Header.tsx` — add CartButton on shop routes
4. `src/components/shop/ProductCard.tsx` — add "View Cart" action to toast

