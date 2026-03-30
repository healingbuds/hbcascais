import { Moon, Sun, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCursor } from "@/context/CursorContext";
import { useThemeSlider } from "@/context/ThemeSliderContext";
import { Slider } from "@/components/ui/slider";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
  isDark?: boolean;
}

const ThemeToggle = ({ className, variant = "icon" }: ThemeToggleProps) => {
  const { value, setValue } = useThemeSlider();
  const { cursorEnabled, toggleCursor } = useCursor();

  if (variant === "button") {
    return (
      <div className="flex flex-col gap-3 px-4 py-3">
        {/* Ambiance slider */}
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-white/50">
            Ambiance
          </span>
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-white/60 flex-shrink-0" />
            <Slider
              value={[value]}
              onValueChange={([v]) => setValue(v)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <Sun className="w-4 h-4 text-amber-300/80 flex-shrink-0" />
          </div>
        </div>
        {/* Cursor toggle */}
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

  // Icon variant — compact slider for header
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-2 bg-white/5 rounded-full px-2.5 py-1.5">
        <Moon className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
        <Slider
          value={[value]}
          onValueChange={([v]) => setValue(v)}
          min={0}
          max={100}
          step={1}
          className="w-[90px]"
        />
        <Sun className="w-3.5 h-3.5 text-amber-300/70 flex-shrink-0" />
      </div>
      <button
        type="button"
        onClick={toggleCursor}
        className={cn(
          "p-2.5 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center",
          "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20",
          !cursorEnabled && "opacity-50",
          className
        )}
        aria-label="Toggle custom cursor"
      >
        <MousePointer2 className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ThemeToggle;
