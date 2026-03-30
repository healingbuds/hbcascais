import { cn } from "@/lib/utils";

interface BotanicalDecorationProps {
  variant?: 'leaf' | 'branch' | 'corner' | 'divider' | 'organic-wave' | 'cannabis-leaf' | 'cannabis-leaf-elegant' | 'cannabis-bud' | 'cannabis-line-art';
  className?: string;
}

// Reusable botanical decoration component for consistent brand visuals
// Replaces generic wave shapes with organic, cannabis-inspired motifs
export const BotanicalDecoration = ({ variant = 'leaf', className }: BotanicalDecorationProps) => {
  
  // Elegant continuous single-line cannabis leaf (matches footer reference)
  if (variant === 'cannabis-line-art') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 400 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flowing horizontal line from left */}
        <path 
          d="M0 120 Q30 118 60 115 Q90 112 110 105 Q130 98 145 90"
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Decorative curl/loop at start of leaf */}
        <path 
          d="M145 90 Q135 95 130 105 Q128 115 135 120 Q145 125 155 118 Q165 110 160 95 Q158 85 165 80"
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* 7-fingered cannabis leaf - continuous line */}
        <path 
          d="M165 80 Q155 75 145 60 Q142 55 140 48 Q138 42 142 38 Q145 35 148 38 Q152 42 155 50 Q158 58 168 65"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M168 65 Q160 55 155 40 Q152 30 155 22 Q158 16 162 20 Q166 26 170 38 Q174 50 180 58"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M180 58 Q175 45 178 28 Q180 18 185 12 Q190 8 194 14 Q198 22 196 38 Q194 52 195 60"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M195 60 Q195 42 200 22 Q203 10 208 5 Q213 2 218 8 Q223 16 222 32 Q220 48 225 58"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M225 58 Q228 45 235 28 Q240 18 248 14 Q254 10 258 18 Q260 28 255 45 Q250 58 252 65"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M252 65 Q258 50 268 38 Q275 28 282 26 Q288 24 290 32 Q290 42 282 55 Q275 65 272 72"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        <path 
          d="M272 72 Q280 62 290 55 Q298 50 305 52 Q310 56 308 64 Q304 72 295 78 Q285 84 278 85"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
        
        {/* Stem connecting to right flowing line */}
        <path 
          d="M278 85 Q285 92 295 100 Q310 110 330 115 Q360 120 400 120"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        />
      </svg>
    );
  }

  // Realistic cannabis bud/cola - dense flower structure
  if (variant === 'cannabis-leaf-elegant') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 120 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main stem */}
        <path 
          d="M60 175 L60 140" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Main bud body - dense rounded shape */}
        <ellipse cx="60" cy="85" rx="32" ry="55" stroke="currentColor" strokeWidth="1.2" fill="none" />
        
        {/* Inner structure - calyx clusters */}
        <path d="M45 60 Q40 55 42 48 Q48 52 50 58 Q46 56 45 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M75 60 Q80 55 78 48 Q72 52 70 58 Q74 56 75 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M40 80 Q34 75 36 68 Q42 72 44 78 Q40 76 40 80" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M80 80 Q86 75 84 68 Q78 72 76 78 Q80 76 80 80" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M42 100 Q36 96 38 90 Q44 93 46 98 Q42 96 42 100" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M78 100 Q84 96 82 90 Q76 93 74 98 Q78 96 78 100" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M50 115 Q45 112 47 106 Q52 109 54 114 Q50 112 50 115" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M70 115 Q75 112 73 106 Q68 109 66 114 Q70 112 70 115" stroke="currentColor" strokeWidth="0.8" fill="none" />
        
        {/* Center calyx details */}
        <path d="M55 70 Q52 65 54 58 Q58 62 60 68 Q56 66 55 70" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M65 70 Q68 65 66 58 Q62 62 60 68 Q64 66 65 70" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M55 90 Q52 85 54 78 Q58 82 60 88 Q56 86 55 90" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M65 90 Q68 85 66 78 Q62 82 60 88 Q64 86 65 90" stroke="currentColor" strokeWidth="0.8" fill="none" />
        
        {/* Pistils/hairs - orange hair detail lines */}
        <path d="M38 65 Q32 60 28 58" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M82 65 Q88 60 92 58" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M35 85 Q28 82 24 80" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M85 85 Q92 82 96 80" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M38 105 Q32 103 28 102" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M82 105 Q88 103 92 102" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M50 45 Q48 40 46 35" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M70 45 Q72 40 74 35" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <path d="M60 35 Q60 28 60 22" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        
        {/* Sugar leaves poking out */}
        <path d="M30 75 Q22 70 18 75 Q24 74 30 75" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M90 75 Q98 70 102 75 Q96 74 90 75" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M32 95 Q24 92 20 96 Q26 95 32 95" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M88 95 Q96 92 100 96 Q94 95 88 95" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M45 125 Q40 128 36 132 Q42 130 48 128" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M75 125 Q80 128 84 132 Q78 130 72 128" stroke="currentColor" strokeWidth="0.8" fill="none" />
        
        {/* Trichome texture suggestion - tiny circles */}
        <circle cx="48" cy="55" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="72" cy="55" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="42" cy="75" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="78" cy="75" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="45" cy="95" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="75" cy="95" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="55" cy="65" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="65" cy="65" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="60" cy="80" r="1" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }

  // Cannabis bud/cola line art
  if (variant === 'cannabis-bud') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 100 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main cola/bud outline */}
        <path 
          d="M50 135 L50 100
             Q48 95 45 88 Q42 80 40 72 Q38 62 40 52 Q42 42 48 35 Q50 30 50 25
             Q50 30 52 35 Q58 42 60 52 Q62 62 60 72 Q58 80 55 88 Q52 95 50 100"
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Calyx texture details - rounded bumps */}
        <path d="M45 75 Q42 70 44 65 Q48 68 45 75" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M55 75 Q58 70 56 65 Q52 68 55 75" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M48 60 Q45 55 47 50 Q50 53 48 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M52 60 Q55 55 53 50 Q50 53 52 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M50 45 Q48 40 50 35 Q52 40 50 45" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M43 85 Q40 82 42 78 Q45 80 43 85" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M57 85 Q60 82 58 78 Q55 80 57 85" stroke="currentColor" strokeWidth="0.8" fill="none" />
        
        {/* Pistil/hair details */}
        <path d="M44 68 Q40 65 38 62" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M56 68 Q60 65 62 62" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M46 55 Q42 52 40 50" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M54 55 Q58 52 60 50" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M48 42 Q45 38 43 36" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M52 42 Q55 38 57 36" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M50 28 Q48 24 47 22" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M50 28 Q52 24 53 22" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
        
        {/* Sugar leaf tips */}
        <path d="M38 78 Q32 75 28 80 Q34 78 38 78" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M62 78 Q68 75 72 80 Q66 78 62 78" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M42 55 Q36 50 32 52 Q38 52 42 55" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M58 55 Q64 50 68 52 Q62 52 58 55" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  // Organic wave - replaces generic wave decorations
  if (variant === 'organic-wave') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 400 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path 
          d="M0 40 C 50 20, 80 60, 130 35 S 180 55, 230 40 S 280 20, 330 45 S 370 30, 400 40" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M0 50 C 60 35, 90 65, 140 45 S 190 60, 240 48 S 290 35, 340 52 S 380 40, 400 50" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.2"
        />
        <path d="M80 38 Q 75 28, 85 25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        <path d="M200 42 Q 195 32, 205 28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        <path d="M320 48 Q 315 38, 325 35" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        <circle cx="85" cy="25" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="205" cy="28" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="325" cy="35" r="2" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }

  // Cannabis leaf silhouette - elegant brand motif
  if (variant === 'cannabis-leaf') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 115 L50 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path 
          d="M50 60 Q 50 35, 50 15 Q 48 25, 45 35 Q 48 40, 50 45 Q 52 40, 55 35 Q 52 25, 50 15" 
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"
        />
        <path d="M50 65 Q 35 55, 15 40 Q 28 52, 40 58 Q 32 48, 20 35" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
        <path d="M50 75 Q 40 68, 25 60 Q 35 65, 42 70" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        <path d="M50 65 Q 65 55, 85 40 Q 72 52, 60 58 Q 68 48, 80 35" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
        <path d="M50 75 Q 60 68, 75 60 Q 65 65, 58 70" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        <circle cx="50" cy="15" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="15" cy="40" r="1.5" fill="currentColor" opacity="0.2" />
        <circle cx="85" cy="40" r="1.5" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }

  if (variant === 'leaf') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main leaf stem */}
        <path 
          d="M60 100 Q 60 60, 60 20" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {/* Left leaf curves */}
        <path 
          d="M60 80 Q 30 70, 20 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M60 60 Q 35 50, 25 35" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M60 40 Q 40 32, 35 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Right leaf curves */}
        <path 
          d="M60 80 Q 90 70, 100 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M60 60 Q 85 50, 95 35" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M60 40 Q 80 32, 85 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Small decorative circles */}
        <circle cx="20" cy="50" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="100" cy="50" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="60" cy="15" r="4" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }

  if (variant === 'branch') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main branch */}
        <path 
          d="M10 40 Q 50 35, 100 40 T 190 40" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        {/* Small leaves along branch */}
        <path 
          d="M40 40 Q 35 25, 45 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M70 38 Q 75 55, 65 60" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M100 40 Q 95 25, 105 18" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M130 42 Q 135 58, 125 62" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M160 40 Q 155 25, 165 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        {/* Decorative dots */}
        <circle cx="45" cy="20" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="65" cy="60" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="105" cy="18" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="125" cy="62" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="165" cy="20" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }

  if (variant === 'corner') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corner curve */}
        <path 
          d="M10 90 Q 10 50, 50 50 T 90 10" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        {/* Small leaf accents */}
        <path 
          d="M25 70 Q 15 60, 20 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M50 50 Q 55 40, 65 42" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M70 30 Q 80 25, 85 15" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Dots */}
        <circle cx="20" cy="50" r="3" fill="currentColor" opacity="0.25" />
        <circle cx="65" cy="42" r="2" fill="currentColor" opacity="0.25" />
        <circle cx="85" cy="15" r="2" fill="currentColor" opacity="0.25" />
      </svg>
    );
  }

  // Divider variant
  return (
    <svg 
      className={cn("text-primary", className)}
      viewBox="0 0 300 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central leaf */}
      <path 
        d="M150 35 Q 150 20, 150 5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path 
        d="M150 25 Q 135 18, 130 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path 
        d="M150 25 Q 165 18, 170 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* Lines extending outward */}
      <path 
        d="M120 20 L 30 20" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
      <path 
        d="M180 20 L 270 20" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
      {/* End dots */}
      <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="270" cy="20" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="150" cy="5" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
};

export default BotanicalDecoration;
