import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { IndividualDailyResult } from "../types";

interface IndividualResultsTableProps {
  results: IndividualDailyResult[];
  linesPerDay: number;
}

const podiumRowBg = [
  "bg-yellow-50 dark:bg-yellow-400/[0.14]",
  "bg-gray-50 dark:bg-gray-300/[0.09]",
  "bg-amber-50 dark:bg-amber-500/[0.14]",
];

const podiumPos = [
  "text-yellow-600 dark:text-yellow-400",
  "text-gray-500 dark:text-gray-400",
  "text-amber-700 dark:text-amber-500",
];

const IndividualResultsTable = ({ results, linesPerDay }: IndividualResultsTableProps) => {
  const renderLineHeaders = () => {
    const headers = [];
    for (let i = 1; i <= linesPerDay; i++) {
      headers.push(
        <TableHead key={`line-${i}`} className="text-center w-[60px]">L{i}</TableHead>
      );
    }
    return headers;
  };

  const renderPlayerLines = (result: IndividualDailyResult) => {
    const lines = [];
    for (let i = 1; i <= linesPerDay; i++) {
      const lineValue = result[`line_${i}` as keyof IndividualDailyResult] as number | null;
      lines.push(
        <TableCell
          key={`line-${i}`}
          className={`text-center font-medium ${
            lineValue && lineValue >= 200 ? 'text-[#ea384c] font-bold' : ''
          }`}
        >
          {lineValue || '-'}
        </TableCell>
      );
    }
    return lines;
  };

  const getPlayerLines = (result: IndividualDailyResult) => {
    const lines = [];
    for (let i = 1; i <= linesPerDay; i++) {
      const val = result[`line_${i}` as keyof IndividualDailyResult] as number | null;
      lines.push({ label: `L${i}`, value: val });
    }
    return lines;
  };

  return (
    <>
      {/* ── MOBILE: professional standings table ── */}
      <div className="md:hidden rounded-xl border border-gray-200/80 dark:border-white/[0.10] overflow-hidden dark:bg-white/[0.03]">
        <table className="w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "36px" }} />
            <col />
            <col style={{ width: "60px" }} />
            <col style={{ width: "52px" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.07] border-b border-gray-200 dark:border-white/[0.10]">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
              <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Jugador</th>
              <th className="text-right px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => {
              const pos = result.player_position ?? index + 1;
              const isTop3 = pos <= 3;
              const podiumIdx = pos - 1;
              const playerLines = getPlayerLines(result);
              const rowBg = isTop3 ? podiumRowBg[podiumIdx] : "bg-white dark:bg-white/[0.02]";

              return (
                <React.Fragment key={`${result.player_name}-${result.game_date}`}>
                  {/* Main stats row */}
                  <tr className={rowBg}>
                    <td className="px-3 pt-3 pb-2 align-top">
                      <div className={`flex items-center gap-0.5 font-bold text-sm ${isTop3 ? podiumPos[podiumIdx] : "text-gray-400 dark:text-gray-500"}`}>
                        {isTop3 && <Trophy className="h-3 w-3" />}
                        {pos}
                      </div>
                    </td>
                    <td className="px-2 pt-3 pb-2 align-top overflow-hidden">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                        {result.player_name}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {result.club_name || '—'}
                      </p>
                    </td>
                    <td className="px-2 pt-3 pb-2 text-right align-top font-bold text-sm bg-gradient-to-r from-[#ea384c] to-[#F97316] bg-clip-text text-transparent tabular-nums">
                      {result.total_score}
                    </td>
                    <td className="px-3 pt-3 pb-2 text-right align-top text-sm font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                      {typeof result.average_score === 'number'
                        ? result.average_score.toFixed(1)
                        : parseFloat(String(result.average_score)).toFixed(1)}
                    </td>
                  </tr>

                  {/* Scorecard row */}
                  <tr className={`border-b border-gray-100 dark:border-white/[0.07] last:border-0 ${rowBg}`}>
                    <td colSpan={4} className="pl-9 pr-3 pb-3 pt-0">
                      <div
                        className="grid border-t border-gray-100 dark:border-white/[0.06] pt-2"
                        style={{ gridTemplateColumns: `repeat(${playerLines.length}, 1fr)` }}
                      >
                        {playerLines.map(({ label, value }) => (
                          <div key={label} className="flex flex-col items-center gap-0.5">
                            <span
                              className={`text-xs font-bold tabular-nums ${
                                value && value >= 200
                                  ? 'text-[#ea384c]'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {value ?? '—'}
                            </span>
                            <span className="text-[9px] font-medium text-gray-300 dark:text-white/20 uppercase tracking-wide">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── DESKTOP: original table ── */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">Pos</TableHead>
              <TableHead className="min-w-[200px]">Jugador</TableHead>
              <TableHead className="w-[150px]">Club</TableHead>
              {renderLineHeaders()}
              <TableHead className="text-right w-[100px]">Total</TableHead>
              <TableHead className="text-right w-[100px]">Promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => {
              const pos = result.player_position ?? index + 1;
              const isTop3 = pos <= 3;
              return (
                <TableRow
                  key={`${result.player_name}-${result.game_date}`}
                  className={`group transition-colors ${
                    isTop3 ? podiumRowBg[pos - 1] : "hover:bg-gradient-to-r hover:from-[#ea384c]/5 hover:via-[#F97316]/5 hover:to-[#FFE91F]/5"
                  }`}
                >
                  <TableCell className={`font-semibold ${isTop3 ? podiumPos[pos - 1] : ""}`}>
                    <span className="inline-flex items-center gap-1">
                      {isTop3 && <Trophy className="h-4 w-4" />}
                      {pos}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{result.player_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {result.club_name || '-'}
                    </Badge>
                  </TableCell>
                  {renderPlayerLines(result)}
                  <TableCell className="text-right font-bold bg-gradient-to-r from-[#ea384c] to-[#F97316] bg-clip-text text-transparent">
                    {result.total_score}
                  </TableCell>
                  <TableCell className="text-right font-medium">{result.average_score}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default IndividualResultsTable;
