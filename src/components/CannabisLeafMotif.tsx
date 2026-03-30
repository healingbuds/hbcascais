import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Import the actual PNG motif images
import plantMotif1 from "@/assets/plant-motif-1.png";
import plantMotif2 from "@/assets/plant-motif-2.png";
import plantMotif3 from "@/assets/plant-motif-3.png";
import plantMotif4 from "@/assets/plant-motif-4.png";
import plantDecoration1 from "@/assets/plant-decoration-1.png";
import plantDecoration2 from "@/assets/plant-decoration-2.png";
import plantDecoration3 from "@/assets/plant-decoration-3.png";
import plantDecoration4 from "@/assets/plant-decoration-4.png";
import plantDecoration5 from "@/assets/plant-decoration-5.png";

interface CannabisLeafMotifProps {
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
  delay?: number;
}

// All available motif images
const motifImages = [
  plantMotif1,
  plantMotif2,
  plantMotif3,
  plantMotif4,
  plantDecoration1,
  plantDecoration2,
  plantDecoration3,
  plantDecoration4,
  plantDecoration5,
];

// Individual cannabis leaf using PNG
export const CannabisLeaf = ({ 
  className, 
  style,
  imageIndex = 0 
}: { 
  className?: string; 
  style?: React.CSSProperties;
  imageIndex?: number;
}) => (
  <img 
    src={motifImages[imageIndex % motifImages.length]}
    alt=""
    className={cn("pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
  />
);

// Animated wrapper for single leaf
export const AnimatedLeaf = ({ 
  className, 
  style, 
  delay = 0,
  imageIndex = 0
}: CannabisLeafMotifProps & { imageIndex?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1.2, delay }}
  >
    <CannabisLeaf className={className} style={style} imageIndex={imageIndex} />
  </motion.div>
);

// Preset scattered layout for sections
interface ScatteredMotifProps {
  variant?: 'default' | 'sparse' | 'dense';
  colorClass?: string;
}

export const ScatteredCannabisMotifs = ({ 
  variant = 'default',
}: ScatteredMotifProps) => {
  const opacityMap = {
    sparse: { main: 0.06, secondary: 0.04 },
    default: { main: 0.08, secondary: 0.06 },
    dense: { main: 0.12, secondary: 0.08 },
  };

  const opacity = opacityMap[variant];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Top left large leaf */}
      <motion.div
        className="absolute -top-8 -left-8"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <img 
          src={plantMotif1}
          alt=""
          className="w-48 h-auto rotate-[-25deg]"
          style={{ opacity: opacity.main }}
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Bottom left medium leaf */}
      <motion.div
        className="absolute bottom-16 left-12 sm:left-24"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        <img 
          src={plantDecoration2}
          alt=""
          className="w-32 h-auto rotate-[15deg]"
          style={{ opacity: opacity.secondary }}
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Center background large leaf */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.1 }}
      >
        <img 
          src={plantMotif2}
          alt=""
          className="w-64 h-auto rotate-[5deg]"
          style={{ opacity: 0.04 }}
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Right side medium leaf */}
      <motion.div
        className="absolute top-20 right-8 sm:right-16"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <img 
          src={plantDecoration3}
          alt=""
          className="w-36 h-auto rotate-[35deg]"
          style={{ opacity: opacity.main }}
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Bottom right leaf */}
      <motion.div
        className="absolute -bottom-4 right-4 sm:right-20"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        <img 
          src={plantDecoration1}
          alt=""
          className="w-40 h-auto rotate-[-10deg]"
          style={{ opacity: opacity.secondary }}
          aria-hidden="true"
        />
      </motion.div>
      
      {/* Additional scattered leaves for variety */}
      <motion.div
        className="absolute top-1/3 left-1/4 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.6 }}
      >
        <img 
          src={plantDecoration4}
          alt=""
          className="w-24 h-auto rotate-[45deg]"
          style={{ opacity: opacity.secondary * 0.8 }}
          aria-hidden="true"
        />
      </motion.div>
      
      <motion.div
        className="absolute bottom-1/4 right-1/3 hidden lg:block"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.7 }}
      >
        <img 
          src={plantDecoration5}
          alt=""
          className="w-28 h-auto rotate-[-20deg]"
          style={{ opacity: opacity.secondary * 0.7 }}
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
};

export default CannabisLeaf;
