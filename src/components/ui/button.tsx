import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.97] active:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg active:scale-[0.97]",
        outline: "border-2 border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/30 hover:shadow-sm active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.97]",
        ghost: "hover:bg-muted hover:text-foreground transition-colors active:bg-muted/80",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        accent: "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97]",
        glass: "backdrop-blur-2xl bg-gradient-to-br from-white/30 via-white/20 to-white/10 dark:from-white/20 dark:via-white/10 dark:to-white/5 border border-white/40 text-white hover:border-white/60 hover:from-white/40 hover:via-white/30 hover:to-white/20 hover:shadow-xl active:scale-[0.97]",
        "glass-secondary": "backdrop-blur-2xl bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/15 dark:via-white/10 dark:to-white/5 border border-white/30 text-white hover:border-white/50 hover:from-white/30 hover:via-white/25 hover:to-white/20 hover:shadow-lg active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base font-semibold",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
