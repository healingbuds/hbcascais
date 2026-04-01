import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ThemeSliderContextType {
  value: number;
  setValue: (v: number) => void;
  isDark: boolean;
  resolvedTheme: "dark" | "light";
  mode: "auto" | "manual";
  setMode: (m: "auto" | "manual") => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  toggleTheme: () => void;
}

const ThemeSliderContext = createContext<ThemeSliderContextType>({
  value: 85,
  setValue: () => {},
  isDark: false,
  resolvedTheme: "light",
  mode: "auto",
  setMode: () => {},
  reduceMotion: false,
  setReduceMotion: () => {},
  toggleTheme: () => {},
});

export const useThemeSlider = () => useContext(ThemeSliderContext);

export const useTheme = () => {
  const { value, setValue, resolvedTheme, toggleTheme } = useThemeSlider();
  return {
    theme: resolvedTheme,
    resolvedTheme,
    setTheme: (t: string) => setValue(t === "dark" ? 0 : 100),
    sliderValue: value,
    setSliderValue: setValue,
    toggleTheme,
  };
};

const STORAGE_KEY = "healing-buds-theme";
const REDUCE_MOTION_KEY = "healing-buds-reduce-motion";

export function ThemeSliderProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [reduceMotion, setReduceMotionState] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(REDUCE_MOTION_KEY);
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const setReduceMotion = useCallback((v: boolean) => {
    setReduceMotionState(v);
    localStorage.setItem(REDUCE_MOTION_KEY, String(v));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const setValue = useCallback((v: number) => {
    const dark = v < 50;
    setIsDark(dark);
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, []);

  // Apply dark class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Remove any inline style overrides from the old slider
    const root = document.documentElement;
    const props = [
      "--background", "--foreground", "--card", "--card-foreground",
      "--popover", "--popover-foreground", "--primary", "--primary-foreground",
      "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
      "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
      "--border", "--input", "--ring"
    ];
    props.forEach(p => root.style.removeProperty(p));
  }, [isDark]);

  const value = isDark ? 0 : 100;

  return (
    <ThemeSliderContext.Provider
      value={{
        value,
        setValue,
        isDark,
        resolvedTheme: isDark ? "dark" : "light",
        mode: "manual",
        setMode: () => {},
        reduceMotion,
        setReduceMotion,
        toggleTheme,
      }}
    >
      {children}
    </ThemeSliderContext.Provider>
  );
}

export function setAdminThemeDefault(preset: "light" | "dark" | "auto") {
  localStorage.setItem("healing-buds-theme-admin-default", preset);
}
