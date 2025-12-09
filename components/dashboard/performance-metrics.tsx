import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyResult } from "@/lib/supabase/queries";
import { Activity, TrendingUp, Target, BarChart3, Percent, DollarSign, Trophy } from "lucide-react";
import Link from "next/link";

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

  // Calculate best performance metrics
  const totalRuns = results.length;
  
  const profitableStrategies = results.filter(r => parsePercentage(r.pnl) > 0).length;
  const profitablePercentage = (profitableStrategies / totalRuns) * 100;

  const bestPnl = Math.max(...results.map(r => parsePercentage(r.pnl)));
  const bestWinRate = Math.max(...results.map(r => parsePercentage(r.win_rate)));
  const bestProfitFactor = Math.max(...results.map(r => parseNumber(r.profit_factor)));
  const bestMaxDD = Math.min(...results.map(r => Math.abs(parsePercentage(r.max_dd))));
  const bestDollarPnl = Math.max(...results.map(r => parseNumber(r.net_profit_all)));
  
  // Find the strategy with the best PnL for context
  const topStrategy = results.reduce((best, current) => 
    parsePercentage(current.pnl) > parsePercentage(best.pnl) ? current : best
  , results[0]);
  
  // Find the strategy with the best dollar PnL
  const topDollarStrategy = results.reduce((best, current) => 
    parseNumber(current.net_profit_all) > parseNumber(best.net_profit_all) ? current : best
  , results[0]);

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

      <Link href={`/strategy/${topStrategy.id}`}>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest PnL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${bestPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {bestPnl.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {topStrategy.chart_tf} timeframe • Click for details
            </p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Win Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bestWinRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Best across all strategies
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Profit Factor</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bestProfitFactor.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Peak performance ratio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lowest Max Drawdown</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">-{bestMaxDD.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            Best risk control
          </p>
        </CardContent>
      </Card>

      <Link href={`/strategy/${topDollarStrategy.id}`}>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Dollar PnL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${bestDollarPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${bestDollarPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {topDollarStrategy.chart_tf} timeframe • Click for details
            </p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitable Strategies</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
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
