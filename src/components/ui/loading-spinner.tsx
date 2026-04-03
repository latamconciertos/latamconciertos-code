import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  message?: string;
}

const sizeConfig = {
  sm: { dot: "h-2 w-2", gap: "gap-1" },
  md: { dot: "h-3 w-3", gap: "gap-1.5" },
  lg: { dot: "h-4 w-4", gap: "gap-2" },
};

const LoaderDots = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const config = sizeConfig[size];
  
  return (
    <div className={cn("flex items-center justify-center", config.gap)}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("rounded-full bg-primary", config.dot)}
          initial={{ x: 0 }}
          animate={{
            x: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export const LoadingSpinner = ({ className, size = "md", message }: LoadingSpinnerProps) => {
  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center", className)}>
      <LoaderDots size={size} />
      {message && (
        <p className="mt-4 text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
};

export const LoadingSpinnerInline = ({ className, size = "sm", message }: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 min-h-[50vh]", className)}>
      <LoaderDots size={size} />
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

export const LoadingSpinnerMini = ({ className, size = "sm", message }: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-4", className)}>
      <LoaderDots size={size} />
      {message && (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
};
