/**
 * Animated Card Component
 * Provides scroll reveal and hover animations for cards
 */
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    delay?: number;
    duration?: number;
}

export const AnimatedCard = ({
    children,
    delay = 0,
    duration = 0.5,
    className,
    ...props
}: AnimatedCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1] // Custom easing for smooth feel
            }}
            whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * Animated Section Component
 * Provides fade-in animation for sections
 */
interface AnimatedSectionProps extends Omit<HTMLMotionProps<"section">, "children"> {
    children: ReactNode;
    delay?: number;
}

export const AnimatedSection = ({
    children,
    delay = 0,
    className,
    ...props
}: AnimatedSectionProps) => {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.section>
    );
};

/**
 * Stagger Container Component
 * Provides stagger animation for children elements
 */
interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    staggerDelay?: number;
}

export const StaggerContainer = ({
    children,
    staggerDelay = 0.1,
    className,
    ...props
}: StaggerContainerProps) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * Stagger Item Component
 * Used as child of StaggerContainer
 */
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
}

export const StaggerItem = ({
    children,
    className,
    ...props
}: StaggerItemProps) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: [0.25, 0.1, 0.25, 1]
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * Fade In Component
 * Simple fade-in animation
 */
interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export const FadeIn = ({
    children,
    delay = 0,
    direction = "up",
    className,
    ...props
}: FadeInProps) => {
    const directions = {
        up: { y: 20 },
        down: { y: -20 },
        left: { x: 20 },
        right: { x: -20 },
        none: {}
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};
