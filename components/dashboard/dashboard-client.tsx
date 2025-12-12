"use client";

import { useState, useMemo } from "react";
import { StrategyResult, TimeframeStats } from "@/lib/supabase/queries";
import { TimeframeOverview } from "@/components/dashboard/timeframe-overview";
import { TopPerformersTable } from "@/components/dashboard/top-performers-table";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { BestStrategyShowcase } from "@/components/dashboard/best-strategy-showcase";
import { StrategyFiltersComponent, StrategyFilters } from "@/components/dashboard/strategy-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Award } from "lucide-react";

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
  const [filters, setFilters] = useState<StrategyFilters>({
    maxDrawdown: 30,
    minPnl: -100,
    maxPnl: 10000,
    minWinRate: 0,
    ticker: null,
  });

  // Helper function to parse percentages
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const normalized = value.replace(/−/g, '-');
    const cleaned = normalized.replace('%', '').trim();
    return parseFloat(cleaned) || 0;
  };

  // Apply all filters to results
  const filteredResults = useMemo(() => {
    return allResults.filter(r => {
      // Ticker filter
      if (filters.ticker && r.ticker !== filters.ticker) return false;
      
      // Max drawdown filter
      const maxDD = Math.abs(parsePercentage(r.max_dd));
      if (maxDD > filters.maxDrawdown) return false;
      
      // PnL range filter
      const pnl = parsePercentage(r.pnl);
      if (pnl < filters.minPnl || pnl > filters.maxPnl) return false;
      
      // Win rate filter
      const winRate = parsePercentage(r.win_rate);
      if (winRate < filters.minWinRate) return false;
      
      return true;
    });
  }, [allResults, filters]);

  const filteredTopPerformers = useMemo(() => {
    return filteredResults
      .sort((a, b) => parsePercentage(b.pnl) - parsePercentage(a.pnl))
      .slice(0, 20);
  }, [filteredResults]);

  const filteredTimeframeStats = useMemo(() => {
    return timeframeStats.map(stat => {
      const timeframeFiltered = filteredResults.filter(
        r => r.chart_tf === stat.timeframe
      );
      
      if (timeframeFiltered.length === 0) {
        return { ...stat, total_runs: 0, best_pnl: 0, best_config: null };
      }

      // Find best performer by profit factor
      let bestResult = timeframeFiltered[0];
      let bestProfitFactor = parseFloat(timeframeFiltered[0].profit_factor || '0');
      
      timeframeFiltered.forEach((result: StrategyResult) => {
        const profitFactor = parseFloat(result.profit_factor || '0');
        if (profitFactor > bestProfitFactor) {
          bestProfitFactor = profitFactor;
          bestResult = result;
        }
      });

      const bestPnl = parsePercentage(bestResult.pnl);

      return {
        ...stat,
        total_runs: timeframeFiltered.length,
        best_pnl: bestPnl,
        best_config: bestResult,
      };
    });
  }, [timeframeStats, filteredResults]);

  const filteredTimeframeTopPerformers = useMemo(() => {
    return timeframeTopPerformers.map(({ timeframe }) => {
      // Use already-filtered results and filter by timeframe
      const timeframeResults = filteredResults.filter(r => r.chart_tf === timeframe);
      
      // Sort by profit factor (descending) and take top 20
      const sorted = timeframeResults
        .sort((a, b) => {
          const pfA = parseFloat(a.profit_factor || '0');
          const pfB = parseFloat(b.profit_factor || '0');
          return pfB - pfA;
        })
        .slice(0, 20);
      
      return {
        timeframe,
        results: sorted,
      };
    });
  }, [timeframeTopPerformers, filteredResults]);

  // Find the first timeframe with data
  const defaultTimeframe = useMemo(() => {
    const firstWithData = filteredTimeframeTopPerformers.find(
      ({ results }) => results.length > 0
    );
    
    return firstWithData?.timeframe || filteredTimeframeTopPerformers[0]?.timeframe || "2h";
  }, [filteredTimeframeTopPerformers]);

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

      {/* Strategy Filters */}
      <section>
        <StrategyFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          availableTickers={availableTickers}
        />
      </section>

      {/* Overview Statistics */}
      <section>
        <OverviewStats results={filteredResults} />
      </section>

      {/* Best Strategy Showcase */}
      {filteredTopPerformers.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Strategy
          </h2>
          <BestStrategyShowcase strategy={filteredTopPerformers[0]} />
        </section>
      )}

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
              {filters.ticker && ` • ${filters.ticker}`}
              {filters.maxDrawdown < 100 && ` • Max DD ≤${filters.maxDrawdown}%`}
              {filters.minWinRate > 0 && ` • Win Rate ≥${filters.minWinRate}%`}
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
              {filters.ticker && ` • ${filters.ticker}`}
              {filters.maxDrawdown < 100 && ` • Max DD ≤${filters.maxDrawdown}%`}
              {filters.minWinRate > 0 && ` • Win Rate ≥${filters.minWinRate}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs key={JSON.stringify(filters)} defaultValue={defaultTimeframe} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(filteredTimeframeTopPerformers.length, 8)}, minmax(0, 1fr))` }}>
                {filteredTimeframeTopPerformers.map(({ timeframe, results }) => (
                  <TabsTrigger 
                    key={timeframe} 
                    value={timeframe}
                    disabled={results.length === 0}
                    className={results.length === 0 ? 'opacity-50' : ''}
                  >
                    {timeframe.toUpperCase()}
                    {results.length > 0 && <span className="ml-1 text-xs">({results.length})</span>}
                  </TabsTrigger>
                ))}
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
