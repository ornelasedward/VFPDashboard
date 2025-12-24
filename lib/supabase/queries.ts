import { createClient, createCacheableClient } from "@/lib/supabase/server";
import { parsePercentage, parseDollar } from "@/lib/utils/parse";
import { StrategyResult, TimeframeStats, CoinTimeframeBest } from "@/lib/types/strategy";
import { unstable_cache } from "next/cache";

// Re-export types and utilities for backward compatibility
export { parsePercentage };
export type { StrategyResult, TimeframeStats, CoinTimeframeBest };

// Table names
const UNIFIED_TABLE = 'trading_results_unified';
const TOP_TABLE = 'trading_results_unified_top'; // Pre-filtered: profit_factor >= 2.2 (~6,800 rows)

// Cache duration in seconds (1 hour = 3600 seconds)
const CACHE_DURATION = 3600;

export async function getTimeframeStats(): Promise<TimeframeStats[]> {
  const supabase = await createClient();
  
  console.log(`📊 Fetching timeframe stats from ${UNIFIED_TABLE}`);
  
  // Known timeframes - avoid fetching all rows just to discover them
  const knownTimeframes = ['2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d'];
  
  // For each timeframe, get count and best performer in parallel
  const stats: TimeframeStats[] = (await Promise.all(
    knownTimeframes.map(async (timeframe) => {
      // Get count for this timeframe
      const { count, error: countError } = await supabase
        .from(UNIFIED_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('chart_tf', timeframe);
      
      if (countError || !count || count === 0) {
        return null; // Skip timeframes with no data
      }
      
      // Get a sample to find best performer
      const { data: topResults, error } = await supabase
        .from(UNIFIED_TABLE)
        .select('*')
        .eq('chart_tf', timeframe)
        .limit(100);
      
      if (error || !topResults || topResults.length === 0) {
        return {
          timeframe,
          total_runs: count,
          best_pnl: 0,
          best_config: null,
        };
      }
      
      // Find best by profit factor
      let bestResult = topResults[0];
      let bestProfitFactor = parseFloat(topResults[0].profit_factor || '0');
      
      topResults.forEach((result: any) => {
        const pf = parseFloat(result.profit_factor || '0');
        if (pf > bestProfitFactor) {
          bestProfitFactor = pf;
          bestResult = result;
        }
      });
      
      return {
        timeframe,
        total_runs: count,
        best_pnl: parsePercentage(bestResult.pnl),
        best_config: bestResult as StrategyResult,
      };
    })
  )).filter((stat): stat is TimeframeStats => stat !== null);
  
  console.log(`✅ Found ${stats.length} timeframes with data`);
  
  return stats.sort((a, b) => a.timeframe.localeCompare(b.timeframe));
}

// Only fetch fields needed for table display and filtering
const TABLE_FIELDS = 'id,vm_id,ticker,chart_tf,pnl,win_rate,profit_factor,max_dd,trades,lookback,primary_speed,secondary_speed,smoothing_type,trend_type';

// Fetches all top performers from the pre-filtered TOP_TABLE (~6,800 rows)
export async function getTopPerformers(): Promise<StrategyResult[]> {
  const supabase = createCacheableClient();
  
  console.log(`🏆 Fetching all performers from ${TOP_TABLE}...`);
  
  const allResults: StrategyResult[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  // Fetch all rows from the pre-filtered table
  while (true) {
    const { data, error } = await supabase
      .from(TOP_TABLE)
      .select(TABLE_FIELDS)
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error(`Error fetching data:`, error.message);
      break;
    } else if (!data || data.length === 0) {
      break;
    } else {
      allResults.push(...(data as StrategyResult[]));
      offset += pageSize;
      
      if (data.length < pageSize) break; // No more data
    }
  }
  
  console.log(`📊 Total strategies fetched: ${allResults.length}`);
  
  // Sort by PnL descending
  return allResults.sort((a, b) => parsePercentage(b.pnl) - parsePercentage(a.pnl));
}

export async function getTopPerformersByTimeframe(timeframe: string, limit: number = 20): Promise<StrategyResult[]> {
  const supabase = await createClient();
  
  console.log(`🔍 Fetching top ${limit} for timeframe ${timeframe}`);
  
  // Fetch a sample and sort client-side
  const sampleSize = Math.max(limit * 25, 200);
  
  const { data, error } = await supabase
    .from(UNIFIED_TABLE)
    .select('*')
    .eq('chart_tf', timeframe)
    .limit(sampleSize);
  
  if (error) {
    console.error(`Error fetching results from ${UNIFIED_TABLE}:`, error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Sort by profit factor (descending) and return top performers
  const sorted = (data as StrategyResult[])
    .sort((a, b) => {
      const pfA = parseFloat(a.profit_factor || '0');
      const pfB = parseFloat(b.profit_factor || '0');
      return pfB - pfA;
    })
    .slice(0, limit);
  
  console.log(`🎯 Returning top ${sorted.length} performers for ${timeframe}`);
  
  return sorted;
}

export async function getTotalResultsCount(): Promise<number> {
  const supabase = await createClient();
  
  console.log(`📊 Fetching count from ${TOP_TABLE}...`);
  
  const { count, error } = await supabase
    .from(TOP_TABLE)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error(`❌ Error fetching count from ${TOP_TABLE}:`, error);
    return 0;
  }
  
  console.log(`📊 Total results count: ${count}`);
  
  return count || 0;
}

export async function getRecentResults(limit: number = 50): Promise<StrategyResult[]> {
  const supabase = await createClient();
  
  console.log(`📅 Fetching recent results from ${UNIFIED_TABLE}...`);
  
  const { data: results, error } = await supabase
    .from(UNIFIED_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error(`❌ Error fetching from ${UNIFIED_TABLE}:`, error);
    return [];
  }
  
  console.log(`✨ Returning ${results?.length || 0} most recent results`);
  
  return (results || []) as StrategyResult[];
}

/**
 * Compute best strategy for each coin + timeframe from already-fetched data
 * This avoids duplicate DB calls - just processes the data in memory
 */
export function computeBestStrategiesFromData(allStrategies: StrategyResult[]): CoinTimeframeBest[] {
  const tickers = [...new Set(allStrategies.map(s => s.ticker))].sort();
  const timeframes = ['2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d'];
  
  const results: CoinTimeframeBest[] = [];
  
  for (const ticker of tickers) {
    for (const timeframe of timeframes) {
      const strategies = allStrategies.filter(s => s.ticker === ticker && s.chart_tf === timeframe);
      
      if (strategies.length === 0) {
        results.push({ ticker, timeframe, best_strategy: null, total_tested: 0 });
        continue;
      }
      
      // Find highest PnL
      let bestStrategy: StrategyResult | null = null;
      let bestPnl = -Infinity;
      
      strategies.forEach(strategy => {
        const pnl = parsePercentage(strategy.pnl);
        if (pnl > bestPnl) {
          bestPnl = pnl;
          bestStrategy = strategy;
        }
      });
      
      results.push({ ticker, timeframe, best_strategy: bestStrategy, total_tested: strategies.length });
    }
  }
  
  return results.sort((a, b) => {
    if (a.ticker !== b.ticker) return a.ticker.localeCompare(b.ticker);
    return a.timeframe.localeCompare(b.timeframe);
  });
}

// Cached version of getUniqueTickers
export const getUniqueTickers = unstable_cache(
  async (): Promise<string[]> => {
    console.log(`🎯 Fetching unique tickers (will be cached for ${CACHE_DURATION}s)...`);
    return getUniqueTickersUncached();
  },
  ['unique-tickers'],
  { revalidate: CACHE_DURATION, tags: ['strategies'] }
);

// Uncached implementation
async function getUniqueTickersUncached(): Promise<string[]> {
  const supabase = createCacheableClient();
  
  // Known tickers that we're testing - check which ones have data
  const knownTickers = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT'];
  
  const tickersWithData: string[] = [];
  
  // Check each known ticker for existence
  await Promise.all(
    knownTickers.map(async (ticker) => {
      const { count, error } = await supabase
        .from(UNIFIED_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('ticker', ticker);
      
      if (!error && count && count > 0) {
        tickersWithData.push(ticker);
        console.log(`  ✓ ${ticker}: ${count} records`);
      }
    })
  );
  
  const tickers = tickersWithData.sort();
  console.log(`✅ Found ${tickers.length} tickers with data:`, tickers);
  
  return tickers;
}
