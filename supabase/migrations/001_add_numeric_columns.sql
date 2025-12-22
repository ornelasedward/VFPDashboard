-- Migration: Add numeric columns for pnl and max_dd to enable SQL sorting
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Add the numeric columns
ALTER TABLE trading_results_unified 
ADD COLUMN IF NOT EXISTS pnl_numeric DECIMAL(12, 4),
ADD COLUMN IF NOT EXISTS max_dd_numeric DECIMAL(12, 4);

-- Step 2: Populate pnl_numeric from the pnl string column
-- Handles formats like "+45.2%", "-12.5%", "1,129.54%", "−12.5%" (unicode minus)
UPDATE trading_results_unified
SET pnl_numeric = CASE 
  WHEN pnl IS NULL OR pnl = '' THEN 0
  ELSE CAST(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(pnl, '%', ''),  -- Remove %
            '+', ''                  -- Remove +
          ),
          '−', '-'                   -- Replace unicode minus with regular minus
        ),
        ',', ''                      -- Remove commas (e.g., 1,129.54)
      ),
      ' ', ''                        -- Remove spaces
    ) AS DECIMAL(12, 4)
  )
END
WHERE pnl_numeric IS NULL;

-- Step 3: Populate max_dd_numeric from the max_dd string column
UPDATE trading_results_unified
SET max_dd_numeric = CASE 
  WHEN max_dd IS NULL OR max_dd = '' THEN 0
  ELSE CAST(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(max_dd, '%', ''),
            '+', ''
          ),
          '−', '-'
        ),
        ',', ''                      -- Remove commas
      ),
      ' ', ''
    ) AS DECIMAL(12, 4)
  )
END
WHERE max_dd_numeric IS NULL;

-- Step 4: Create indexes for fast sorting and filtering
CREATE INDEX IF NOT EXISTS idx_trading_results_pnl_numeric 
ON trading_results_unified(pnl_numeric DESC);

CREATE INDEX IF NOT EXISTS idx_trading_results_max_dd_numeric 
ON trading_results_unified(max_dd_numeric);

CREATE INDEX IF NOT EXISTS idx_trading_results_ticker_pnl 
ON trading_results_unified(ticker, pnl_numeric DESC);

CREATE INDEX IF NOT EXISTS idx_trading_results_ticker_timeframe_pnl 
ON trading_results_unified(ticker, chart_tf, pnl_numeric DESC);

-- Step 5: Create a trigger to auto-populate numeric columns on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_numeric_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Parse pnl to numeric (handles %, +, unicode minus, commas, spaces)
  IF NEW.pnl IS NOT NULL AND NEW.pnl != '' THEN
    NEW.pnl_numeric := CAST(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(NEW.pnl, '%', ''),
              '+', ''
            ),
            '−', '-'
          ),
          ',', ''
        ),
        ' ', ''
      ) AS DECIMAL(12, 4)
    );
  ELSE
    NEW.pnl_numeric := 0;
  END IF;
  
  -- Parse max_dd to numeric (handles %, +, unicode minus, commas, spaces)
  IF NEW.max_dd IS NOT NULL AND NEW.max_dd != '' THEN
    NEW.max_dd_numeric := CAST(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(NEW.max_dd, '%', ''),
              '+', ''
            ),
            '−', '-'
          ),
          ',', ''
        ),
        ' ', ''
      ) AS DECIMAL(12, 4)
    );
  ELSE
    NEW.max_dd_numeric := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_numeric_columns ON trading_results_unified;

-- Create the trigger
CREATE TRIGGER trigger_update_numeric_columns
BEFORE INSERT OR UPDATE ON trading_results_unified
FOR EACH ROW
EXECUTE FUNCTION update_numeric_columns();

-- Verify the migration worked
SELECT 
  COUNT(*) as total_rows,
  COUNT(pnl_numeric) as rows_with_pnl_numeric,
  MIN(pnl_numeric) as min_pnl,
  MAX(pnl_numeric) as max_pnl,
  AVG(pnl_numeric) as avg_pnl
FROM trading_results_unified;
