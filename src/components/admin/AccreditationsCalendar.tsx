import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useAccreditations } from '@/hooks/queries/useAccreditations';
import {
  ACCREDITATION_STATUS_LABELS,
  type AccreditationStatus,
  type AccreditationWithTeam,
} from '@/types/entities';
import { cn } from '@/lib/utils';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_DOT: Record<AccreditationStatus, string> = {
  draft: 'bg-gray-400',
  pending: 'bg-yellow-400',
  submitted: 'bg-blue-400',
  approved: 'bg-green-400',
  rejected: 'bg-red-400',
  expired: 'bg-gray-500',
};

const STATUS_COLORS: Record<AccreditationStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired: 'bg-gray-500/20 text-gray-500',
};

interface DayEntry {
  type: 'deadline' | 'event';
  accreditation: AccreditationWithTeam;
}

export const AccreditationsCalendar = () => {
  const { data: accreditations = [] } = useAccreditations();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(fmt(today));
  };

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;

    const days: (Date | null)[] = [];
    for (let i = 1; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, DayEntry[]> = {};
    for (const a of accreditations) {
      if (a.deadline) {
        const key = a.deadline.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'deadline', accreditation: a });
      }
      if (a.event_date) {
        const key = a.event_date.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'event', accreditation: a });
      }
    }
    return map;
  }, [accreditations]);

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const todayStr = fmt(today);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendario</h2>
          <p className="text-muted-foreground">Deadlines y eventos del mes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-5">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {MONTHS[month]} {year}
                  </h3>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToday}>
                    Hoy
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 border-t border-l">
                {calendarDays.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="border-r border-b bg-muted/20 min-h-[80px]" />;
                  }

                  const dateStr = fmt(day);
                  const entries = entriesByDate[dateStr] ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const deadlines = entries.filter((e) => e.type === 'deadline');
                  const events = entries.filter((e) => e.type === 'event');

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={cn(
                        'border-r border-b min-h-[80px] p-1.5 text-left transition-colors relative',
                        isSelected && 'bg-primary/10 ring-1 ring-primary/30',
                        !isSelected && 'hover:bg-muted/50',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center justify-center text-xs w-6 h-6 rounded-full',
                          isToday && 'bg-primary text-primary-foreground font-bold',
                          !isToday && 'text-foreground',
                        )}
                      >
                        {day.getDate()}
                      </span>

                      {entries.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {deadlines.slice(0, 2).map((e, j) => (
                            <div
                              key={`d-${j}`}
                              className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-500 truncate"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[e.accreditation.status]}`} />
                              <span className="truncate">{e.accreditation.event_name}</span>
                            </div>
                          ))}
                          {events.slice(0, 2).map((e, j) => (
                            <div
                              key={`e-${j}`}
                              className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 truncate"
                            >
                              <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{e.accreditation.event_name}</span>
                            </div>
                          ))}
                          {entries.length > 4 && (
                            <p className="text-[10px] text-muted-foreground pl-1">
                              +{entries.length - 4} más
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-yellow-500/20 border border-yellow-500/30" />
                  Deadline
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-blue-500/20 border border-blue-500/30" />
                  Evento
                </div>
                {Object.entries(STATUS_DOT).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    {ACCREDITATION_STATUS_LABELS[status as AccreditationStatus]}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day detail sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="pt-5">
              {selectedDate ? (
                <>
                  <h4 className="font-semibold mb-4">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                  {selectedEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay actividad este día
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedEntries.map((entry, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {entry.accreditation.event_name}
                              </p>
                              {entry.accreditation.venue_name && (
                                <p className="text-xs text-muted-foreground">
                                  {entry.accreditation.venue_name}
                                </p>
                              )}
                            </div>
                            <Badge className={`text-[10px] shrink-0 ${STATUS_COLORS[entry.accreditation.status]}`}>
                              {ACCREDITATION_STATUS_LABELS[entry.accreditation.status]}
                            </Badge>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${entry.type === 'deadline' ? 'border-yellow-500/30 text-yellow-500' : 'border-blue-500/30 text-blue-400'}`}
                          >
                            {entry.type === 'deadline' ? 'Deadline' : 'Evento'}
                          </Badge>
                          {(entry.accreditation.event_team_assignments?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entry.accreditation.event_team_assignments!.map((t) => (
                                <Badge key={t.id} variant="secondary" className="text-[10px]">
                                  {t.profiles?.first_name || t.profiles?.username || '?'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Selecciona un día para ver el detalle</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
