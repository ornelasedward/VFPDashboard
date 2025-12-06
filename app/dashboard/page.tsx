import { Suspense } from "react";
import { getTimeframeStats, getTopPerformers, getRecentResults, getAllResults } from "@/lib/supabase/queries";
import { TimeframeOverview } from "@/components/dashboard/timeframe-overview";
import { TopPerformersTable } from "@/components/dashboard/top-performers-table";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";

async function DashboardContent() {
  const [timeframeStats, topPerformers, allResults, recentResults] = await Promise.all([
    getTimeframeStats(),
    getTopPerformers(20),
    getAllResults(),
    getRecentResults(100),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Strategy Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and compare performance across all VMs and timeframes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Live Data</span>
        </div>
      </div>

      {/* Performance Metrics Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Overall Performance Metrics
        </h2>
        <PerformanceMetrics results={allResults} />
      </section>

      {/* Timeframe Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Best Performers by Timeframe
        </h2>
        <TimeframeOverview stats={timeframeStats} />
      </section>

      {/* Top Performers Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 20 Performing Strategies
            </CardTitle>
            <CardDescription>
              Ranked by PnL across all timeframes and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopPerformersTable results={topPerformers} />
          </CardContent>
        </Card>
      </section>

      {/* Detailed Tabs by Timeframe */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Detailed Results by Timeframe</CardTitle>
            <CardDescription>
              View all strategy runs for each timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="2h" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="2h">2H</TabsTrigger>
                <TabsTrigger value="3h">3H</TabsTrigger>
                <TabsTrigger value="4h">4H</TabsTrigger>
                <TabsTrigger value="5h">5H</TabsTrigger>
                <TabsTrigger value="6h">6H</TabsTrigger>
              </TabsList>
              
              {['2h', '3h', '4h', '5h', '6h'].map((tf) => {
                const tfResults = recentResults.filter(r => r.chart_tf === tf);
                const tfStats = timeframeStats.find(s => s.timeframe === tf);
                
                return (
                  <TabsContent key={tf} value={tf} className="space-y-4">
                    {tfStats && (
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{tfStats.total_runs}</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Best PnL</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${tfStats.best_pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tfStats.best_pnl.toFixed(2)}%
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{tfStats.avg_win_rate.toFixed(1)}%</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Avg Profit Factor</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{tfStats.avg_profit_factor.toFixed(2)}</div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    <TopPerformersTable results={tfResults.slice(0, 10)} />
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
