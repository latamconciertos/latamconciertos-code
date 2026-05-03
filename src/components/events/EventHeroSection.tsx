import type { ReactNode } from 'react';

export interface HeroStat {
  icon: ReactNode;
  value: string;
  label: string;
}

export interface EventHeroSectionProps {
  /** Kept for backward compatibility — no longer rendered */
  icon?: ReactNode;
  badgeText: string;
  title: string;
  subtitle: string;
  stats: HeroStat[];
  itemPropName?: string;
  itemPropDescription?: string;
}

export const EventHeroSection = ({
  badgeText,
  title,
  subtitle,
  stats,
  itemPropName,
  itemPropDescription,
}: EventHeroSectionProps) => {
  return (
    <header className="text-center mt-6 mb-10 md:mb-14">
      <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
        {badgeText}
      </p>
      <h1
        className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-5 md:mb-6"
        itemProp={itemPropName ? "name" : undefined}
      >
        {title}
      </h1>
      <p
        className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        itemProp={itemPropDescription ? "description" : undefined}
      >
        {subtitle}
      </p>

      {/* Stats — editorial, numerical, prominent */}
      {stats.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mt-8 md:mt-10">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center min-w-[80px]">
              <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                {stat.value}
              </span>
              <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
