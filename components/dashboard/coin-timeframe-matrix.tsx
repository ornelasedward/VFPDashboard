"use client";

import { CoinTimeframeBest, StrategyResult } from "@/lib/types/strategy";
import { parsePercentage } from "@/lib/utils/parse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface CoinTimeframeMatrixProps {
  data: CoinTimeframeBest[];
}

export function CoinTimeframeMatrix({ data }: CoinTimeframeMatrixProps) {
  // Get unique tickers and timeframes
  const tickers = [...new Set(data.map(d => d.ticker))].sort();
  const timeframes = [...new Set(data.map(d => d.timeframe))].sort((a, b) => {
    // Sort timeframes numerically (2h, 3h, 4h, etc.)
    const getHours = (tf: string) => {
      if (tf.endsWith('h')) return parseInt(tf);
      if (tf.endsWith('d')) return parseInt(tf) * 24;
      return 0;
    };
    return getHours(a) - getHours(b);
  });

  // Create a lookup map for quick access
  const dataMap = new Map<string, CoinTimeframeBest>();
  data.forEach(d => {
    dataMap.set(`${d.ticker}-${d.timeframe}`, d);
  });

  const getCellData = (ticker: string, timeframe: string) => {
    return dataMap.get(`${ticker}-${timeframe}`);
  };

  const formatPnl = (strategy: StrategyResult | null | undefined) => {
    if (!strategy) return null;
    const pnl = parsePercentage(strategy.pnl);
    return pnl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Best Strategy by Coin & Timeframe
        </CardTitle>
        <CardDescription>
          Highest PnL strategy for each coin/timeframe. Click any cell to view details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left font-semibold border-b bg-muted/50">Coin</th>
                {timeframes.map(tf => (
                  <th key={tf} className="p-3 text-center font-semibold border-b bg-muted/50 min-w-[100px]">
                    {tf.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map(ticker => (
                <tr key={ticker} className="hover:bg-muted/30">
                  <td className="p-3 font-semibold border-b">
                    <Badge variant="outline">{ticker}</Badge>
                  </td>
                  {timeframes.map(tf => {
                    const cellData = getCellData(ticker, tf);
                    const strategy = cellData?.best_strategy;
                    const pnl = formatPnl(strategy);
                    const totalTested = cellData?.total_tested || 0;

                    if (!strategy) {
                      return (
                        <td key={tf} className="p-3 text-center border-b">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Minus className="h-4 w-4" />
                            <span className="text-xs mt-1">
                              {totalTested > 0 ? `${totalTested} tested` : 'No data'}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    const maxDD = Math.abs(parsePercentage(strategy.max_dd));

                    return (
                      <td key={tf} className="p-3 text-center border-b">
                        <Link
                          href={`/strategy/${strategy.id}?ticker=${encodeURIComponent(strategy.ticker)}&timeframe=${strategy.chart_tf}`}
                          className="block p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className={`flex items-center gap-1 text-lg font-bold ${
                              pnl !== null && pnl > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {pnl !== null && pnl > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {pnl?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              DD: {maxDD.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {totalTested.toLocaleString()} tested
                            </div>
                          </div>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
