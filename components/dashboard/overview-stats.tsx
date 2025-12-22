"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyResult } from "@/lib/types/strategy";
import { Activity, Trophy } from "lucide-react";

interface OverviewStatsProps {
  results: StrategyResult[];
  totalCount?: number;
}

export function OverviewStats({ results, totalCount }: OverviewStatsProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const totalRuns = totalCount ?? results.length;
  const profitableStrategies = results.filter(r => parsePercentage(r.pnl) > 0).length;
  const profitablePercentage = totalRuns > 0 ? (profitableStrategies / totalRuns) * 100 : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
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

      </div>
  );
}
