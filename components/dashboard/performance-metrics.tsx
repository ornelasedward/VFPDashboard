import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyResult } from "@/lib/supabase/queries";
import { Activity, TrendingUp, Target, BarChart3, Percent, DollarSign, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PerformanceMetricsProps {
  results: StrategyResult[];
  selectedTicker?: string | null;
}

export function PerformanceMetrics({ results, selectedTicker }: PerformanceMetricsProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Ensure component is ready before rendering links
  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, [results, selectedTicker]);
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    // Replace Unicode minus sign (−) with regular minus (-)
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const parseNumber = (value: string | null): number => {
    if (!value) return 0;
    // Replace Unicode minus sign (−) with regular minus (-)
    const normalized = value.replace(/−/g, '-');
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = normalized.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };
  
  const parseDollar = (value: string | null): number => {
    if (!value) return 0;
    // Replace Unicode minus sign (−) with regular minus (-)
    const normalized = value.replace(/−/g, '-');
    // Remove $, commas, and other formatting, keep numbers and decimal
    const cleaned = normalized.replace(/[$,]/g, '').trim();
    return parseFloat(cleaned) || 0;
  };

  // Calculate best performance metrics
  const totalRuns = results.length;
  
  // Safety check for empty results
  if (results.length === 0) {
    return <div className="text-muted-foreground">No strategies found</div>;
  }
  
  // Don't render links until state is synchronized
  if (!isReady) {
    return <div className="text-muted-foreground">Loading...</div>;
  }
  
  const profitableStrategies = results.filter(r => parsePercentage(r.pnl) > 0).length;
  const profitablePercentage = (profitableStrategies / totalRuns) * 100;

  const STARTING_CAPITAL = 100000; // Starting capital in dollars
  
  const bestPnl = Math.max(...results.map(r => parsePercentage(r.pnl)));
  const bestWinRate = Math.max(...results.map(r => parsePercentage(r.win_rate)));
  const bestProfitFactor = Math.max(...results.map(r => parseNumber(r.profit_factor)));
  
  // Find lowest max drawdown (excluding zero/invalid values)
  const validDrawdowns = results
    .map(r => Math.abs(parsePercentage(r.max_dd)))
    .filter(dd => dd > 0); // Filter out zero values
  const bestMaxDD = validDrawdowns.length > 0 ? Math.min(...validDrawdowns) : 0;
  
  // Calculate dollar PnL based on percentage PnL and starting capital
  const bestDollarPnl = Math.max(...results.map(r => {
    const pnlPercent = parsePercentage(r.pnl);
    return STARTING_CAPITAL * (pnlPercent / 100);
  }));
  
  // Find the strategy with the best PnL for context
  const topStrategy = results.reduce((best, current) => 
    parsePercentage(current.pnl) > parsePercentage(best.pnl) ? current : best
  , results[0]);
  
  // Find the strategy with the best dollar PnL (same as best PnL % since capital is constant)
  const topDollarStrategy = topStrategy;
  
  // Debug logging
  console.log('🔍 PerformanceMetrics - Final State:', {
    selectedTicker,
    isReady,
    totalResults: results.length,
    bestPnl,
    topStrategy: {
      id: topStrategy.id,
      ticker: topStrategy.ticker,
      chart_tf: topStrategy.chart_tf,
      pnl_raw: topStrategy.pnl,
      pnl_parsed: parsePercentage(topStrategy.pnl),
    },
    linkHref: `/strategy/${topStrategy.id}`,
    firstThreeResults: results.slice(0, 3).map(r => ({
      id: r.id,
      ticker: r.ticker,
      pnl: r.pnl,
      pnl_parsed: parsePercentage(r.pnl)
    }))
  });
  
  // Verify the top strategy matches the selected ticker filter
  if (selectedTicker && topStrategy.ticker !== selectedTicker) {
    console.error('❌ TICKER MISMATCH!', {
      selectedTicker,
      topStrategyTicker: topStrategy.ticker,
      topStrategyId: topStrategy.id,
      message: 'The top strategy does NOT match the selected ticker filter!'
    });
  }

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

      <Link key={`pnl-${topStrategy.id}`} href={`/strategy/${topStrategy.id}?ticker=${encodeURIComponent(topStrategy.ticker)}&timeframe=${topStrategy.chart_tf}`}>
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
              {topStrategy.ticker} • {topStrategy.chart_tf} timeframe • Click for details
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
          <div className={`text-2xl font-bold ${
            bestMaxDD < 15 ? 'text-green-600' :
            bestMaxDD < 30 ? 'text-yellow-600' :
            bestMaxDD < 50 ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {bestMaxDD.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Best risk control
          </p>
        </CardContent>
      </Card>

      <Link key={`dollar-${topDollarStrategy.id}`} href={`/strategy/${topDollarStrategy.id}?ticker=${encodeURIComponent(topDollarStrategy.ticker)}&timeframe=${topDollarStrategy.chart_tf}`}>
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
              {topDollarStrategy.ticker} • {topDollarStrategy.chart_tf} timeframe • Click for details
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
