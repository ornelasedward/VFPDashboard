import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StrategyResult } from "@/lib/supabase/queries";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopPerformersTableProps {
  results: StrategyResult[];
}

export function TopPerformersTable({ results }: TopPerformersTableProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const cleaned = value.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>Timeframe</TableHead>
            <TableHead>PnL</TableHead>
            <TableHead>Win Rate</TableHead>
            <TableHead>Profit Factor</TableHead>
            <TableHead>Max DD</TableHead>
            <TableHead>Trades</TableHead>
            <TableHead>Lookback</TableHead>
            <TableHead>Primary Speed</TableHead>
            <TableHead>Secondary Speed</TableHead>
            <TableHead>Trend Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            results.map((result, index) => {
              const pnl = parsePercentage(result.pnl);
              const isProfitable = pnl > 0;
              
              return (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">
                    {index + 1 === 1 && <span className="text-yellow-500">🥇</span>}
                    {index + 1 === 2 && <span className="text-gray-400">🥈</span>}
                    {index + 1 === 3 && <span className="text-orange-600">🥉</span>}
                    {index + 1 > 3 && <span className="text-muted-foreground">{index + 1}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.chart_tf}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfitable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {result.pnl}
                    </div>
                  </TableCell>
                  <TableCell>{result.win_rate}</TableCell>
                  <TableCell>{result.profit_factor}</TableCell>
                  <TableCell className="text-red-600">{result.max_dd}</TableCell>
                  <TableCell>{result.trades}</TableCell>
                  <TableCell>{result.lookback}</TableCell>
                  <TableCell className="text-xs">{result.primary_speed}</TableCell>
                  <TableCell className="text-xs">{result.secondary_speed}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {result.trend_type}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
