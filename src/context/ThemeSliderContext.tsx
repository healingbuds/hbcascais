import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ThemeSliderContextType {
  value: number; // 0 (dark) to 100 (warm light)
  setValue: (v: number) => void;
  isDark: boolean; // convenience: value < 50
  resolvedTheme: "dark" | "light"; // compat with old useTheme consumers
}

const ThemeSliderContext = createContext<ThemeSliderContextType>({
  value: 25,
  setValue: () => {},
  isDark: true,
  resolvedTheme: "dark",
});

export const useThemeSlider = () => useContext(ThemeSliderContext);

// Compact compatibility hook so existing `useTheme()` call-sites keep working
export const useTheme = () => {
  const { value, setValue, resolvedTheme } = useThemeSlider();
  return {
    theme: resolvedTheme,
    resolvedTheme,
    setTheme: (t: string) => setValue(t === "dark" ? 0 : 100),
    // extra
    sliderValue: value,
    setSliderValue: setValue,
  };
};

const STORAGE_KEY = "healing-buds-theme-slider";

// ── HSL triplet helpers ──
type HSL = [number, number, number]; // h, s%, l%

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpHSL(dark: HSL, light: HSL, t: number): HSL {
  return [
    lerp(dark[0], light[0], t),
    lerp(dark[1], light[1], t),
    lerp(dark[2], light[2], t),
  ];
}

function hslString([h, s, l]: HSL) {
  return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

// ── Palette endpoints ──
// Index: [darkHSL, lightHSL]
// Light end gets a warmth shift applied on top (handled in applyTheme)

const PALETTE: Record<string, [HSL, HSL]> = {
  "--background":        [[180,  8,  7], [150, 12, 97]],
  "--foreground":        [[150,  8, 95], [172, 32, 20]],
  "--card":              [[175,  6, 11], [155, 10, 99]],
  "--card-foreground":   [[150,  8, 94], [172, 32, 20]],
  "--popover":           [[175,  6, 12], [155, 10, 99]],
  "--popover-foreground":[[150,  8, 94], [172, 32, 20]],
  "--primary":           [[168, 38, 45], [175, 42, 35]],
  "--primary-foreground":[[0,   0, 100], [0,   0, 98]],
  "--secondary":         [[175,  8, 18], [178, 48, 33]],
  "--secondary-foreground":[[150,10, 90], [0,   0, 98]],
  "--muted":             [[175,  6, 14], [160, 14, 93]],
  "--muted-foreground":  [[165, 10, 60], [165, 12, 42]],
  "--accent":            [[168, 20, 18], [165, 35, 92]],
  "--accent-foreground": [[165, 30, 75], [176, 39, 17]],
  "--destructive":       [[18,  60, 50], [15,  65, 55]],
  "--destructive-foreground":[[0,0,100], [0,   0, 100]],
  "--border":            [[170,  8, 20], [165, 18, 86]],
  "--input":             [[175,  6, 14], [165, 16, 95]],
  "--ring":              [[168, 38, 45], [172, 42, 45]],
};

function applyTheme(val: number) {
  const t = val / 100; // 0 = dark, 1 = light
  const root = document.documentElement;

  // Warmth factor: above 60% slider, shift hues warmer & reduce blue-green saturation
  const warmthFactor = Math.max(0, (t - 0.6) / 0.4); // 0 at ≤60, 1 at 100

  for (const [prop, [dark, light]] of Object.entries(PALETTE)) {
    const [h, s, l] = interpHSL(dark, light, t);

    // Apply warmth: shift hue toward warm cream (reduce hue toward ~45° for backgrounds)
    let finalH = h;
    let finalS = s;
    if (warmthFactor > 0 && (prop.includes("background") || prop.includes("card") || prop.includes("muted") || prop.includes("input") || prop.includes("popover"))) {
      // Only shift background-ish properties
      if (warmthFactor > 0 && l > 50) {
        finalH = lerp(h, Math.min(h, 42), warmthFactor * 0.6);
        finalS = lerp(s, Math.max(s * 0.5, 6), warmthFactor * 0.5);
      }
    }

    root.style.setProperty(prop, hslString([finalH, finalS, l]));
  }

  // Toggle .dark class for components that rely on it (sonner, etc.)
  if (t < 0.5) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeSliderProvider({ children }: { children: ReactNode }) {
  const [value, setValueState] = useState(() => {
    if (typeof window === "undefined") return 25;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? Number(stored) : 25; // default dark-ish
  });

  const setValue = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setValueState(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  // Apply on mount and on change
  useEffect(() => {
    applyTheme(value);
  }, [value]);

  const isDark = value < 50;

  return (
    <ThemeSliderContext.Provider
      value={{ value, setValue, isDark, resolvedTheme: isDark ? "dark" : "light" }}
    >
      {children}
    </ThemeSliderContext.Provider>
  );
}
