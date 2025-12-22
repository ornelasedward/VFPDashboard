import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeframeStats } from "@/lib/types/strategy";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface TimeframeOverviewProps {
  stats: TimeframeStats[];
}

export function TimeframeOverview({ stats }: TimeframeOverviewProps) {
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    // Replace Unicode minus sign (−) with regular minus (-)
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        // Show card even if no results match current filters
        if (!stat.best_config) {
          return (
            <Card key={stat.timeframe} className="h-full opacity-60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stat.timeframe.toUpperCase()} Timeframe</CardTitle>
                  <Badge variant="outline">No Results</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-center">
                  <p className="text-sm text-muted-foreground">
                    No strategies match current filters for this timeframe
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        
        const pnl = stat.best_pnl;
        const winRate = parsePercentage(stat.best_config.win_rate);
        const profitFactor = parseFloat(stat.best_config.profit_factor || '0');
        const maxDD = parsePercentage(stat.best_config.max_dd);
        const trades = stat.best_config.trades;
        
        return (
          <Link key={stat.timeframe} href={`/strategy/${stat.best_config.id}?ticker=${encodeURIComponent(stat.best_config.ticker)}&timeframe=${stat.best_config.chart_tf}`}>
            <Card className="hover:shadow-lg transition-all hover:bg-muted/50 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stat.timeframe.toUpperCase()} Timeframe</CardTitle>
                  <Badge variant={pnl > 0 ? "default" : "destructive"}>
                    {pnl > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    Best
                  </Badge>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="font-semibold">{stat.best_config.ticker}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">PnL</span>
                    <span className={`font-bold text-lg ${pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnl.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profit Factor</span>
                    <span className="font-semibold">{profitFactor.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-semibold">{winRate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <span className={`font-semibold ${
                      Math.abs(maxDD) < 15 ? 'text-green-600' :
                      Math.abs(maxDD) < 30 ? 'text-yellow-600' :
                      Math.abs(maxDD) < 50 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {Math.abs(maxDD).toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground"># of Trades</span>
                    <span className="font-semibold">{trades}</span>
                  </div>
                  
                  <div className="pt-2 mt-2 border-t text-xs text-muted-foreground text-center">
                    Click to view full details
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
