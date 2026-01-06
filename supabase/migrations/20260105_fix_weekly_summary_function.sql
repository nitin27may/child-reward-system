-- Migration: Fix weekly summary function to include year and week_number
-- Date: 2026-01-05
-- Description: Update upsert_weekly_summary to calculate and include year and week_number

-- Function to calculate week number from a date
CREATE OR REPLACE FUNCTION get_iso_week_number(input_date date)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(WEEK FROM input_date)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update or create weekly summary (fixed to include year and week_number)
CREATE OR REPLACE FUNCTION upsert_weekly_summary(
  p_child_id uuid,
  p_week_start date,
  p_week_end date
)
RETURNS void AS $$
DECLARE
  v_summary record;
  v_year integer;
  v_week_number integer;
BEGIN
  -- Calculate year and week number from week_start
  v_year := EXTRACT(YEAR FROM p_week_start)::integer;
  v_week_number := get_iso_week_number(p_week_start);

  -- Get weekly summary
  SELECT * INTO v_summary
  FROM get_weekly_summary(p_child_id, p_week_start, p_week_end);

  -- Upsert into weekly_summaries table
  INSERT INTO weekly_summaries (
    child_id,
    year,
    week_number,
    week_start,
    week_end,
    total_screen_points,
    total_christmas_points,
    screen_time_earned,
    is_finalized
  )
  VALUES (
    p_child_id,
    v_year,
    v_week_number,
    p_week_start,
    p_week_end,
    COALESCE(v_summary.total_points, 0),
    COALESCE(v_summary.total_points, 0),
    COALESCE(v_summary.screen_time_earned, 0),
    false
  )
  ON CONFLICT (child_id, year, week_number)
  DO UPDATE SET
    total_screen_points = EXCLUDED.total_screen_points,
    total_christmas_points = EXCLUDED.total_christmas_points,
    screen_time_earned = EXCLUDED.screen_time_earned,
    week_start = EXCLUDED.week_start,
    week_end = EXCLUDED.week_end,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_iso_week_number TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weekly_summary TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION get_iso_week_number IS 'Calculate ISO week number from a date';
COMMENT ON FUNCTION upsert_weekly_summary IS 'Create or update weekly summary record with year and week_number';
