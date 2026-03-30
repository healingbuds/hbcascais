/**
 * MedicalLeafIcon - Branded cannabis leaf with medical cross
 * 
 * A clean, minimal SVG icon combining a cannabis leaf motif with a medical cross,
 * representing the medical cannabis dispensary brand.
 */

import { cn } from "@/lib/utils";

interface MedicalLeafIconProps {
  className?: string;
  size?: number;
}

export const MedicalLeafIcon = ({ className, size = 24 }: MedicalLeafIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
    aria-hidden="true"
  >
    {/* Cannabis leaf outline - simplified 3-leaf motif */}
    <path d="M12 2c0 4-2 6-2 8s2 4 2 6" />
    <path d="M8 6c2 2 4 2 4 4" />
    <path d="M16 6c-2 2-4 2-4 4" />
    <path d="M6 10c3 1 5 2 6 4" />
    <path d="M18 10c-3 1-5 2-6 4" />
    {/* Stem */}
    <path d="M12 16v6" />
    {/* Medical cross in center */}
    <path d="M10 11h4" strokeWidth="2" />
    <path d="M12 9v4" strokeWidth="2" />
  </svg>
);

export default MedicalLeafIcon;
