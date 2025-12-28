"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative min-h-screen bg-background",
        className
      )}
      {...props}
    >
      {/* Aurora effect - hidden on mobile for performance */}
      <div className="hidden md:block fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,hsl(220,60%,15%)_0%,hsl(220,60%,15%)_7%,var(--transparent)_10%,var(--transparent)_12%,hsl(220,60%,15%)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
            [--aurora-dark:repeating-linear-gradient(100deg,hsl(220,70%,35%)_10%,hsl(220,80%,45%)_15%,hsl(230,70%,40%)_20%,hsl(220,75%,50%)_25%,hsl(210,80%,40%)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora-dark)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora-dark)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            absolute -inset-[10px] opacity-70 will-change-transform`,

            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_20%,var(--transparent)_70%)]`
          )}
        ></div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
