# Dynamic Table Discovery

The dashboard now automatically discovers and displays data from all strategy tables in your Supabase database!

## How It Works

The system automatically scans for tables matching these patterns:

### Standard Pattern
- `{ticker}_{timeframe}_{suffix}`
- Examples: `btc_usdt_2h_results`, `eth_usdt_3h_settings`

### Special Pattern
- `{ticker}_{special_suffix}`
- Examples: `btc_usdt_fixed_settings`, `eth_usdt_alex_settings`

## Supported Patterns

### Tickers
- `btc_usdt`
- `eth_usdt`
- `sol_usdt`
- `bnb_usdt`
- `ada_usdt`

### Timeframes
- `2h`, `3h`, `4h`, `5h`, `6h`

### Suffixes
- `results`
- `settings`

### Special Suffixes
- `fixed_settings`
- `alex_settings`
- `custom_settings`

## Adding New Tables

When you create a new table in Supabase, it will automatically be discovered if it follows the naming pattern:

1. **New Ticker**: Just create tables like `sol_usdt_2h_results` - they'll appear automatically
2. **New Timeframe**: Create `btc_usdt_7h_results` - it will be discovered
3. **New Special Config**: Create `eth_usdt_custom_settings` - it will show up

## Caching

- Table discovery is cached for **5 minutes** to improve performance
- After 5 minutes, the system will re-scan for new tables
- Restart your dev server to force immediate re-discovery

## Fallback

If dynamic discovery fails, the system falls back to these known tables:
- `btc_usdt_2h_results`
- `btc_usdt_3h_results`
- `btc_usdt_4h_results`
- `btc_usdt_5h_results`
- `btc_usdt_6h_results`
- `btc_usdt_fixed_settings`
- `eth_usdt_alex_settings`

## Optional: SQL Function (Advanced)

For better performance, you can optionally run the SQL migration in `supabase-migration.sql`:

```sql
-- This creates a database function for faster table discovery
CREATE OR REPLACE FUNCTION get_strategy_tables()
RETURNS TABLE (table_name text)
...
```

This is optional - the system works fine without it using the pattern-matching approach.

## Extending Patterns

To add support for new patterns, edit `/lib/supabase/queries.ts`:

```typescript
const tickers = ['btc_usdt', 'eth_usdt', 'your_new_ticker'];
const specialSuffixes = ['fixed_settings', 'alex_settings', 'your_new_suffix'];
```
