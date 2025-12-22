"use client";

import { useState } from "react";
import { StrategyResult, CoinTimeframeBest } from "@/lib/types/strategy";
import { parsePercentage } from "@/lib/utils/parse";
import { TopPerformersTable } from "@/components/dashboard/top-performers-table";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { CoinTimeframeMatrix } from "@/components/dashboard/coin-timeframe-matrix";
import { StrategyFiltersComponent, StrategyFilters } from "@/components/dashboard/strategy-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface DashboardClientProps {
  topPerformers: StrategyResult[];
  totalCount: number;
  availableTickers: string[];
  coinTimeframeMatrix: CoinTimeframeBest[];
}

export function DashboardClient({
  topPerformers,
  totalCount,
  availableTickers,
  coinTimeframeMatrix,
}: DashboardClientProps) {
  const [filters, setFilters] = useState<StrategyFilters>({
    maxDrawdown: 100,
    minPnl: -100,
    maxPnl: 1000000,
    minWinRate: 0,
    ticker: null,
    timeframe: null,
  });

  // Get unique timeframes from the matrix data
  const availableTimeframes = [...new Set(coinTimeframeMatrix.map(d => d.timeframe))].sort((a, b) => {
    const getHours = (tf: string) => {
      if (tf.endsWith('h')) return parseInt(tf);
      if (tf.endsWith('d')) return parseInt(tf) * 24;
      return 0;
    };
    return getHours(a) - getHours(b);
  });

  // Apply filters to the pre-fetched results (client-side filtering of limited dataset)
  const applyFilters = (results: StrategyResult[]) => {
    return results.filter(r => {
      if (filters.ticker && r.ticker !== filters.ticker) return false;
      if (filters.timeframe && r.chart_tf !== filters.timeframe) return false;
      const maxDD = Math.abs(parsePercentage(r.max_dd));
      if (maxDD > filters.maxDrawdown) return false;
      const pnl = parsePercentage(r.pnl);
      if (pnl < filters.minPnl || pnl > filters.maxPnl) return false;
      const winRate = parsePercentage(r.win_rate);
      if (winRate < filters.minWinRate) return false;
      return true;
    });
  };

  const filteredTopPerformers = applyFilters(topPerformers);
  
  // Filter matrix data based on ticker/timeframe filters
  const filteredMatrix = coinTimeframeMatrix.filter(item => {
    if (filters.ticker && item.ticker !== filters.ticker) return false;
    if (filters.timeframe && item.timeframe !== filters.timeframe) return false;
    return true;
  });
  
  return (
    <div className="space-y-8">

        {/* Overview Statistics */}
      <section>
        <OverviewStats results={filteredTopPerformers} totalCount={totalCount} />
      </section>

      {/* Filters - affects both matrix and table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strategy Filters
            </CardTitle>
            <CardDescription>
              Filter strategies by performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StrategyFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              availableTickers={availableTickers}
              availableTimeframes={availableTimeframes}
            />
          </CardContent>
        </Card>
      </section>

      {/* Coin/Timeframe Matrix - Best strategies with DD <= 30% */}
      <section>
        <CoinTimeframeMatrix data={filteredMatrix} />
      </section>

      {/* Top Performers Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Strategies
            </CardTitle>
            <CardDescription>
              Strategies ranked by PnL. Use filters above to refine results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopPerformersTable results={filteredTopPerformers} />
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
