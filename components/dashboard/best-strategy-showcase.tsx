"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrategyResult } from "@/lib/types/strategy";
import { TrendingUp, Target, BarChart3, Percent, DollarSign, Award } from "lucide-react";
import Link from "next/link";

interface BestStrategyShowcaseProps {
  strategy: StrategyResult;
}

export function BestStrategyShowcase({ strategy }: BestStrategyShowcaseProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  const parseNumber = (value: string | null): number => {
    if (!value) return 0;
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const STARTING_CAPITAL = 100000;
  const pnl = parsePercentage(strategy.pnl);
  const maxDD = Math.abs(parsePercentage(strategy.max_dd));
  const winRate = parsePercentage(strategy.win_rate);
  const profitFactor = parseNumber(strategy.profit_factor);
  const dollarPnl = STARTING_CAPITAL * (pnl / 100);

  const strategyLink = `/strategy/${strategy.id}?ticker=${encodeURIComponent(strategy.ticker)}&timeframe=${strategy.chart_tf}`;

  return (
    <Link href={strategyLink}>
      <Card className="cursor-pointer hover:bg-muted/50 transition-all hover:shadow-lg border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-yellow-500" />
              <div>
                <CardTitle className="text-xl">Best Performing Strategy</CardTitle>
                <CardDescription className="mt-1">
                  Click to view full details and configuration
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-base px-3 py-1">
                {strategy.ticker}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {strategy.chart_tf}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* PnL */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>PnL</span>
              </div>
              <div className={`text-2xl font-bold ${pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnl.toFixed(2)}%
              </div>
            </div>

            {/* Dollar PnL */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Dollar PnL</span>
              </div>
              <div className={`text-2xl font-bold ${dollarPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${dollarPnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span>Max Drawdown</span>
              </div>
              <div className={`text-2xl font-bold ${
                maxDD < 15 ? 'text-green-600' :
                maxDD < 30 ? 'text-yellow-600' :
                maxDD < 50 ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {maxDD.toFixed(2)}%
              </div>
            </div>

            {/* Win Rate */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Win Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {winRate.toFixed(1)}%
              </div>
            </div>

            {/* Profit Factor */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Profit Factor</span>
              </div>
              <div className="text-2xl font-bold">
                {profitFactor.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Trades:</span>
                <span className="ml-2 font-semibold">{strategy.trades}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Lookback:</span>
                <span className="ml-2 font-semibold">{strategy.lookback}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Trend Type:</span>
                <span className="ml-2 font-semibold">{strategy.trend_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sharpe Ratio:</span>
                <span className="ml-2 font-semibold">{strategy.sharpe_ratio}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
