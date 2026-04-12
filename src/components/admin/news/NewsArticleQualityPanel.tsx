import { useMemo } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { NewsArticleQualityReport } from '@/hooks/admin/useNewsArticleQuality';

interface NewsArticleQualityPanelProps {
  report: NewsArticleQualityReport;
  status: 'draft' | 'published' | 'archived';
}

interface CheckItem {
  label: string;
  ok: boolean;
}

export const NewsArticleQualityPanel = ({ report, status }: NewsArticleQualityPanelProps) => {
  const checks: CheckItem[] = useMemo(
    () => [
      { label: `${report.wordCount} palabras (mín. 300)`, ok: report.wordCount >= 300 },
      {
        label: `Meta descripción (${report.metaDescLength} car.)`,
        ok: report.metaDescLength >= 120 && report.metaDescLength <= 160,
      },
      { label: `${report.keywordCount} keywords (mín. 3)`, ok: report.keywordCount >= 3 },
      { label: 'Imagen destacada', ok: report.hasFeaturedImage },
      { label: 'Categoría', ok: report.hasCategory },
      {
        label: 'Autor',
        ok: report.hasAuthor || status !== 'published',
      },
    ],
    [report, status],
  );

  const completed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);

  const barColor =
    percent === 100
      ? 'bg-green-500'
      : percent >= 60
        ? 'bg-yellow-500'
        : 'bg-red-500';

  const label =
    percent === 100
      ? '¡Listo para publicar!'
      : `${completed} de ${total} requisitos`;

  return (
    <Collapsible defaultOpen={percent < 100}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Calidad</span>
              <span
                className={`text-xs font-semibold ${percent === 100 ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <ChevronDown className="h-4 w-4 ml-3 text-muted-foreground shrink-0 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1 space-y-1.5 border-t">
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex items-center gap-2 text-sm"
              >
                {check.ok ? (
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span
                  className={check.ok ? 'text-muted-foreground' : 'text-foreground'}
                >
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
