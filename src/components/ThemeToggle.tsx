import { Moon, Sun, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCursor } from "@/context/CursorContext";
import { useThemeSlider } from "@/context/ThemeSliderContext";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
  isDark?: boolean;
}

const ThemeToggle = ({ className, variant = "icon" }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useThemeSlider();
  const { cursorEnabled, toggleCursor } = useCursor();

  if (variant === "button") {
    return (
      <div className="flex flex-col gap-3 px-4 py-3">
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-2 w-full px-4 py-4 text-left text-sm transition-colors rounded-xl touch-manipulation min-h-[48px]",
            "hover:bg-white/10 active:bg-white/20 text-white/80 hover:text-white"
          )}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-300" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span>{isDark ? "Switch to Light" : "Switch to Dark"}</span>
        </button>
        <button
          type="button"
          onClick={toggleCursor}
          className={cn(
            "flex items-center gap-2 w-full px-4 py-4 text-left text-sm transition-colors rounded-xl touch-manipulation min-h-[48px]",
            "hover:bg-white/10 active:bg-white/20 text-white/80 hover:text-white"
          )}
        >
          <MousePointer2 className={cn("w-5 h-5", !cursorEnabled && "opacity-50")} />
          <span>{cursorEnabled ? "Custom Cursor On" : "Custom Cursor Off"}</span>
        </button>
      </div>
    );
  }

  // Icon variant — simple toggle button for header
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center",
          "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-amber-300" />
        ) : (
          <Moon className="w-4.5 h-4.5" />
        )}
      </button>
      <button
        type="button"
        onClick={toggleCursor}
        className={cn(
          "p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center",
          "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20",
          !cursorEnabled && "opacity-50",
        )}
        aria-label="Toggle custom cursor"
      >
        <MousePointer2 className="w-4.5 h-4.5" />
      </button>
    </div>
  );
};

export default ThemeToggle;
