import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide" | "scale" | "elegant" | "smooth" | "premium";
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] as const }
  },
  slide: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  },
  scale: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }
  },
  elegant: {
    initial: { opacity: 0, y: 16, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 1.01 },
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.4, 0.25, 1] as const,
      opacity: { duration: 0.25 },
      scale: { duration: 0.45 }
    } as Transition
  },
  smooth: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1] as const
    } as Transition
  },
  premium: {
    initial: { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -8, filter: "blur(2px)" },
    transition: { 
      duration: 0.45, 
      ease: [0.16, 1, 0.3, 1] as const,
      filter: { duration: 0.3 }
    } as Transition
  }
};

const PageTransition = ({ children, variant = "smooth" }: PageTransitionProps) => {
  const selectedVariant = variants[variant];
  
  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={selectedVariant.transition}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
