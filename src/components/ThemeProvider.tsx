import { ReactNode } from "react";
import { ThemeSliderProvider } from "@/context/ThemeSliderContext";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeSliderProvider>
      {children}
    </ThemeSliderProvider>
  );
}
