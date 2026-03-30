import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ThemeSliderContextType {
  value: number; // 0 (dark) to 100 (warm light)
  setValue: (v: number) => void;
  isDark: boolean;
  resolvedTheme: "dark" | "light";
  mode: "auto" | "manual";
  setMode: (m: "auto" | "manual") => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const ThemeSliderContext = createContext<ThemeSliderContextType>({
  value: 85,
  setValue: () => {},
  isDark: false,
  resolvedTheme: "light",
  mode: "auto",
  setMode: () => {},
});

export const useThemeSlider = () => useContext(ThemeSliderContext);

// Compat hook for existing useTheme() consumers
export const useTheme = () => {
  const { value, setValue, resolvedTheme } = useThemeSlider();
  return {
    theme: resolvedTheme,
    resolvedTheme,
    setTheme: (t: string) => setValue(t === "dark" ? 0 : 100),
    sliderValue: value,
    setSliderValue: setValue,
  };
};

const STORAGE_KEY = "healing-buds-theme-slider";
const MODE_KEY = "healing-buds-theme-mode"; // "auto" | "manual"
const ADMIN_DEFAULT_KEY = "healing-buds-theme-admin-default"; // "light" | "dark" | "auto"

// ── HSL helpers ──
type HSL = [number, number, number];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpHSL(dark: HSL, light: HSL, t: number): HSL {
  return [lerp(dark[0], light[0], t), lerp(dark[1], light[1], t), lerp(dark[2], light[2], t)];
}

function hslString([h, s, l]: HSL) {
  return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

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
  const t = val / 100;
  const root = document.documentElement;
  const warmthFactor = Math.max(0, (t - 0.6) / 0.4);

  for (const [prop, [dark, light]] of Object.entries(PALETTE)) {
    const [h, s, l] = interpHSL(dark, light, t);
    let finalH = h;
    let finalS = s;

    if (warmthFactor > 0 && (prop.includes("background") || prop.includes("card") || prop.includes("muted") || prop.includes("input") || prop.includes("popover"))) {
      if (l > 50) {
        finalH = lerp(h, Math.min(h, 42), warmthFactor * 0.6);
        finalS = lerp(s, Math.max(s * 0.5, 6), warmthFactor * 0.5);
      }
    }

    root.style.setProperty(prop, hslString([finalH, finalS, l]));
  }

  if (t < 0.5) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Determine initial slider value based on system preference and admin default */
function getInitialValue(): number {
  // If user has manually set a value, use it
  const stored = localStorage.getItem(STORAGE_KEY);
  const storedMode = localStorage.getItem(MODE_KEY);
  if (stored !== null && storedMode === "manual") {
    return Number(stored);
  }

  // Auto mode: check admin default first, then system preference
  const adminDefault = localStorage.getItem(ADMIN_DEFAULT_KEY) || "auto";

  if (adminDefault === "light") return 85;
  if (adminDefault === "dark") return 15;

  // "auto" — use system preference
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? 15 : 85;
  }
  return 85; // fallback: light
}

export function ThemeSliderProvider({ children }: { children: ReactNode }) {
  const [value, setValueState] = useState(getInitialValue);
  const [mode, setModeState] = useState<"auto" | "manual">(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem(MODE_KEY) as "auto" | "manual") || "auto";
  });

  const setValue = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setValueState(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
    // When user manually moves the slider, switch to manual mode
    setModeState("manual");
    localStorage.setItem(MODE_KEY, "manual");
  }, []);

  const setMode = useCallback((m: "auto" | "manual") => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
    if (m === "auto") {
      // Re-derive from system preference
      localStorage.removeItem(STORAGE_KEY);
      const adminDefault = localStorage.getItem(ADMIN_DEFAULT_KEY) || "auto";
      let autoVal = 85;
      if (adminDefault === "dark") autoVal = 15;
      else if (adminDefault === "light") autoVal = 85;
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) autoVal = 15;
      setValueState(autoVal);
    }
  }, []);

  // Listen for system theme changes in auto mode
  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const adminDefault = localStorage.getItem(ADMIN_DEFAULT_KEY) || "auto";
      if (adminDefault === "auto") {
        setValueState(e.matches ? 15 : 85);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  useEffect(() => {
    applyTheme(value);
  }, [value]);

  const isDark = value < 50;

  return (
    <ThemeSliderContext.Provider
      value={{ value, setValue, isDark, resolvedTheme: isDark ? "dark" : "light", mode, setMode }}
    >
      {children}
    </ThemeSliderContext.Provider>
  );
}

/** Admin helper to set the site-wide default theme */
export function setAdminThemeDefault(preset: "light" | "dark" | "auto") {
  localStorage.setItem(ADMIN_DEFAULT_KEY, preset);
}
