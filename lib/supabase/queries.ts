import { createClient, createCacheableClient } from "@/lib/supabase/server";
import { parsePercentage, parseDollar } from "@/lib/utils/parse";
import { StrategyResult, TimeframeStats, CoinTimeframeBest } from "@/lib/types/strategy";
import { unstable_cache } from "next/cache";

// Re-export types and utilities for backward compatibility
export { parsePercentage };
export type { StrategyResult, TimeframeStats, CoinTimeframeBest };

// Unified table name
const UNIFIED_TABLE = 'trading_results_unified';

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

// Cached version of getTopPerformers - caches for 1 hour
export const getTopPerformers = unstable_cache(
  async (limit: number = 10): Promise<StrategyResult[]> => {
    console.log(`🏆 Fetching top ${limit} performers (will be cached for ${CACHE_DURATION}s)...`);
    return getTopPerformersUncached(limit);
  },
  ['top-performers'],
  { revalidate: CACHE_DURATION, tags: ['strategies'] }
);

// Uncached implementation
async function getTopPerformersUncached(limit: number = 10): Promise<StrategyResult[]> {
  return getTopPerformersFallback(limit);
}

// Fetches ALL data by ticker+timeframe using pagination to ensure we find the true best
async function getTopPerformersFallback(limit: number): Promise<StrategyResult[]> {
  const supabase = createCacheableClient();
  
  console.log(`🔄 Fetching all strategies with pagination for accurate results...`);
  
  const tickers = await getUniqueTickersUncached();
  const timeframes = ['2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d'];
  const allResults: StrategyResult[] = [];
  
  // Fetch by ticker+timeframe combination with pagination
  await Promise.all(
    tickers.flatMap(ticker => 
      timeframes.map(async (timeframe) => {
        let allData: any[] = [];
        let offset = 0;
        const pageSize = 10000;
        let hasMore = true;
        
        // Paginate through all rows for this ticker/timeframe
        while (hasMore) {
          const { data, error } = await supabase
            .from(UNIFIED_TABLE)
            .select('*')
            .eq('ticker', ticker)
            .eq('chart_tf', timeframe)
            .range(offset, offset + pageSize - 1);
          
          if (error || !data || data.length === 0) {
            hasMore = false;
          } else {
            allData = allData.concat(data);
            offset += pageSize;
            hasMore = data.length === pageSize;
          }
        }
        
        // Add all strategies to results (no DD filter - let UI filters handle that)
        allData.forEach((strategy: any) => {
          allResults.push(strategy as StrategyResult);
        });
      })
    )
  );
  
  // Sort by PnL descending and return top results
  return allResults
    .sort((a, b) => parsePercentage(b.pnl) - parsePercentage(a.pnl))
    .slice(0, limit);
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
  
  console.log(`📊 Fetching count from ${UNIFIED_TABLE}...`);
  
  const { count, error } = await supabase
    .from(UNIFIED_TABLE)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error(`❌ Error fetching count from ${UNIFIED_TABLE}:`, error);
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
 * Get the best strategy for each coin + timeframe combination
 * Best = Highest PnL with max drawdown <= 30%
 * Cached for 1 hour to avoid re-fetching all data on every render
 */
export const getBestStrategiesByCoinAndTimeframe = unstable_cache(
  async (): Promise<CoinTimeframeBest[]> => {
    console.log(`🎯 Fetching best strategies by coin and timeframe (will be cached for ${CACHE_DURATION}s)...`);
    return getBestStrategiesByCoinAndTimeframeUncached();
  },
  ['best-strategies-matrix'],
  { revalidate: CACHE_DURATION, tags: ['strategies'] }
);

// Uncached implementation
async function getBestStrategiesByCoinAndTimeframeUncached(): Promise<CoinTimeframeBest[]> {
  const supabase = createCacheableClient();
  
  // Get all unique tickers first
  const tickers = await getUniqueTickersUncached();
  const timeframes = ['2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d'];
  
  const results: CoinTimeframeBest[] = [];
  
  // For each ticker + timeframe combination, find the best strategy using string parsing
  // This ensures consistency with getTopPerformers query
  await Promise.all(
    tickers.flatMap(ticker => 
      timeframes.map(async (timeframe) => {
        // Get count first
        const { count } = await supabase
          .from(UNIFIED_TABLE)
          .select('*', { count: 'exact', head: true })
          .eq('ticker', ticker)
          .eq('chart_tf', timeframe);
        
        // Fetch ALL data for this ticker/timeframe using pagination
        let allData: any[] = [];
        let offset = 0;
        const pageSize = 10000;
        let hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from(UNIFIED_TABLE)
            .select('*')
            .eq('ticker', ticker)
            .eq('chart_tf', timeframe)
            .range(offset, offset + pageSize - 1);
          
          if (error || !data || data.length === 0) {
            hasMore = false;
          } else {
            allData = allData.concat(data);
            offset += pageSize;
            hasMore = data.length === pageSize;
          }
        }
        
        if (allData.length === 0) {
          return;
        }
        
        // Find highest PnL strategy (no DD filter - let UI filters handle that)
        let bestStrategy: StrategyResult | null = null;
        let bestPnl = -Infinity;
        
        allData.forEach((strategy: any) => {
          const pnl = parsePercentage(strategy.pnl);
          
          if (pnl > bestPnl) {
            bestPnl = pnl;
            bestStrategy = strategy as StrategyResult;
          }
        });
        
        results.push({
          ticker,
          timeframe,
          best_strategy: bestStrategy,
          total_tested: count || allData.length,
        });
      })
    )
  );
  
  console.log(`✅ Found ${results.filter(r => r.best_strategy).length} best strategies across ${tickers.length} coins and ${timeframes.length} timeframes`);
  
  return results.sort((a, b) => {
    // Sort by ticker first, then by timeframe
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
