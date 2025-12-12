"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyResult } from "@/lib/supabase/queries";
import { Activity, Trophy, TrendingUp } from "lucide-react";

interface OverviewStatsProps {
  results: StrategyResult[];
}

export function OverviewStats({ results }: OverviewStatsProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const totalRuns = results.length;
  const profitableStrategies = results.filter(r => parsePercentage(r.pnl) > 0).length;
  const profitablePercentage = totalRuns > 0 ? (profitableStrategies / totalRuns) * 100 : 0;
  
  // Calculate average PnL across all strategies
  const avgPnl = totalRuns > 0 
    ? results.reduce((sum, r) => sum + parsePercentage(r.pnl), 0) / totalRuns 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Strategy Runs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalRuns.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all timeframes and configurations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitable Strategies</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{profitableStrategies.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {profitablePercentage.toFixed(1)}% success rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average PnL</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${avgPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {avgPnl.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Mean performance across all runs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
