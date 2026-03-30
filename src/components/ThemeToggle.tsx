import { Moon, Sun, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCursor } from "@/context/CursorContext";
import { useThemeSlider } from "@/context/ThemeSliderContext";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
  isDark?: boolean;
}

/** A mini slider styled for the nav bar — higher contrast than the default Slider */
const AmbianceSlider = ({ value, onValueChange, className }: {
  value: number;
  onValueChange: (v: number) => void;
  className?: string;
}) => (
  <SliderPrimitive.Root
    value={[value]}
    onValueChange={([v]) => onValueChange(v)}
    min={0}
    max={100}
    step={1}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-indigo-400/80 to-amber-300/80" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white shadow-md ring-0 outline-none cursor-grab active:cursor-grabbing active:scale-110 transition-transform" />
  </SliderPrimitive.Root>
);

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
            <AmbianceSlider value={value} onValueChange={setValue} className="flex-1" />
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
      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-3 py-2">
        <Moon className="w-3.5 h-3.5 text-indigo-300/70 flex-shrink-0" />
        <AmbianceSlider value={value} onValueChange={setValue} className="w-[100px]" />
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
