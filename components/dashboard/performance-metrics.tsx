import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyResult } from "@/lib/supabase/queries";
import { Activity, TrendingUp, Target, BarChart3, Percent, DollarSign } from "lucide-react";

interface PerformanceMetricsProps {
  results: StrategyResult[];
}

export function PerformanceMetrics({ results }: PerformanceMetricsProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const cleaned = value.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const parseNumber = (value: string | null): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  };

  // Calculate aggregate metrics
  const totalRuns = results.length;
  
  const avgPnl = results.reduce((sum, r) => sum + parsePercentage(r.pnl), 0) / totalRuns;
  const avgWinRate = results.reduce((sum, r) => sum + parsePercentage(r.win_rate), 0) / totalRuns;
  const avgProfitFactor = results.reduce((sum, r) => sum + parseNumber(r.profit_factor), 0) / totalRuns;
  const avgMaxDD = results.reduce((sum, r) => sum + Math.abs(parsePercentage(r.max_dd)), 0) / totalRuns;
  
  const profitableStrategies = results.filter(r => parsePercentage(r.pnl) > 0).length;
  const profitablePercentage = (profitableStrategies / totalRuns) * 100;

  const bestPnl = Math.max(...results.map(r => parsePercentage(r.pnl)));
  const worstPnl = Math.min(...results.map(r => parsePercentage(r.pnl)));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Strategy Runs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRuns}</div>
          <p className="text-xs text-muted-foreground">
            {profitablePercentage.toFixed(1)}% profitable
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average PnL</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${avgPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {avgPnl.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Range: {worstPnl.toFixed(2)}% to {bestPnl.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Win Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Across all timeframes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Profit Factor</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgProfitFactor.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {avgProfitFactor > 1 ? 'Profitable' : 'Unprofitable'} on average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Max Drawdown</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{avgMaxDD.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            Risk metric
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitable Strategies</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{profitableStrategies}</div>
          <p className="text-xs text-muted-foreground">
            Out of {totalRuns} total runs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
