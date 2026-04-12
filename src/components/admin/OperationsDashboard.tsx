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
import {
  ACCREDITATION_STATUS_LABELS,
  type AccreditationWithTeam,
} from '@/types/entities';

interface OperationsDashboardProps {
  onNavigate: (tab: string) => void;
}

const daysBetween = (a: string, b: Date) => {
  const d = new Date(a);
  return Math.ceil((d.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'submitted': return <Send className="h-4 w-4 text-blue-500" />;
    case 'expired': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default: return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const deadlineBadge = (deadline: string) => {
  const days = daysBetween(deadline, new Date());
  if (days < 0) return <Badge variant="destructive">Vencida</Badge>;
  if (days === 0) return <Badge variant="destructive">Hoy</Badge>;
  if (days <= 3) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En {days} días</Badge>;
  if (days <= 7) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En {days} días</Badge>;
  return <Badge variant="secondary">En {days} días</Badge>;
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
        <h2 className="text-2xl font-bold">Operaciones</h2>
        <p className="text-muted-foreground">
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
          color="text-yellow-500"
        />
        <StatCard
          title="Enviadas"
          value={stats.submitted.length}
          icon={Send}
          color="text-blue-500"
        />
        <StatCard
          title="Aprobadas"
          value={stats.approved.length}
          icon={CheckCircle2}
          color="text-green-500"
        />
        <StatCard
          title="Próximos eventos"
          value={stats.upcoming.length}
          icon={Calendar}
          color="text-purple-500"
        />
      </div>

      {/* Two columns: pending deadlines + upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines próximos */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Próximos deadlines</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('accreditations')}
              className="text-xs"
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
                    className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
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
        <Card>
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
                  <div key={a.id} className="py-2 border-b last:border-0">
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
                      <Badge variant="outline" className="shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        {a.event_team_assignments?.length ?? 0}
                      </Badge>
                    </div>
                    {(a.event_team_assignments?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.event_team_assignments!.map((t) => (
                          <Badge
                            key={t.id}
                            variant={t.confirmed ? 'default' : 'secondary'}
                            className="text-xs"
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
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );
}
