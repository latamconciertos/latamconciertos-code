import { Check, X } from 'lucide-react';

interface QualityIndicatorProps {
  label: string;
  value: number;
  min: number;
  max?: number;
  status?: 'good' | 'warning' | 'bad';
}

export const QualityIndicator = ({ label, value, min, max, status }: QualityIndicatorProps) => {
  const getStatus = () => {
    if (status) return status;
    if (max) {
      return value >= min && value <= max ? 'good' : value < min ? 'bad' : 'warning';
    }
    return value >= min ? 'good' : 'bad';
  };

  const currentStatus = getStatus();
  const isComplete = currentStatus === 'good';

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {isComplete ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <X className="h-5 w-5 text-red-600" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {value}
        {max && ` / ${max}`}
        {!max && ` (min: ${min})`}
      </div>
    </div>
  );
};
