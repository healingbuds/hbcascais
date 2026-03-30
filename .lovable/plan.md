

## Continuous Theme Slider — Replacing Binary Light/Dark Toggle

### Concept

Replace the binary light/dark toggle with a **continuous slider** (0–100). The left end is full dark mode, the right end is a warm light mode. As the user slides toward light, the theme gradually:

- Lightens backgrounds and darkens text
- **Reduces blue channel / shifts hue warmer** (adding a slight amber/cream warmth for eye comfort)
- Transitions through a natural midpoint that feels like a comfortable "dusk" mode

The value is persisted in `localStorage` and applied via CSS custom properties set on `document.documentElement`.

### How It Works

Instead of toggling a `.dark` class, we set CSS variables dynamically via JavaScript based on the slider position. The slider interpolates between the dark palette and the light palette, with the light end skewing warmer (lower blue, higher warmth).

```text
0 ──────────── 50 ──────────── 100
DARK          DUSK           WARM LIGHT
cool teal    neutral sage    warm cream-sage
```

### Technical Approach

1. **New Context: `ThemeSliderContext`** — stores the slider value (0–100), persists to localStorage, and applies interpolated CSS variables to `:root` on every change. Replaces `next-themes` usage.

2. **Interpolation logic** — a utility function that takes the slider value and computes each CSS variable by interpolating between dark and light HSL values. On the lighter end (70–100), the hue shifts slightly warmer (reduce saturation on blue-greens, add warmth to backgrounds) and lightness increases.

3. **Updated `ThemeToggle`** — the icon-only variant becomes a small inline slider with Sun/Moon icons at each end. The button variant (used in mobile nav) becomes a horizontal slider row with labels.

4. **Updated `ThemeProvider`** — drops `next-themes` dependency; wraps children in the new `ThemeSliderContext`.

5. **CSS changes** — the `.dark { }` block in `theme.css` remains as a reference but is no longer toggled via class. Instead, the context sets every `--background`, `--foreground`, `--card`, etc. variable directly based on interpolation.

### Files

| File | Change |
|------|--------|
| `src/context/ThemeSliderContext.tsx` | **New** — context with slider value, localStorage persistence, CSS variable interpolation engine |
| `src/components/ThemeToggle.tsx` | Replace toggle buttons with a slider (Sun ← slider → Moon), keep cursor toggle separate |
| `src/components/ThemeProvider.tsx` | Remove `next-themes`, use `ThemeSliderContext` |
| `src/styles/theme.css` | Keep both palettes as reference; add transition on `*` for smooth color changes |
| `src/layout/Header.tsx` | No import changes needed (ThemeToggle API stays the same) |
| `src/layout/AdminLayout.tsx` | Same — no changes |
| `src/components/NavigationOverlay.tsx` | ThemeToggle button variant now renders slider row |

### Slider UI (icon variant — header)

```text
☀️ ═══════●══════ 🌙
```

A compact horizontal slider (~120px wide) with Sun on the left (warm light) and Moon on the right (dark). Uses the existing `Slider` component from `src/components/ui/slider.tsx`.

### Slider UI (button variant — mobile nav)

A full-width row: Sun icon, slider, Moon icon, with a label like "Ambiance" below.

### Warmth Logic

At slider positions 60–100 (lighter end):
- Background hue shifts from sage-green (150°) toward warm cream (40–45°)
- Background saturation drops slightly for a softer feel
- Blue-tinted borders get warmer (reduced blue saturation)
- Card backgrounds gain a slight warm tint

This creates a natural "warm reading mode" at the lightest setting.

