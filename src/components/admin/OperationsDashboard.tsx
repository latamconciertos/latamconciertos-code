import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Users,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useAccreditations } from '@/hooks/queries/useAccreditations';

interface OperationsDashboardProps {
  onNavigate: (tab: string) => void;
}

const daysBetween = (a: string, b: Date) => {
  const d = new Date(a);
  return Math.ceil((d.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle2 className="h-4 w-4 text-verde" />;
    case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'submitted': return <Send className="h-4 w-4 text-periwinkle" />;
    case 'expired': return <XCircle className="h-4 w-4 text-texto-2" />;
    default: return <Clock className="h-4 w-4 text-amber-400" />;
  }
};

const deadlineBadge = (deadline: string) => {
  const days = daysBetween(deadline, new Date());
  if (days < 0) return <Badge variant="destructive">Vencida</Badge>;
  if (days === 0) return <Badge variant="destructive">Hoy</Badge>;
  if (days <= 3) return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">En {days} días</Badge>;
  if (days <= 7) return <Badge variant="outline" className="border-periwinkle/30 bg-periwinkle/10 text-periwinkle">En {days} días</Badge>;
  return <Badge variant="outline" className="border-linea bg-superficie-2 text-texto-2">En {days} días</Badge>;
};

export const OperationsDashboard = ({ onNavigate }: OperationsDashboardProps) => {
  const { data: accreditations = [], isLoading } = useAccreditations();

  const stats = useMemo(() => {
    const now = new Date();
    const urgent = accreditations.filter(
      (a) => ['draft', 'pending'].includes(a.status) && daysBetween(a.deadline, now) <= 3,
    );
    const pending = accreditations.filter((a) =>
      ['draft', 'pending'].includes(a.status),
    );
    const submitted = accreditations.filter((a) => a.status === 'submitted');
    const approved = accreditations.filter((a) => a.status === 'approved');
    const upcoming = accreditations
      .filter(
        (a) =>
          a.status === 'approved' &&
          a.event_date &&
          daysBetween(a.event_date, now) >= 0 &&
          daysBetween(a.event_date, now) <= 14,
      )
      .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime());

    return { urgent, pending, submitted, approved, upcoming };
  }, [accreditations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display uppercase tracking-[0.01em] font-extrabold text-2xl text-texto">
          Operaciones
        </h2>
        <p className="text-texto-2">
          Gestión de acreditaciones y equipo
        </p>
      </div>

      {/* Urgent alerts */}
      {stats.urgent.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {stats.urgent.length} acreditación{stats.urgent.length > 1 ? 'es' : ''} urgente{stats.urgent.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {stats.urgent.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="font-medium">{a.event_name}</span>
                  {deadlineBadge(a.deadline)}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pendientes"
          value={stats.pending.length}
          icon={FileText}
          valueClass="text-amber-400"
        />
        <StatCard
          title="Enviadas"
          value={stats.submitted.length}
          icon={Send}
          valueClass="text-texto"
        />
        <StatCard
          title="Aprobadas"
          value={stats.approved.length}
          icon={CheckCircle2}
          valueClass="text-verde"
        />
        <StatCard
          title="Próximos eventos"
          value={stats.upcoming.length}
          icon={Calendar}
          valueClass="text-texto"
        />
      </div>

      {/* Two columns: pending deadlines + upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines próximos */}
        <Card className="rounded-[20px] border-linea bg-superficie">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Próximos deadlines</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('accreditations')}
              className="text-xs text-texto-2 hover:text-periwinkle"
            >
              Ver todas
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.pending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay acreditaciones pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {stats.pending.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-linea last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.event_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.venue_name && `${a.venue_name} · `}
                        Deadline: {new Date(a.deadline).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {deadlineBadge(a.deadline)}
                      {statusIcon(a.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos eventos con equipo */}
        <Card className="rounded-[20px] border-linea bg-superficie">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Eventos confirmados esta quincena</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay eventos próximos confirmados
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcoming.map((a) => (
                  <div key={a.id} className="py-2 border-b border-linea last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.event_date && new Date(a.event_date).toLocaleDateString('es', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                          {a.venue_name && ` · ${a.venue_name}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-linea text-texto-2">
                        <Users className="h-3 w-3 mr-1 text-periwinkle" />
                        {a.event_team_assignments?.length ?? 0}
                      </Badge>
                    </div>
                    {(a.event_team_assignments?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.event_team_assignments!.map((t) => (
                          <Badge
                            key={t.id}
                            variant="outline"
                            className={`text-xs ${
                              t.confirmed
                                ? 'border-verde/30 bg-verde/10 text-verde'
                                : 'border-linea bg-superficie-2 text-texto-2'
                            }`}
                          >
                            {t.profiles?.first_name || t.profiles?.username || 'Sin nombre'}
                            {!t.confirmed && ' ?'}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function StatCard({
  title,
  value,
  icon: Icon,
  valueClass,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  valueClass: string;
}) {
  return (
    <div className="rounded-[20px] border border-linea bg-superficie p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-display text-3xl font-extrabold ${valueClass}`}>{value}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-2 mt-0.5">{title}</p>
        </div>
        <Icon className="h-7 w-7 text-periwinkle/70" />
      </div>
    </div>
  );
}
