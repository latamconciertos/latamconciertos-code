import { ReactNode } from 'react';

interface FilterLabelProps {
  children: ReactNode;
  icon?: ReactNode;
}

export const FilterLabel = ({ children, icon }: FilterLabelProps) => {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
      {icon}
      {children}
    </div>
  );
};

export default FilterLabel;
