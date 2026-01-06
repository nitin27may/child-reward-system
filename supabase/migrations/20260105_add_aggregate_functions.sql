-- Migration: Add functions to aggregate tracking data
-- Date: 2026-01-05
-- Description: Create functions to calculate weekly summaries and update totals

-- Function to calculate total points from a daily_tracking record
CREATE OR REPLACE FUNCTION calculate_daily_total_points(tracking_record daily_tracking)
RETURNS integer AS $$
DECLARE
  category_sum integer := 0;
  key text;
  value jsonb;
BEGIN
  -- Sum all values in category_points JSONB object
  FOR key, value IN SELECT * FROM jsonb_each(tracking_record.category_points)
  LOOP
    category_sum := category_sum + COALESCE((value::text)::integer, 0);
  END LOOP;
  
  RETURN category_sum + COALESCE(tracking_record.daily_bonuses, 0) + COALESCE(tracking_record.daily_deductions, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update total_points automatically when saving tracking
CREATE OR REPLACE FUNCTION update_daily_tracking_total()
RETURNS TRIGGER AS $$
DECLARE
  category_sum integer := 0;
  key text;
  value jsonb;
BEGIN
  -- Calculate sum of category_points
  FOR key, value IN SELECT * FROM jsonb_each(NEW.category_points)
  LOOP
    category_sum := category_sum + COALESCE((value::text)::integer, 0);
  END LOOP;
  
  -- Set total_points
  NEW.total_points := category_sum + COALESCE(NEW.daily_bonuses, 0) + COALESCE(NEW.daily_deductions, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate total_points
DROP TRIGGER IF EXISTS trigger_update_daily_tracking_total ON daily_tracking;
CREATE TRIGGER trigger_update_daily_tracking_total
  BEFORE INSERT OR UPDATE ON daily_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_tracking_total();

-- Function to get weekly summary for a child
CREATE OR REPLACE FUNCTION get_weekly_summary(
  p_child_id uuid,
  p_week_start date,
  p_week_end date
)
RETURNS TABLE (
  total_points integer,
  screen_time_earned integer,
  allowance_earned numeric,
  days_tracked integer,
  daily_breakdown jsonb
) AS $$
DECLARE
  v_config record;
BEGIN
  -- Get family configuration
  SELECT c.points_to_minutes, c.points_to_dollars
  INTO v_config
  FROM children ch
  JOIN configurations c ON c.family_id = ch.family_id
  WHERE ch.id = p_child_id
  LIMIT 1;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(dt.total_points), 0)::integer as total_points,
    (COALESCE(SUM(dt.total_points), 0) * COALESCE(v_config.points_to_minutes, 5))::integer as screen_time_earned,
    (COALESCE(SUM(dt.total_points), 0) * COALESCE(v_config.points_to_dollars, 0.5))::numeric as allowance_earned,
    COUNT(dt.id)::integer as days_tracked,
    jsonb_agg(
      jsonb_build_object(
        'date', dt.date,
        'points', dt.total_points,
        'category_points', dt.category_points,
        'bonuses', dt.daily_bonuses,
        'deductions', dt.daily_deductions
      ) ORDER BY dt.date
    ) as daily_breakdown
  FROM daily_tracking dt
  WHERE dt.child_id = p_child_id
    AND dt.date >= p_week_start
    AND dt.date <= p_week_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update or create weekly summary
CREATE OR REPLACE FUNCTION upsert_weekly_summary(
  p_child_id uuid,
  p_week_start date,
  p_week_end date
)
RETURNS void AS $$
DECLARE
  v_summary record;
BEGIN
  -- Get weekly summary
  SELECT * INTO v_summary
  FROM get_weekly_summary(p_child_id, p_week_start, p_week_end);

  -- Upsert into weekly_summaries table
  INSERT INTO weekly_summaries (
    child_id,
    week_start,
    week_end,
    total_points,
    screen_time_earned,
    allowance_earned,
    days_tracked,
    is_paid
  )
  VALUES (
    p_child_id,
    p_week_start,
    p_week_end,
    v_summary.total_points,
    v_summary.screen_time_earned,
    v_summary.allowance_earned,
    v_summary.days_tracked,
    false
  )
  ON CONFLICT (child_id, week_start)
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    screen_time_earned = EXCLUDED.screen_time_earned,
    allowance_earned = EXCLUDED.allowance_earned,
    days_tracked = EXCLUDED.days_tracked,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update weekly summary when tracking changes
CREATE OR REPLACE FUNCTION auto_update_weekly_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_week_start date;
  v_week_end date;
  v_day_of_week integer;
BEGIN
  -- Calculate week start (Monday) and end (Sunday)
  v_day_of_week := EXTRACT(DOW FROM COALESCE(NEW.date, OLD.date));
  
  IF v_day_of_week = 0 THEN -- Sunday
    v_week_start := COALESCE(NEW.date, OLD.date) - INTERVAL '6 days';
  ELSE
    v_week_start := COALESCE(NEW.date, OLD.date) - INTERVAL '1 day' * (v_day_of_week - 1);
  END IF;
  
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Update weekly summary
  PERFORM upsert_weekly_summary(
    COALESCE(NEW.child_id, OLD.child_id),
    v_week_start::date,
    v_week_end::date
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update weekly summaries
DROP TRIGGER IF EXISTS trigger_auto_update_weekly_summary ON daily_tracking;
CREATE TRIGGER trigger_auto_update_weekly_summary
  AFTER INSERT OR UPDATE OR DELETE ON daily_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_weekly_summary();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_daily_total_points TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_tracking_total TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_summary TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weekly_summary TO authenticated;
GRANT EXECUTE ON FUNCTION auto_update_weekly_summary TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION calculate_daily_total_points IS 'Calculate total points from category_points, bonuses, and deductions';
COMMENT ON FUNCTION update_daily_tracking_total IS 'Trigger function to auto-calculate total_points before insert/update';
COMMENT ON FUNCTION get_weekly_summary IS 'Get aggregated weekly summary for a child';
COMMENT ON FUNCTION upsert_weekly_summary IS 'Create or update weekly summary record';
COMMENT ON FUNCTION auto_update_weekly_summary IS 'Trigger function to auto-update weekly summaries when tracking changes';
