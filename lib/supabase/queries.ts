import { createClient } from "@/lib/supabase/server";
import { parsePercentage, parseDollar } from "@/lib/utils/parse";
import { StrategyResult, TimeframeStats, CoinTimeframeBest } from "@/lib/types/strategy";

// Re-export types and utilities for backward compatibility
export { parsePercentage };
export type { StrategyResult, TimeframeStats, CoinTimeframeBest };

// Unified table name
const UNIFIED_TABLE = 'trading_results_unified';

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

export async function getTopPerformers(limit: number = 10): Promise<StrategyResult[]> {
  const supabase = await createClient();
  
  console.log(`🏆 Fetching top ${limit} performers from ${UNIFIED_TABLE}...`);
  
  // Use pnl_numeric column for proper SQL sorting (after running migration)
  const { data: results, error } = await supabase
    .from(UNIFIED_TABLE)
    .select('*')
    .order('pnl_numeric', { ascending: false, nullsFirst: false })
    .limit(limit);
  
  if (error) {
    console.error(`❌ Error fetching top performers:`, error);
    // Fallback to client-side sorting if pnl_numeric doesn't exist yet
    return getTopPerformersFallback(limit);
  }
  
  console.log(`🎯 Returning top ${results?.length || 0} performers (best PnL: ${results?.[0]?.pnl || 'N/A'})`);
  
  return (results || []) as StrategyResult[];
}

// Fallback function if pnl_numeric column doesn't exist yet
async function getTopPerformersFallback(limit: number): Promise<StrategyResult[]> {
  const supabase = await createClient();
  
  console.log(`⚠️ Using fallback method (pnl_numeric column may not exist yet)`);
  
  const tickers = await getUniqueTickers();
  const allResults: StrategyResult[] = [];
  
  await Promise.all(
    tickers.map(async (ticker) => {
      const { data, error } = await supabase
        .from(UNIFIED_TABLE)
        .select('*')
        .eq('ticker', ticker)
        .limit(500);
      
      if (!error && data) {
        allResults.push(...(data as StrategyResult[]));
      }
    })
  );
  
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
 * Uses pnl_numeric and max_dd_numeric columns for proper SQL sorting (after migration)
 */
export async function getBestStrategiesByCoinAndTimeframe(): Promise<CoinTimeframeBest[]> {
  const supabase = await createClient();
  
  console.log(`🎯 Fetching best strategies by coin and timeframe...`);
  
  // Get all unique tickers first
  const tickers = await getUniqueTickers();
  const timeframes = ['2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d'];
  
  const results: CoinTimeframeBest[] = [];
  
  // For each ticker + timeframe combination, find the best strategy
  await Promise.all(
    tickers.flatMap(ticker => 
      timeframes.map(async (timeframe) => {
        // Get count first
        const { count } = await supabase
          .from(UNIFIED_TABLE)
          .select('*', { count: 'exact', head: true })
          .eq('ticker', ticker)
          .eq('chart_tf', timeframe);
        
        // Try to use SQL sorting with numeric columns (after migration)
        // Filter: max_dd_numeric >= -30 (drawdown is negative, so -30% means abs <= 30)
        const { data, error } = await supabase
          .from(UNIFIED_TABLE)
          .select('*')
          .eq('ticker', ticker)
          .eq('chart_tf', timeframe)
          .gte('max_dd_numeric', -30) // max drawdown <= 30% (stored as negative)
          .order('pnl_numeric', { ascending: false, nullsFirst: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          // SQL query worked - use the result
          results.push({
            ticker,
            timeframe,
            best_strategy: data[0] as StrategyResult,
            total_tested: count || 0,
          });
          return;
        }
        
        // Fallback: fetch and filter client-side if numeric columns don't exist
        const { data: fallbackData } = await supabase
          .from(UNIFIED_TABLE)
          .select('*')
          .eq('ticker', ticker)
          .eq('chart_tf', timeframe)
          .limit(500);
        
        if (!fallbackData || fallbackData.length === 0) {
          return;
        }
        
        // Filter by max drawdown <= 30% and find highest PnL
        let bestStrategy: StrategyResult | null = null;
        let bestPnl = -Infinity;
        
        fallbackData.forEach((strategy: any) => {
          const maxDD = Math.abs(parsePercentage(strategy.max_dd));
          const pnl = parsePercentage(strategy.pnl);
          
          if (maxDD <= 30 && pnl > bestPnl) {
            bestPnl = pnl;
            bestStrategy = strategy as StrategyResult;
          }
        });
        
        results.push({
          ticker,
          timeframe,
          best_strategy: bestStrategy,
          total_tested: count || fallbackData.length,
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

export async function getUniqueTickers(): Promise<string[]> {
  const supabase = await createClient();
  
  console.log(`🎯 Fetching unique tickers from ${UNIFIED_TABLE}...`);
  
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
