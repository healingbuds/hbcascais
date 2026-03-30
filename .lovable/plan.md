

## Fix: Toast Still Appearing Bottom-Right Over Cart

The "Added to cart" toast uses the **shadcn/radix toast** system, not Sonner — so the Sonner `position="top-right"` change had no effect on it.

### Fix

**File: `src/components/ui/toast.tsx`** — Change the `ToastViewport` position from bottom-right to top-right:

- Replace `sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col` with `sm:top-0 sm:right-0 sm:flex-col-reverse`
- This moves all shadcn toasts (including "Added to cart") to the top-right corner, away from the floating cart button

### Files changed
1. `src/components/ui/toast.tsx` — viewport position fix (single line change)

