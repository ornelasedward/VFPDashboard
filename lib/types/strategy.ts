export interface StrategyResult {
  id: number;
  created_at: string;
  vm_id: string;
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

export interface CoinTimeframeBest {
  ticker: string;
  timeframe: string;
  best_strategy: StrategyResult | null;
  total_tested: number;
}
