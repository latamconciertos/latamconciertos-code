import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Music, Users, ListMusic, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEMOGRAPHIC_LABELS, pollOptionLabel, AGE_RANGES } from '@/lib/polls';
import type { PollResults, PollArtistResult, PollBreakdownItem } from '@/types/entities/poll';

// Paleta validada sobre superficie #0E1830 (dataviz): morado → fucsia → naranja, en orden de posición.
const POSITION_COLORS = ['#8F5CF0', '#E93A97', '#E06A1C', '#94A0BD', '#5B6B8C'];
const SINGLE_SERIES = '#E93A97';
const GRID = 'rgba(255,255,255,0.06)';
const TICK = '#94A0BD';

interface PollResultsDashboardProps {
  results: PollResults;
  updatedAt?: number;
  /** Texto de contexto bajo el título (p. ej. "Informe para Páramo Presenta"). */
  subtitle?: string;
}

type Metric = 'points' | 'mentions';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const formatDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const StatTile = ({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string | number; hint?: string }) => (
  <div className="rounded-[20px] border border-linea bg-superficie p-5">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-texto-2">
      <Icon className="h-3.5 w-3.5 text-fucsia" />
      {label}
    </div>
    <p className="font-display font-black text-4xl leading-none text-texto mt-3">{value}</p>
    {hint && <p className="text-xs text-texto-2 mt-2">{hint}</p>}
  </div>
);

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-linea bg-noche px-3 py-2 text-xs shadow-[0_20px_50px_rgba(0,0,0,.5)]">
      <p className="font-semibold text-texto mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-texto-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          {p.name}: <span className="text-texto font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const BreakdownCard = ({ title, items, total, field }: { title: string; items: PollBreakdownItem[]; total: number; field?: string }) => {
  const max = Math.max(...items.map((i) => i.count), 1);
  const answered = items.reduce((acc, i) => acc + i.count, 0);
  return (
    <div className="rounded-[20px] border border-linea bg-superficie p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="font-semibold text-texto">{title}</h3>
        <span className="text-xs text-texto-2">
          {answered} de {total} respondieron
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-texto-2">Sin respuestas todavía.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const pct = answered ? Math.round((item.count / answered) * 100) : 0;
            return (
              <li key={item.value}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-texto truncate">{field ? pollOptionLabel(field, item.value) : item.value}</span>
                  <span className="text-texto-2 tabular-nums shrink-0 ml-3">
                    {item.count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-superficie-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: SINGLE_SERIES }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const buildCsv = (results: PollResults): string => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push(['Encuesta', results.poll.title].map(esc).join(','));
  lines.push(['Respuestas', results.totals.responses].map(esc).join(','));
  lines.push('');
  lines.push(['Ranking', 'Artista', 'Puntos', 'Menciones', '1º', '2º', '3º', 'Posición promedio'].map(esc).join(','));
  results.artists.forEach((a, i) => {
    lines.push([i + 1, a.artist_name, a.points, a.mentions, a.p1, a.p2, a.p3, a.avg_position].map(esc).join(','));
  });
  for (const [field, items] of Object.entries(results.demographics)) {
    lines.push('');
    lines.push([DEMOGRAPHIC_LABELS[field] ?? field, 'Respuestas'].map(esc).join(','));
    items.forEach((i) => lines.push([pollOptionLabel(field, i.value), i.count].map(esc).join(',')));
  }
  lines.push('');
  lines.push(['Ciudad de origen', 'Respuestas'].map(esc).join(','));
  results.cities.forEach((c) => lines.push([c.value, c.count].map(esc).join(',')));
  return '﻿' + lines.join('\n');
};

export const PollResultsDashboard = ({ results, updatedAt, subtitle }: PollResultsDashboardProps) => {
  const [metric, setMetric] = useState<Metric>('points');
  const total = results.totals.responses;
  const maxChoices = results.poll.max_choices;

  const chartData = useMemo(
    () =>
      results.artists.slice(0, 15).map((a) => ({
        name: a.artist_name,
        p1: a.p1,
        p2: a.p2,
        p3: a.p3,
        p_other: a.p_other,
        points: a.points,
        mentions: a.mentions,
      })),
    [results.artists],
  );

  const sortedArtists = useMemo(() => {
    const list = [...results.artists];
    if (metric === 'mentions') list.sort((a, b) => b.mentions - a.mentions || b.points - a.points);
    return list;
  }, [results.artists, metric]);

  const totalMentions = results.artists.reduce((acc, a) => acc + a.mentions, 0);

  const ageMatrix = useMemo(() => {
    const top = results.artists.slice(0, 10);
    const ranges = AGE_RANGES.map((r) => r.value);
    const rows = top.map((a) => {
      const counts: Record<string, number> = {};
      for (const r of ranges) counts[r] = 0;
      for (const cell of results.artist_by_age) {
        if (cell.artist_key === a.artist_key && cell.age_range in counts) counts[cell.age_range] = cell.count;
      }
      return { artist: a, counts };
    });
    const maxCell = Math.max(1, ...rows.flatMap((r) => Object.values(r.counts)));
    return { ranges, rows, maxCell };
  }, [results.artists, results.artist_by_age]);

  const downloadCsv = () => {
    const blob = new Blob([buildCsv(results)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encuesta-${results.poll.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const positionSeries = Array.from({ length: Math.min(maxChoices, 3) }, (_, i) => ({
    key: `p${i + 1}`,
    name: `${i + 1}º lugar`,
    color: POSITION_COLORS[i],
  }));
  if (maxChoices > 3) positionSeries.push({ key: 'p_other', name: '4º o más', color: POSITION_COLORS[3] });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-2">
            <span className="inline-block h-0.5 w-6 bg-gradient-to-r from-morado via-fucsia to-naranja" aria-hidden="true" />
            {results.poll.festival?.name ?? 'Encuesta'}
          </p>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl leading-[0.95] tracking-[0.01em] text-texto">
            {results.poll.title}
          </h1>
          <p className="text-sm text-texto-2 mt-2">
            {subtitle ?? results.poll.question}
            {updatedAt && (
              <span className="ml-2 text-texto-2/70">
                · Actualizado {new Date(updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
              results.poll.is_active ? 'text-naranja' : 'text-texto-2',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', results.poll.is_active ? 'bg-naranja animate-pulse' : 'bg-texto-2')} aria-hidden="true" />
            {results.poll.is_active ? 'En vivo' : 'Cerrada'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            className="rounded-full border-linea bg-transparent hover:bg-superficie-2 text-texto"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Users} label="Respuestas" value={total} hint={`${results.totals.logged_in} con cuenta en Conciertos Latam`} />
        <StatTile icon={Music} label="Artistas distintos" value={results.unique_artists} hint={`${totalMentions} menciones en total`} />
        <StatTile icon={ListMusic} label="Top por persona" value={`${maxChoices}`} hint={`1º vale ${maxChoices} puntos, último vale 1`} />
        <StatTile icon={Clock} label="Última respuesta" value={formatDateTime(results.totals.last_at)} hint={`Primera: ${formatDateTime(results.totals.first_at)}`} />
      </div>

      <div className="rounded-[20px] border border-linea bg-superficie p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-black uppercase text-2xl leading-none text-texto">Artistas más pedidos</h2>
            <p className="text-xs text-texto-2 mt-1">Top 15 · cada barra se divide por la posición en la que fue elegido.</p>
          </div>
          <div className="inline-flex rounded-full border border-linea p-0.5 self-start">
            {(['points', 'mentions'] as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                aria-pressed={metric === m}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  metric === m ? 'bg-superficie-2 text-texto' : 'text-texto-2 hover:text-texto',
                )}
              >
                {m === 'points' ? 'Puntos ponderados' : 'Menciones'}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="text-sm text-texto-2 py-10 text-center">Todavía no hay votos. Cuando lleguen, aparecen aquí.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 480 }}>
              <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 34)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={6}>
                  <CartesianGrid horizontal={false} stroke={GRID} />
                  <XAxis type="number" tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#FFFFFF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: TICK }} iconType="circle" iconSize={8} />
                  {positionSeries.map((s, i) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.name}
                      stackId="pos"
                      fill={s.color}
                      stroke="#0E1830"
                      strokeWidth={1}
                      radius={i === positionSeries.length - 1 ? [0, 4, 4, 0] : 0}
                      maxBarSize={22}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {sortedArtists.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-texto-2 border-b border-linea">
                  <th className="py-2 pr-3 w-10">#</th>
                  <th className="py-2 pr-3">Artista</th>
                  <th className="py-2 pr-3 text-right">Puntos</th>
                  <th className="py-2 pr-3 text-right">Menciones</th>
                  <th className="py-2 pr-3 text-right">1º</th>
                  <th className="py-2 pr-3 text-right">2º</th>
                  <th className="py-2 pr-3 text-right">3º</th>
                  <th className="py-2 text-right">Pos. prom.</th>
                </tr>
              </thead>
              <tbody>
                {sortedArtists.map((a: PollArtistResult, i) => (
                  <tr key={a.artist_key} className="border-b border-linea/60 last:border-0">
                    <td className="py-2 pr-3 font-display font-black text-2xl leading-none text-naranja">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2.5 min-w-0">
                        {a.photo_url ? (
                          <img src={a.photo_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" loading="lazy" />
                        ) : (
                          <span className="h-8 w-8 rounded-full bg-superficie-2 flex items-center justify-center shrink-0">
                            <Music className="h-3.5 w-3.5 text-texto-2" />
                          </span>
                        )}
                        <span className="text-texto font-medium truncate">{a.artist_name}</span>
                        {!a.artist_slug && <span className="text-[10px] uppercase tracking-wider text-texto-2 shrink-0">manual</span>}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-texto">{a.points}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-texto-2">{a.mentions}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-texto-2">{a.p1}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-texto-2">{a.p2}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-texto-2">{a.p3}</td>
                    <td className="py-2 text-right tabular-nums text-texto-2">{a.avg_position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {results.by_day.length > 1 && (
        <div className="rounded-[20px] border border-linea bg-superficie p-5 sm:p-6">
          <h2 className="font-display font-black uppercase text-2xl leading-none text-texto mb-4">Respuestas por día</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={results.by_day.map((d) => ({ day: formatDay(d.day), count: d.count }))} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
              <Line type="monotone" dataKey="count" name="Respuestas" stroke={SINGLE_SERIES} strokeWidth={2} dot={{ r: 4, fill: SINGLE_SERIES, stroke: '#0E1830', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <section>
        <h2 className="font-display font-black uppercase text-2xl leading-none text-texto mb-4">Perfil de la audiencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <BreakdownCard title={DEMOGRAPHIC_LABELS.age_range} field="age_range" items={results.demographics.age_range ?? []} total={total} />
          <BreakdownCard title="Ciudad de origen" items={results.cities} total={total} />
          <BreakdownCard title={DEMOGRAPHIC_LABELS.editions_attended} field="editions_attended" items={results.demographics.editions_attended ?? []} total={total} />
          <BreakdownCard title={DEMOGRAPHIC_LABELS.attended_day} items={results.demographics.attended_day ?? []} total={total} />
          <BreakdownCard title={DEMOGRAPHIC_LABELS.favorite_genre} field="favorite_genre" items={results.demographics.favorite_genre ?? []} total={total} />
          <BreakdownCard title={DEMOGRAPHIC_LABELS.heard_from} field="heard_from" items={results.demographics.heard_from ?? []} total={total} />
        </div>
      </section>

      {ageMatrix.rows.length > 0 && results.artist_by_age.length > 0 && (
        <div className="rounded-[20px] border border-linea bg-superficie p-5 sm:p-6">
          <h2 className="font-display font-black uppercase text-2xl leading-none text-texto">Top 10 por edad</h2>
          <p className="text-xs text-texto-2 mt-1 mb-4">Menciones de cada artista según el rango de edad de quien lo pidió.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-texto-2 border-b border-linea">
                  <th className="py-2 pr-3">Artista</th>
                  {ageMatrix.ranges.map((r) => (
                    <th key={r} className="py-2 px-2 text-center whitespace-nowrap">{pollOptionLabel('age_range', r)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageMatrix.rows.map(({ artist, counts }) => (
                  <tr key={artist.artist_key} className="border-b border-linea/60 last:border-0">
                    <td className="py-2 pr-3 text-texto font-medium whitespace-nowrap">{artist.artist_name}</td>
                    {ageMatrix.ranges.map((r) => {
                      const v = counts[r];
                      const alpha = v ? 0.15 + (v / ageMatrix.maxCell) * 0.7 : 0;
                      return (
                        <td key={r} className="py-1.5 px-2 text-center">
                          <span
                            className="inline-flex min-w-[40px] justify-center rounded-md px-2 py-1 tabular-nums text-texto"
                            style={{ background: v ? `rgba(233,58,151,${alpha})` : 'transparent', color: v ? '#FFFFFF' : TICK }}
                          >
                            {v || '·'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
