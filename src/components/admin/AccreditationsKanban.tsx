import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  MapPin,
  ExternalLink,
  Clock,
  AlertTriangle,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useAccreditations,
  useUpdateAccreditation,
} from '@/hooks/queries/useAccreditations';
import {
  ACCREDITATION_STATUS_LABELS,
  type AccreditationStatus,
  type AccreditationWithTeam,
} from '@/types/entities';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  status: AccreditationStatus;
  accent: string;
  headerBg: string;
  dropBg: string;
  dot: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'draft',
    accent: 'border-t-slate-400',
    headerBg: 'bg-slate-500/8',
    dropBg: 'bg-slate-500/10',
    dot: 'bg-slate-400',
  },
  {
    status: 'pending',
    accent: 'border-t-amber-400',
    headerBg: 'bg-amber-500/8',
    dropBg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
  },
  {
    status: 'submitted',
    accent: 'border-t-blue-400',
    headerBg: 'bg-blue-500/8',
    dropBg: 'bg-blue-500/10',
    dot: 'bg-blue-400',
  },
  {
    status: 'approved',
    accent: 'border-t-emerald-400',
    headerBg: 'bg-emerald-500/8',
    dropBg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  {
    status: 'rejected',
    accent: 'border-t-rose-400',
    headerBg: 'bg-rose-500/8',
    dropBg: 'bg-rose-500/10',
    dot: 'bg-rose-400',
  },
];

export const AccreditationsKanban = () => {
  const { data: accreditations = [] } = useAccreditations();
  const updateAccreditation = useUpdateAccreditation();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AccreditationStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('accreditation-id', id);
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => setDraggingId(id));
  };

  const handleDragOver = (e: React.DragEvent, status: AccreditationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: AccreditationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('accreditation-id');
    setDraggingId(null);
    setDragOverColumn(null);

    const accreditation = accreditations.find((a) => a.id === id);
    if (!accreditation || accreditation.status === newStatus) return;

    const data: any = { status: newStatus };
    if (newStatus === 'submitted' && !accreditation.submitted_at) {
      data.submitted_at = new Date().toISOString();
    }

    await updateAccreditation.mutateAsync({ id, data });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const scrollBoard = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const daysBetween = (deadline: string) =>
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const totalByStatus = (status: AccreditationStatus) =>
    accreditations.filter((a) => a.status === status).length;

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kanban</h2>
          <p className="text-sm text-muted-foreground">
            {accreditations.length} acreditaciones en total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBoard('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBoard('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Board */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 scroll-smooth"
        style={{ minHeight: 'calc(100vh - 220px)' }}
      >
        {COLUMNS.map((col) => {
          const items = accreditations
            .filter((a) => a.status === col.status)
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

          const isDropTarget = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={cn(
                'flex-shrink-0 w-[300px] flex flex-col rounded-xl border border-border/60 border-t-[3px] transition-all duration-200',
                col.accent,
                isDropTarget && `${col.dropBg} border-border scale-[1.01] shadow-lg`,
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column header */}
              <div className={cn('px-4 py-3 rounded-t-lg', col.headerBg)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                    <h3 className="text-sm font-semibold">
                      {ACCREDITATION_STATUS_LABELS[col.status]}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums bg-background/60 rounded-full px-2.5 py-0.5">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Cards container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {items.map((a) => (
                  <KanbanCard
                    key={a.id}
                    accreditation={a}
                    isDragging={draggingId === a.id}
                    daysBetween={daysBetween}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}

                {items.length === 0 && (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed transition-colors',
                      isDropTarget
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40',
                    )}
                  >
                    <p className="text-xs text-muted-foreground/50">
                      {isDropTarget ? 'Suelta aquí' : 'Sin acreditaciones'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function KanbanCard({
  accreditation: a,
  isDragging,
  daysBetween,
  onDragStart,
  onDragEnd,
}: {
  accreditation: AccreditationWithTeam;
  isDragging: boolean;
  daysBetween: (d: string) => number;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const days = daysBetween(a.deadline);
  const isUrgent = ['draft', 'pending'].includes(a.status) && days <= 3 && days >= 0;
  const isOverdue = ['draft', 'pending'].includes(a.status) && days < 0;
  const teamCount = a.event_team_assignments?.length ?? 0;
  const confirmedCount = a.event_team_assignments?.filter((t) => t.confirmed).length ?? 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, a.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'group rounded-lg border bg-card p-3.5 cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-md hover:border-border hover:-translate-y-0.5',
        isDragging && 'opacity-30 scale-95 rotate-1 shadow-none',
        isOverdue && 'border-l-[3px] border-l-red-500',
        isUrgent && !isOverdue && 'border-l-[3px] border-l-amber-400',
      )}
    >
      {/* Title */}
      <p className="text-sm font-semibold leading-snug line-clamp-2 pr-6 relative">
        {a.event_name}
        {(a as any).proposal_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open((a as any).proposal_url, '_blank');
            }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
          </button>
        )}
      </p>

      {/* Event info */}
      <div className="mt-2 space-y-1">
        {a.venue_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{a.venue_name}</span>
          </div>
        )}
        {a.event_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0 opacity-60" />
            <span>
              {new Date(a.event_date + 'T12:00:00').toLocaleDateString('es', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Deadline badge */}
      <div className="mt-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1',
            isOverdue
              ? 'bg-red-500/15 text-red-500'
              : isUrgent
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {isOverdue ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {isOverdue
            ? `Vencida hace ${Math.abs(days)}d`
            : days === 0
              ? 'Vence hoy'
              : `Deadline en ${days}d`}
        </span>
      </div>

      {/* Footer: team + contact */}
      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
        {teamCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {a.event_team_assignments!.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold uppercase',
                    t.confirmed
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                  title={`${t.profiles?.first_name || t.profiles?.username || '?'} ${t.confirmed ? '(confirmado)' : '(sin confirmar)'}`}
                >
                  {(t.profiles?.first_name?.[0] || t.profiles?.username?.[0] || '?')}
                </div>
              ))}
              {teamCount > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                  +{teamCount - 3}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {confirmedCount}/{teamCount}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">Sin equipo</span>
        )}

        {a.contact_name && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={a.contact_name}>
            {a.contact_name}
          </span>
        )}
      </div>
    </div>
  );
}
