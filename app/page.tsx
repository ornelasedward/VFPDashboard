import { Suspense } from "react";
import { getTimeframeStats, getTopPerformers, getAllResults, getTopPerformersByTimeframe } from "@/lib/supabase/queries";
import { TimeframeOverview } from "@/components/dashboard/timeframe-overview";
import { TopPerformersTable } from "@/components/dashboard/top-performers-table";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/nav";

async function DashboardContent() {
  const [timeframeStats, topPerformers, allResults] = await Promise.all([
    getTimeframeStats(),
    getTopPerformers(20),
    getAllResults(),
  ]);
  
  // Fetch top 20 performers for each timeframe
  const timeframeTopPerformers = await Promise.all(
    ['2h', '3h', '4h', '5h', '6h', 'fixed'].map(async (tf) => ({
      timeframe: tf,
      results: await getTopPerformersByTimeframe(tf, 20)
    }))
  );

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
          Peak Performance Highlights
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
            <CardTitle>Top 20 Performers by Timeframe</CardTitle>
            <CardDescription>
              Best performing strategies sorted by profit factor (highest to lowest)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="2h" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="2h">2H</TabsTrigger>
                <TabsTrigger value="3h">3H</TabsTrigger>
                <TabsTrigger value="4h">4H</TabsTrigger>
                <TabsTrigger value="5h">5H</TabsTrigger>
                <TabsTrigger value="6h">6H</TabsTrigger>
                <TabsTrigger value="fixed">Fixed</TabsTrigger>
              </TabsList>
              
              {timeframeTopPerformers.map(({ timeframe, results }) => {
                const tfStats = timeframeStats.find(s => s.timeframe === timeframe);
                
                return (
                  <TabsContent key={timeframe} value={timeframe} className="space-y-4">
                    {tfStats && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Strategy Runs</p>
                          <p className="text-2xl font-bold">{tfStats.total_runs.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Showing Top 20 by Profit Factor</p>
                          <p className="text-lg font-semibold">{results.length} strategies</p>
                        </div>
                      </div>
                    )}
                    <TopPerformersTable results={results} />
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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <main className="flex-1">
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
      </main>
    </div>
  );
}
