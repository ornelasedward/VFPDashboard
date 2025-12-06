import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeframeStats } from "@/lib/supabase/queries";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TimeframeOverviewProps {
  stats: TimeframeStats[];
}

export function TimeframeOverview({ stats }: TimeframeOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.timeframe} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{stat.timeframe.toUpperCase()} Timeframe</CardTitle>
              <Badge variant={stat.best_pnl > 0 ? "default" : "destructive"}>
                {stat.best_pnl > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {stat.best_pnl.toFixed(2)}%
              </Badge>
            </div>
            <CardDescription>{stat.total_runs} strategy runs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Best PnL</span>
                <span className={`font-bold ${stat.best_pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.best_pnl.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Win Rate</span>
                <span className="font-semibold">{stat.avg_win_rate.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Profit Factor</span>
                <span className="font-semibold">{stat.avg_profit_factor.toFixed(2)}</span>
              </div>
              
              {stat.best_config && (
                <div className="pt-3 border-t mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Best Configuration:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lookback:</span>
                      <span className="font-medium">{stat.best_config.lookback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primary:</span>
                      <span className="font-medium">{stat.best_config.primary_speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secondary:</span>
                      <span className="font-medium">{stat.best_config.secondary_speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trend:</span>
                      <span className="font-medium">{stat.best_config.trend_type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
