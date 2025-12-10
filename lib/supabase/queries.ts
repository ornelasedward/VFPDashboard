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

export async function getTableNames(): Promise<string[]> {
  // Return known table names based on your VM setup
  return [
    'btc_usdt_2h_results',
    'btc_usdt_3h_results',
    'btc_usdt_4h_results',
    'btc_usdt_5h_results',
    'btc_usdt_6h_results',
    'btc_usdt_fixed_settings'
  ];
}

export async function getTimeframeStats(): Promise<TimeframeStats[]> {
  const supabase = await createClient();
  const tableNames = await getTableNames();
  
  console.log('📊 Fetching stats from tables:', tableNames);
  
  const stats: TimeframeStats[] = [];
  
  for (const tableName of tableNames) {
    // Extract timeframe from table name (e.g., "btc_usdt_2h_results" -> "2h", "btc_usdt_fixed_settings" -> "fixed")
    let timeframe: string;
    const timeframeMatch = tableName.match(/_(\d+h)_results$/);
    if (timeframeMatch) {
      timeframe = timeframeMatch[1];
    } else if (tableName.includes('fixed_settings')) {
      timeframe = 'fixed';
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
  const tableName = timeframe === 'fixed' ? 'btc_usdt_fixed_settings' : `btc_usdt_${timeframe}_results`;
  
  // Fetch all results using pagination
  const allResults: any[] = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error(`Error fetching results for ${timeframe}:`, error);
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
  
  console.log(`✅ Loaded ${allResults.length} results from ${tableName}`);
  
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
