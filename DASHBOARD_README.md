# VFP Trading Strategy Dashboard

## Overview
This dashboard displays real-time performance analytics for your trading strategies running across 5 VMs, each testing different timeframes (2h, 3h, 4h, 5h, 6h).

## Features

### 📊 Overall Performance Metrics
- **Total Strategy Runs**: Count of all tested configurations
- **Average PnL**: Mean profit/loss across all strategies
- **Average Win Rate**: Success rate across all timeframes
- **Average Profit Factor**: Risk/reward ratio
- **Average Max Drawdown**: Risk exposure metric
- **Profitable Strategies**: Number and percentage of winning strategies

### 🎯 Best Performers by Timeframe
Each timeframe (2h-6h) displays:
- Best PnL achieved
- Total number of runs
- Average win rate
- Average profit factor
- Best configuration details (lookback, speeds, trend type)

### 🏆 Top 20 Performing Strategies
Ranked table showing:
- Rank with medals (🥇🥈🥉)
- Timeframe
- PnL with trend indicators
- Win Rate
- Profit Factor
- Max Drawdown
- Number of Trades
- Configuration details (lookback, speeds, trend type)

### 📈 Detailed Results by Timeframe
Tabbed view for each timeframe with:
- Summary statistics
- Top 10 strategies for that specific timeframe
- Full configuration details

## Database Structure

The dashboard reads from 5 Supabase tables:
- `btc_usdt_2h_results`
- `btc_usdt_3h_results`
- `btc_usdt_4h_results`
- `btc_usdt_5h_results`
- `btc_usdt_6h_results`

Each table contains comprehensive metrics including:
- Overview metrics (PnL, Max DD, Win Rate, Profit Factor)
- Performance metrics (Net Profit, Gross Profit/Loss, Equity curves)
- Trade analysis (Win/Loss ratios, Average trades, Bar counts)
- Risk ratios (Sharpe, Sortino, Margin calls)

## Key Metrics Explained

### PnL (Profit & Loss)
Percentage return on investment. Green = profitable, Red = loss.

### Win Rate
Percentage of profitable trades out of total trades.

### Profit Factor
Ratio of gross profit to gross loss. >1 = profitable, <1 = unprofitable.

### Max Drawdown
Largest peak-to-trough decline. Lower is better (less risk).

### Sharpe Ratio
Risk-adjusted return metric. Higher is better.

### Sortino Ratio
Similar to Sharpe but only considers downside volatility.

## Running the Dashboard

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

The dashboard will be available at `http://localhost:3000`

## Configuration

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Authentication

The dashboard is publicly accessible. Authentication is only required for `/protected` routes.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light mode)

## File Structure

```
app/
├── page.tsx                          # Main dashboard (root)
├── dashboard/
│   ├── page.tsx                      # Alternative dashboard route
│   └── layout.tsx                    # Dashboard layout
components/
├── dashboard/
│   ├── nav.tsx                       # Navigation bar
│   ├── performance-metrics.tsx       # Overall metrics cards
│   ├── timeframe-overview.tsx        # Timeframe comparison cards
│   ├── top-performers-table.tsx      # Rankings table
│   └── stats-card.tsx                # Reusable stat card
└── ui/                               # shadcn components
lib/
└── supabase/
    ├── queries.ts                    # Database query functions
    ├── client.ts                     # Client-side Supabase client
    └── server.ts                     # Server-side Supabase client
```

## Customization

### Adding New Timeframes
1. Add table name to `getTableNames()` in `lib/supabase/queries.ts`
2. Update the tabs array in `app/page.tsx`

### Modifying Metrics
Edit the query functions in `lib/supabase/queries.ts` to include additional fields from your database.

### Styling
All components use Tailwind CSS. Modify `tailwind.config.ts` for theme customization.

## Performance Optimization

- Server-side rendering for initial load
- Suspense boundaries for loading states
- Parallel data fetching with `Promise.all()`
- Efficient database queries with proper indexing

## Troubleshooting

### No data showing
- Check Supabase connection in `.env.local`
- Verify table names match your database
- Check browser console for errors

### Slow loading
- Reduce `limit` in query functions
- Add database indexes on frequently queried columns
- Consider implementing pagination

## Future Enhancements

- Real-time updates with Supabase subscriptions
- Export data to CSV/Excel
- Advanced filtering and sorting
- Performance charts and visualizations
- Comparison tools between strategies
- Alerts for top performers
