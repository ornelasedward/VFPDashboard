-- Create a function to dynamically get all strategy tables
-- This function queries the information_schema to find all tables that match your naming pattern
-- Tables ending with '_results' or '_settings' are considered strategy tables

CREATE OR REPLACE FUNCTION get_strategy_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text as table_name
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (
      tablename LIKE '%_results'
      OR tablename LIKE '%_settings'
    )
  ORDER BY tablename;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_strategy_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_strategy_tables() TO anon;
