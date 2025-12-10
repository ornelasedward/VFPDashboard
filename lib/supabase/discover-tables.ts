import { createClient } from "@/lib/supabase/server";

/**
 * Alternative approach: Discover tables by attempting to query them
 * This doesn't require a database function but is less efficient
 */
export async function discoverTablesByPattern(): Promise<string[]> {
  const supabase = await createClient();
  const discoveredTables: string[] = [];
  
  // Known patterns for table names
  const tickers = ['btc_usdt', 'eth_usdt', 'sol_usdt', 'bnb_usdt'];
  const timeframes = ['2h', '3h', '4h', '5h', '6h'];
  const suffixes = ['results', 'settings'];
  const specialSuffixes = ['fixed_settings', 'alex_settings'];
  
  // Try standard pattern: {ticker}_{timeframe}_{suffix}
  for (const ticker of tickers) {
    for (const timeframe of timeframes) {
      for (const suffix of suffixes) {
        const tableName = `${ticker}_${timeframe}_${suffix}`;
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (!error) {
          discoveredTables.push(tableName);
        }
      }
    }
    
    // Try special patterns: {ticker}_{special_suffix}
    for (const suffix of specialSuffixes) {
      const tableName = `${ticker}_${suffix}`;
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (!error) {
        discoveredTables.push(tableName);
      }
    }
  }
  
  console.log('🔍 Discovered tables by pattern matching:', discoveredTables);
  return discoveredTables;
}

/**
 * Get table names with caching to avoid repeated queries
 */
let cachedTables: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedTableNames(): Promise<string[]> {
  const now = Date.now();
  
  if (cachedTables && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using cached table names');
    return cachedTables;
  }
  
  console.log('🔄 Refreshing table cache...');
  cachedTables = await discoverTablesByPattern();
  cacheTimestamp = now;
  
  return cachedTables;
}
