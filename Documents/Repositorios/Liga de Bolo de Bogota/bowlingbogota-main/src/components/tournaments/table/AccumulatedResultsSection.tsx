import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { AccumulatedResult } from "../types";

interface AccumulatedResultsSectionProps {
  results: AccumulatedResult[];
  gender: 'M' | 'F';
  title: string;
}

// Row background tints for top 3
const podiumRowBg = [
  "bg-yellow-50 dark:bg-yellow-400/[0.14]",
  "bg-gray-50 dark:bg-gray-300/[0.09]",
  "bg-amber-50 dark:bg-amber-500/[0.14]",
];

// Position cell styles for top 3
const podiumPos = [
  "text-yellow-600 dark:text-yellow-400",
  "text-gray-500 dark:text-gray-400",
  "text-amber-700 dark:text-amber-500",
];

const AccumulatedResultsSection = ({ results, gender, title }: AccumulatedResultsSectionProps) => {
  const filteredResults = results.filter(result => {
    const normalizedGender = result.gender?.toLowerCase();
    if (!normalizedGender) return gender === 'M';
    return gender === 'M' ? normalizedGender === 'masculino' : normalizedGender === 'femenino';
  });

  if (filteredResults.length === 0) return null;

  return (
    <div>
      <h4 className="text-lg font-semibold mb-3">{title}</h4>

      {/* ── Unified standings table (mobile + desktop) ── */}
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.10] overflow-hidden dark:bg-white/[0.03]">

        {/* Mobile table */}
        <table className="md:hidden w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "36px" }} />
            <col />
            <col style={{ width: "32px" }} />
            <col style={{ width: "56px" }} />
            <col style={{ width: "52px" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.07] border-b border-gray-200 dark:border-white/[0.10]">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
              <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Jugador</th>
              <th className="text-right px-1 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Lin.</th>
              <th className="text-right px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, index) => {
              const isTop3 = index < 3;
              return (
                <tr
                  key={result.player_name}
                  className={`border-b border-gray-100 dark:border-white/[0.07] last:border-0 ${
                    isTop3 ? podiumRowBg[index] : "bg-white dark:bg-white/[0.02]"
                  }`}
                >
                  {/* Position */}
                  <td className="px-3 py-3">
                    <div className={`flex items-center gap-1 font-bold text-sm ${isTop3 ? podiumPos[index] : "text-gray-400 dark:text-gray-500"}`}>
                      {isTop3 && <Trophy className="h-3 w-3" />}
                      {index + 1}
                    </div>
                  </td>
                  {/* Name */}
                  <td className="px-2 py-3 font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[110px]">
                    {result.player_name}
                  </td>
                  {/* Lines played */}
                  <td className="px-2 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                    {result.total_lines_played}
                  </td>
                  {/* Total */}
                  <td className="px-2 py-3 text-right font-bold text-sm bg-gradient-to-r from-[#ea384c] to-[#F97316] bg-clip-text text-transparent">
                    {result.total_score}
                  </td>
                  {/* Average */}
                  <td className="px-2 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {typeof result.average_score === 'number'
                      ? result.average_score.toFixed(1)
                      : parseFloat(String(result.average_score)).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Desktop table */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50 dark:bg-white/[0.05]">
              <TableHead className="w-[100px]">Posición</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-right">Líneas Jugadas</TableHead>
              <TableHead className="text-right">Total Acumulado</TableHead>
              <TableHead className="text-right">Promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result, index) => (
              <TableRow
                key={result.player_name}
                className={`group transition-colors ${
                  index < 3 ? podiumRowBg[index] : "hover:bg-gradient-to-r hover:from-[#ea384c]/5 hover:via-[#F97316]/5 hover:to-[#FFE91F]/5"
                }`}
              >
                <TableCell className={`font-semibold ${index < 3 ? podiumPos[index] : ""}`}>
                  <span className="inline-flex items-center gap-1">
                    {index < 3 && <Trophy className="h-4 w-4" />}
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{result.player_name}</TableCell>
                <TableCell className="text-right font-medium">{result.total_lines_played}</TableCell>
                <TableCell className="text-right font-bold bg-gradient-to-r from-[#ea384c] to-[#F97316] bg-clip-text text-transparent">
                  {result.total_score}
                </TableCell>
                <TableCell className="text-right font-medium">{result.average_score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccumulatedResultsSection;
