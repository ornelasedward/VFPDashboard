import { createClient } from "@/lib/supabase/server";

export interface StrategyResult {
  id: number;
  created_at: string;
  ticker: string;
  exchange: string;
  date_start: string;
  date_end: string;
  chart_tf: string;
  lookback: number;
  primary_speed: string;
  secondary_speed: string;
  trend_type: string;
  smoothing_type: string;
  resolutions: string;
  
  // Key metrics
  pnl: string;
  max_dd: string;
  trades: string;
  win_rate: string;
  profit_factor: string;
  buy_hold: string;
  
  // Performance metrics
  net_profit_all: string;
  sharpe_ratio: string;
  sortino_ratio: string;
  
  // Trade analysis
  total_long_trades: string;
  total_short_trades: string;
  winning_trades_all: string;
  losing_trades_all: string;
  avg_win_trade_all: string;
  avg_loss_trade_all: string;
}

export interface TimeframeStats {
  timeframe: string;
  total_runs: number;
  best_pnl: number;
  best_config: StrategyResult | null;
}

// Helper to parse percentage strings like "45.2%" to numbers
function parsePercentage(value: string | null): number {
  if (!value) return 0;
  const cleaned = value.replace('%', '').trim();
  return parseFloat(cleaned) || 0;
}

// Helper to parse dollar amounts like "$1,234.56" to numbers
function parseDollar(value: string | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

// Cache for table names to avoid repeated discovery
let cachedTableNames: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getTableNames(): Promise<string[]> {
  // Return cached tables if still valid
  const now = Date.now();
  if (cachedTableNames && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedTableNames;
  }

  const supabase = await createClient();
  const discoveredTables: string[] = [];
  
  // Known patterns for table discovery
  const tickers = ['btc_usdt', 'eth_usdt', 'sol_usdt', 'bnb_usdt', 'ada_usdt'];
  const timeframes = ['2h', '3h', '4h', '5h', '6h'];
  const suffixes = ['results', 'settings'];
  const specialSuffixes = ['fixed_settings', 'alex_settings', 'custom_settings'];
  
  console.log('🔍 Discovering tables dynamically...');
  
  // Try standard pattern: {ticker}_{timeframe}_{suffix}
  for (const ticker of tickers) {
    for (const timeframe of timeframes) {
      for (const suffix of suffixes) {
        const tableName = `${ticker}_${timeframe}_${suffix}`;
        try {
          const { error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);
          
          if (!error) {
            discoveredTables.push(tableName);
          }
        } catch (e) {
          // Table doesn't exist, skip
        }
      }
    }
    
    // Try special patterns: {ticker}_{special_suffix}
    for (const suffix of specialSuffixes) {
      const tableName = `${ticker}_${suffix}`;
      try {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (!error) {
          discoveredTables.push(tableName);
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
  }
  
  // Cache the results
  cachedTableNames = discoveredTables.length > 0 ? discoveredTables : [
    // Fallback to known tables if discovery fails
    'btc_usdt_2h_results',
    'btc_usdt_3h_results',
    'btc_usdt_4h_results',
    'btc_usdt_5h_results',
    'btc_usdt_6h_results',
    'btc_usdt_fixed_settings',
    'eth_usdt_alex_settings'
  ];
  cacheTimestamp = now;
  
  console.log(`✅ Discovered ${cachedTableNames.length} tables:`, cachedTableNames);
  
  return cachedTableNames;
}

export async function getTimeframeStats(): Promise<TimeframeStats[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('📊 Fetching stats from tables:', tableNames);
  
  const stats: TimeframeStats[] = [];
  
  for (const tableName of tableNames) {
    // Extract timeframe from table name
    // Examples: "btc_usdt_2h_results" -> "2h", "btc_usdt_fixed_settings" -> "fixed", "eth_usdt_alex_settings" -> "alex"
    let timeframe: string;
    const timeframeMatch = tableName.match(/_(\d+h)_results$/);
    if (timeframeMatch) {
      timeframe = timeframeMatch[1];
    } else if (tableName.includes('fixed_settings')) {
      timeframe = 'fixed';
    } else if (tableName.includes('alex_settings')) {
      timeframe = 'alex';
    } else if (tableName.includes('custom_settings')) {
      timeframe = 'custom';
    } else if (tableName.endsWith('_settings')) {
      // Generic handler for any other _settings tables
      const parts = tableName.split('_');
      timeframe = parts[parts.length - 2]; // Get the word before 'settings'
    } else {
      continue;
    }
    
    // Fetch all results using pagination (Supabase has 1000 row limit per request)
    const allResults: any[] = [];
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: results, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ Error fetching data from ${tableName}:`, error);
        break;
      }
      
      if (!results || results.length === 0) {
        break;
      }
      
      allResults.push(...results);
      
      if (results.length < pageSize) {
        break; // Last page
      }
      
      from += pageSize;
    }
    
    if (allResults.length === 0) {
      console.warn(`⚠️ No data found in ${tableName}`);
      continue;
    }
    
    console.log(`✅ Loaded ${allResults.length} results from ${tableName}`);
    
    // Calculate stats - find best performer by profit factor
    const total_runs = allResults.length;
    
    // Find best performer by profit factor
    let bestResult: any = null;
    let bestProfitFactor = -Infinity;
    
    allResults.forEach((result: any) => {
      const profitFactor = parseFloat(result.profit_factor || '0');
      if (profitFactor > bestProfitFactor) {
        bestProfitFactor = profitFactor;
        bestResult = result;
      }
    });
    
    const bestPnl = bestResult ? parsePercentage(bestResult.pnl) : 0;
    
    stats.push({
      timeframe,
      total_runs,
      best_pnl: bestPnl,
      best_config: bestResult,
    });
  }
  
  return stats.sort((a, b) => a.timeframe.localeCompare(b.timeframe));
}

export async function getTopPerformers(limit: number = 10): Promise<StrategyResult[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('🏆 Fetching top performers from all tables...');
  
  const allResults: StrategyResult[] = [];
  
  for (const tableName of tableNames) {
    // Fetch all results using pagination
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: results, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error);
        break;
      }
      
      if (!results || results.length === 0) {
        break;
      }
      
      allResults.push(...(results as StrategyResult[]));
      
      if (results.length < pageSize) {
        break;
      }
      
      from += pageSize;
    }
    
    console.log(`✅ Loaded results from ${tableName} for top performers`);
  }
  
  console.log(`📈 Total results collected for top performers: ${allResults.length}`);
  
  // Sort by PnL and return top performers
  const sorted = allResults
    .sort((a, b) => parsePercentage(b.pnl) - parsePercentage(a.pnl))
    .slice(0, limit);
  
  console.log(`🎯 Returning top ${sorted.length} performers`);
  
  return sorted;
}

export async function getResultsByTimeframe(timeframe: string): Promise<StrategyResult[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  // Find all tables that match this timeframe
  const matchingTables = tableNames.filter(tableName => {
    // Extract timeframe from table name using same logic as getTimeframeStats
    const timeframeMatch = tableName.match(/_(\d+h)_results$/);
    if (timeframeMatch && timeframeMatch[1] === timeframe) {
      return true;
    }
    if (tableName.includes('fixed_settings') && timeframe === 'fixed') {
      return true;
    }
    if (tableName.includes('alex_settings') && timeframe === 'alex') {
      return true;
    }
    if (tableName.includes('custom_settings') && timeframe === 'custom') {
      return true;
    }
    if (tableName.endsWith('_settings')) {
      const parts = tableName.split('_');
      const extractedTf = parts[parts.length - 2];
      if (extractedTf === timeframe) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`🔍 Found ${matchingTables.length} tables for timeframe ${timeframe}:`, matchingTables);
  
  const allResults: any[] = [];
  
  // Fetch from all matching tables
  for (const tableName of matchingTables) {
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`Error fetching results from ${tableName}:`, error);
        break;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      allResults.push(...data);
      
      if (data.length < pageSize) {
        break;
      }
      
      from += pageSize;
    }
  }
  
  console.log(`✅ Loaded ${allResults.length} results for timeframe ${timeframe}`);
  
  return allResults as StrategyResult[];
}

export async function getTopPerformersByTimeframe(timeframe: string, limit: number = 20): Promise<StrategyResult[]> {
  const allResults = await getResultsByTimeframe(timeframe);
  
  // Sort by profit factor (descending) and return top performers
  const sorted = allResults
    .sort((a, b) => {
      const pfA = parseFloat(a.profit_factor || '0');
      const pfB = parseFloat(b.profit_factor || '0');
      return pfB - pfA;
    })
    .slice(0, limit);
  
  console.log(`🎯 Returning top ${sorted.length} performers for ${timeframe} by profit factor`);
  
  return sorted;
}

export async function getAllResults(): Promise<StrategyResult[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('📊 Fetching ALL results from all tables...');
  
  const allResults: StrategyResult[] = [];
  
  for (const tableName of tableNames) {
    // Fetch all results using pagination
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: results, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error);
        break;
      }
      
      if (!results || results.length === 0) {
        break;
      }
      
      allResults.push(...(results as StrategyResult[]));
      
      if (results.length < pageSize) {
        break;
      }
      
      from += pageSize;
    }
    
    console.log(`✅ Loaded results from ${tableName}`);
  }
  
  console.log(`📊 Total results from all databases: ${allResults.length}`);
  
  return allResults;
}

export async function getRecentResults(limit: number = 50): Promise<StrategyResult[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('📅 Fetching recent results from all tables...');
  
  const allResults: StrategyResult[] = [];
  
  for (const tableName of tableNames) {
    const { data: results, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error);
    } else if (results) {
      console.log(`✅ Loaded ${results.length} recent results from ${tableName}`);
      allResults.push(...(results as StrategyResult[]));
    }
  }
  
  console.log(`📊 Total recent results: ${allResults.length}`);
  
  // Sort by created_at and return most recent
  const sorted = allResults
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
  
  console.log(`✨ Returning ${sorted.length} most recent results`);
  
  return sorted;
}

export async function getUniqueTickers(): Promise<string[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('🎯 Fetching unique tickers from all tables...');
  
  const tickersSet = new Set<string>();
  
  for (const tableName of tableNames) {
    const { data: results, error } = await supabase
      .from(tableName)
      .select('ticker')
      .limit(1000);
    
    if (error) {
      console.error(`❌ Error fetching tickers from ${tableName}:`, error);
    } else if (results) {
      results.forEach((result: any) => {
        if (result.ticker) {
          tickersSet.add(result.ticker);
        }
      });
    }
  }
  
  const tickers = Array.from(tickersSet).sort();
  console.log(`✅ Found ${tickers.length} unique tickers:`, tickers);
  
  return tickers;
}
