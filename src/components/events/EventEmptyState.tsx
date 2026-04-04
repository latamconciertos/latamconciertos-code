import type { ReactNode } from 'react';

export interface EventEmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  onClearFilters?: () => void;
}

export const EventEmptyState = ({
  icon,
  title,
  message,
}: EventEmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="h-24 w-24 text-muted-foreground mx-auto mb-4" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};
