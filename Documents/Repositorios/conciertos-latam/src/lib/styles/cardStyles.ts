/**
 * Premium Card Styles System
 * Reusable card styling utilities for consistent depth and animations
 */

export const cardStyles = {
    // Base card with smooth transitions
    base: "rounded-xl bg-card overflow-hidden transition-all duration-300",

    // Elevated card with dynamic shadows
    elevated: "shadow-md hover:shadow-2xl hover:shadow-primary/10",

    // Interactive card with lift effect
    interactive: "hover:-translate-y-2 cursor-pointer",

    // Subtle glow effect on hover
    glow: "hover:ring-2 hover:ring-primary/20",

    // Gradient overlay for depth
    gradient: "relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",

    // Premium combination (most common use)
    premium: "rounded-xl bg-card overflow-hidden transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:ring-2 hover:ring-primary/20",

    // Image container with zoom effect
    imageContainer: "relative overflow-hidden",
    imageZoom: "transition-transform duration-700 hover:scale-110",

    // Content padding variations
    paddingCompact: "p-3",
    padding: "p-4",
    paddingLoose: "p-6",
};

/**
 * Combine card styles helper
 * @param styles - Array of style strings to combine
 * @returns Combined className string
 */
export const combineCardStyles = (...styles: string[]) => {
    return styles.filter(Boolean).join(' ');
};

/**
 * Pre-built card variants for common use cases
 */
export const cardVariants = {
    // Concert card variant
    concert: combineCardStyles(
        cardStyles.premium,
        "group h-full flex flex-col"
    ),

    // Artist card variant
    artist: combineCardStyles(
        cardStyles.premium,
        "group"
    ),

    // News card variant
    news: combineCardStyles(
        cardStyles.premium,
        "group overflow-hidden"
    ),

    // Festival card variant
    festival: combineCardStyles(
        cardStyles.premium,
        "group h-full"
    ),
};
