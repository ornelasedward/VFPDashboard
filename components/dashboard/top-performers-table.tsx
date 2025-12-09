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
import Link from "next/link";

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
            <TableHead>Smoothing Type</TableHead>
            <TableHead>Trend Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            results.map((result, index) => {
              const pnl = parsePercentage(result.pnl);
              const isProfitable = pnl > 0;
              
              return (
                <TableRow key={result.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/strategy/${result.id}`} className="block">
                      {index + 1 === 1 && <span className="text-yellow-500">🥇</span>}
                      {index + 1 === 2 && <span className="text-gray-400">🥈</span>}
                      {index + 1 === 3 && <span className="text-orange-600">🥉</span>}
                      {index + 1 > 3 && <span className="text-muted-foreground">{index + 1}</span>}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      <Badge variant="outline">{result.chart_tf}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      <div className={`flex items-center gap-1 font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfitable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {result.pnl}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.win_rate}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.profit_factor}
                    </Link>
                  </TableCell>
                  <TableCell className="text-red-600">
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.max_dd}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.trades}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.lookback}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.primary_speed}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.secondary_speed}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link href={`/strategy/${result.id}`} className="block">
                      {result.smoothing_type}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${result.id}`} className="block">
                      <Badge variant="secondary" className="text-xs">
                        {result.trend_type}
                      </Badge>
                    </Link>
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
