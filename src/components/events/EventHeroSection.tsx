import type { ReactNode } from 'react';

export interface HeroStat {
  icon: ReactNode;
  value: string;
  label: string;
}

export interface EventHeroSectionProps {
  icon: ReactNode;
  badgeText: string;
  title: string;
  subtitle: string;
  stats: HeroStat[];
  /** Extra props passed to the wrapper <header> element */
  itemPropName?: string;
  itemPropDescription?: string;
}

export const EventHeroSection = ({
  icon,
  badgeText,
  title,
  subtitle,
  stats,
  itemPropName,
  itemPropDescription,
}: EventHeroSectionProps) => {
  return (
    <header className="text-center mb-8">
      <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
        {icon}
        <span className="text-primary font-semibold">{badgeText}</span>
      </div>
      <h1 className="page-title mb-4" itemProp={itemPropName ? "name" : undefined}>
        {title}
      </h1>
      <p className="page-subtitle max-w-3xl mx-auto" itemProp={itemPropDescription ? "description" : undefined}>
        {subtitle}
      </p>

      {/* Stats for credibility */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-muted-foreground">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            {stat.icon}
            <span><strong className="text-foreground">{stat.value}</strong> {stat.label}</span>
          </div>
        ))}
      </div>
    </header>
  );
};
