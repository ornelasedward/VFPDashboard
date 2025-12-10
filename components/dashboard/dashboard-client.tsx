"use client";

import { useState, useMemo } from "react";
import { StrategyResult, TimeframeStats } from "@/lib/supabase/queries";
import { TimeframeOverview } from "@/components/dashboard/timeframe-overview";
import { TopPerformersTable } from "@/components/dashboard/top-performers-table";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { TickerFilter } from "@/components/dashboard/ticker-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";

interface DashboardClientProps {
  timeframeStats: TimeframeStats[];
  topPerformers: StrategyResult[];
  allResults: StrategyResult[];
  timeframeTopPerformers: Array<{
    timeframe: string;
    results: StrategyResult[];
  }>;
  availableTickers: string[];
}

export function DashboardClient({
  timeframeStats,
  topPerformers,
  allResults,
  timeframeTopPerformers,
  availableTickers,
}: DashboardClientProps) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // Filter results based on selected ticker
  const filteredResults = useMemo(() => {
    if (!selectedTicker) return allResults;
    return allResults.filter(r => r.ticker === selectedTicker);
  }, [allResults, selectedTicker]);

  const filteredTopPerformers = useMemo(() => {
    if (!selectedTicker) return topPerformers;
    return topPerformers.filter(r => r.ticker === selectedTicker);
  }, [topPerformers, selectedTicker]);

  const filteredTimeframeStats = useMemo(() => {
    if (!selectedTicker) return timeframeStats;
    
    const parsePercentage = (value: string | null): number => {
      if (!value) return 0;
      const cleaned = value.replace('%', '').trim();
      return parseFloat(cleaned) || 0;
    };
    
    return timeframeStats.map(stat => {
      const filteredResults: StrategyResult[] = allResults.filter(
        r => r.chart_tf === stat.timeframe && r.ticker === selectedTicker
      );
      
      if (filteredResults.length === 0) {
        return { ...stat, total_runs: 0, best_pnl: 0, best_config: null };
      }

      // Find best performer by profit factor
      let bestResult = filteredResults[0];
      let bestProfitFactor = parseFloat(filteredResults[0].profit_factor || '0');
      
      filteredResults.forEach((result: StrategyResult) => {
        const profitFactor = parseFloat(result.profit_factor || '0');
        if (profitFactor > bestProfitFactor) {
          bestProfitFactor = profitFactor;
          bestResult = result;
        }
      });

      const bestPnl = parsePercentage(bestResult.pnl);

      return {
        ...stat,
        total_runs: filteredResults.length,
        best_pnl: bestPnl,
        best_config: bestResult,
      };
    });
  }, [timeframeStats, allResults, selectedTicker]);

  const filteredTimeframeTopPerformers = useMemo(() => {
    if (!selectedTicker) return timeframeTopPerformers;
    return timeframeTopPerformers.map(({ timeframe, results }) => ({
      timeframe,
      results: results.filter(r => r.ticker === selectedTicker),
    }));
  }, [timeframeTopPerformers, selectedTicker]);

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

      {/* Ticker Filter */}
      <section>
        <TickerFilter
          tickers={availableTickers}
          selectedTicker={selectedTicker}
          onTickerChange={setSelectedTicker}
        />
      </section>

      {/* Performance Metrics Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Peak Performance Highlights
        </h2>
        <PerformanceMetrics results={filteredResults} />
      </section>

      {/* Timeframe Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Best Performers by Timeframe
        </h2>
        <TimeframeOverview stats={filteredTimeframeStats} />
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
              {selectedTicker && ` • Filtered by ${selectedTicker}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopPerformersTable results={filteredTopPerformers.slice(0, 20)} />
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
              {selectedTicker && ` • Filtered by ${selectedTicker}`}
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
              
              {filteredTimeframeTopPerformers.map(({ timeframe, results }) => {
                const tfStats = filteredTimeframeStats.find(s => s.timeframe === timeframe);
                
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
