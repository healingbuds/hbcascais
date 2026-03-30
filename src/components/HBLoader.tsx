/**
 * HBLoader Component
 * 
 * Branded loading spinner using the Healing Buds icon.
 * Features a subtle pulse and rotation animation.
 */

import hbIcon from "@/assets/hb-icon.png";
import { cn } from "@/lib/utils";

interface HBLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: { icon: 24, container: "w-6 h-6" },
  md: { icon: 40, container: "w-10 h-10" },
  lg: { icon: 56, container: "w-14 h-14" },
  xl: { icon: 80, container: "w-20 h-20" },
};

const HBLoader = ({ size = "md", className, text }: HBLoaderProps) => {
  const sizeConfig = sizeMap[size];
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative", sizeConfig.container)}>
        {/* Glow ring */}
        <div 
          className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
          style={{ animationDuration: "2s" }}
        />
        
        {/* Rotating outer ring */}
        <div 
          className="absolute inset-[-4px] rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        
        {/* Icon with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={hbIcon}
            alt="Loading"
            width={sizeConfig.icon * 0.7}
            height={sizeConfig.icon * 0.7}
            className="object-contain animate-pulse"
            style={{ 
              width: sizeConfig.icon * 0.7, 
              height: sizeConfig.icon * 0.7,
              animationDuration: "1.5s"
            }}
          />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default HBLoader;
