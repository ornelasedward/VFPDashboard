import { createClient } from "@/lib/supabase/server";
import { StrategyResult } from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/dashboard/nav";
import { ArrowLeft, TrendingUp, Target, BarChart3, Calendar, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getStrategyById(id: string, ticker?: string, timeframe?: string): Promise<StrategyResult | null> {
  const supabase = await createClient();
  
  // Import the dynamic table discovery function
  const { getTableNames } = await import("@/lib/supabase/queries");
  const tableNames = await getTableNames();
  
  console.log('🔍 Searching for strategy:', { id, ticker, timeframe, tables: tableNames });
  
  // Search each table for the strategy
  for (const tableName of tableNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (data && !error) {
      // If ticker and timeframe are provided, verify they match
      if (ticker && timeframe) {
        if (data.ticker === ticker && data.chart_tf === timeframe) {
          console.log('✅ Found matching strategy in table:', tableName);
          return data as StrategyResult;
        } else {
          console.log('⚠️ Found ID in', tableName, 'but ticker/timeframe mismatch. Continuing search...');
          continue;
        }
      } else {
        // No filter provided, return first match
        console.log('✅ Found strategy in table:', tableName);
        return data as StrategyResult;
      }
    }
  }
  
  console.log('❌ Strategy not found in any table');
  return null;
}

export default async function StrategyDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ticker?: string; timeframe?: string }>;
}) {
  const { id } = await params;
  const { ticker, timeframe } = await searchParams;
  
  console.log('🔍 Strategy Page - Request:', { id, ticker, timeframe });
  
  const strategy = await getStrategyById(id, ticker, timeframe);
  
  console.log('🔍 Strategy Page - Found Strategy:', {
    id: strategy?.id,
    ticker: strategy?.ticker,
    chart_tf: strategy?.chart_tf,
    pnl: strategy?.pnl,
  });
  
  if (!strategy) {
    notFound();
  }
  
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
    return parseFloat(normalized.replace(/[^0-9.-]/g, '')) || 0;
  };

  const STARTING_CAPITAL = 100000; // Starting capital in dollars
  const pnl = parsePercentage(strategy.pnl);
  const winRate = parsePercentage(strategy.win_rate);
  const profitFactor = parseNumber(strategy.profit_factor);
  const maxDD = parsePercentage(strategy.max_dd);
  const netProfit = STARTING_CAPITAL * (pnl / 100); // Calculate net profit from PnL %

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
              {/* Header with Back Button */}
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back to Dashboard
                </Link>
              </div>

              {/* Strategy Title */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Strategy Details</h1>
                <p className="text-muted-foreground mt-1">
                  Complete performance data for {strategy.ticker} on {strategy.chart_tf} timeframe
                </p>
              </div>

              {/* Key Performance Metrics */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Performance Metrics
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">PnL (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Net Profit ($)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{winRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{profitFactor.toFixed(2)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">-{Math.abs(maxDD).toFixed(2)}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{strategy.trades}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{strategy.sharpe_ratio}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sortino Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{strategy.sortino_ratio}</div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Strategy Configuration */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Strategy Configuration
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ticker</p>
                        <p className="text-lg font-semibold">{strategy.ticker}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Exchange</p>
                        <p className="text-lg font-semibold">{strategy.exchange}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Timeframe</p>
                        <p className="text-lg font-semibold">{strategy.chart_tf}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lookback Period</p>
                        <p className="text-lg font-semibold">{strategy.lookback}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Primary Speed</p>
                        <p className="text-lg font-semibold">{strategy.primary_speed}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Secondary Speed</p>
                        <p className="text-lg font-semibold">{strategy.secondary_speed}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Trend Type</p>
                        <p className="text-lg font-semibold">{strategy.trend_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Smoothing Type</p>
                        <p className="text-lg font-semibold">{strategy.smoothing_type}</p>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-muted-foreground">Resolutions</p>
                        <p className="text-lg font-semibold break-words">{strategy.resolutions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Backtest Period */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Backtest Period
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p className="text-lg font-semibold">{new Date(strategy.date_start).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">End Date</p>
                        <p className="text-lg font-semibold">{new Date(strategy.date_end).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created At</p>
                        <p className="text-lg font-semibold">{new Date(strategy.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Trade Analysis */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trade Analysis
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Long Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Long Trades:</span>
                        <span className="font-semibold">{strategy.total_long_trades}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Short Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Short Trades:</span>
                        <span className="font-semibold">{strategy.total_short_trades}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Winning Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Winning Trades:</span>
                        <span className="font-semibold text-green-600">{strategy.winning_trades_all}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Win Trade:</span>
                        <span className="font-semibold text-green-600">{strategy.avg_win_trade_all}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Losing Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Losing Trades:</span>
                        <span className="font-semibold text-red-600">{strategy.losing_trades_all}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Loss Trade:</span>
                        <span className="font-semibold text-red-600">{strategy.avg_loss_trade_all}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Benchmark Comparison */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Benchmark Comparison
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Buy & Hold Performance</p>
                        <p className="text-2xl font-bold">{strategy.buy_hold}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Strategy vs Buy & Hold</p>
                        <p className={`text-2xl font-bold ${pnl > parsePercentage(strategy.buy_hold) ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl > parsePercentage(strategy.buy_hold) ? 'Outperforming' : 'Underperforming'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
          </div>
        </div>
      </main>
    </div>
  );
}
