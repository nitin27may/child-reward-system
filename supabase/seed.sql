-- =====================================================================
-- Seed data — a demo family with two children and a week of tracking.
-- Loaded automatically by `supabase db reset` (local) and can be applied
-- to a remote project with `supabase db push --include-seed`.
--
-- This seed intentionally does NOT insert into profiles (which FKs
-- auth.users). Real users sign up via the app; the seed gives them
-- something to look at before that. Delete or edit as you prefer.
-- =====================================================================

do $$
declare
  v_family_id   uuid;
  v_child_a_id  uuid;
  v_child_b_id  uuid;
  v_day         date;
  v_dow         int;
  v_dow_name    text;
begin
  -- Demo family
  insert into families (name) values ('Demo Family')
  returning id into v_family_id;

  insert into configurations (family_id, points_to_minutes, points_to_dollars, christmas_goal, max_weekly_screen_time)
  values (v_family_id, 0.5, 1.0, 500.0, 60);

  insert into categories (family_id, name, key, icon, max_points, order_index) values
    (v_family_id, 'Health & Nutrition',     'healthNutrition', '🥗', 3, 1),
    (v_family_id, 'Screen Discipline',      'screenDiscipline','📱', 2, 2),
    (v_family_id, 'Self-Study & Learning',  'selfStudy',       '📚', 2, 3),
    (v_family_id, 'Household Contribution', 'household',       '🏠', 3, 4),
    (v_family_id, 'Behavior & Respect',     'behaviorRespect', '⭐', 2, 5);

  insert into bonus_presets (family_id, label, points, icon, order_index) values
    (v_family_id, 'Perfect sugar-free day',     2, '🍏', 1),
    (v_family_id, 'Extraordinary helpfulness',  3, '🦸', 2),
    (v_family_id, 'Homework ahead of schedule', 2, '✅', 3),
    (v_family_id, 'Helped sibling/peer',        2, '🤝', 4);

  insert into deduction_presets (family_id, label, points, icon, order_index) values
    (v_family_id, 'Disrespectful behavior',        -2, '😤', 1),
    (v_family_id, 'Refused chore',                 -3, '🚫', 2),
    (v_family_id, 'Lied about something',          -5, '🤥', 3),
    (v_family_id, 'Physical aggression',           -5, '👊', 4),
    (v_family_id, 'Sneaking screen time',          -5, '📵', 5),
    (v_family_id, 'Morning routine not completed', -1, '⏰', 6),
    (v_family_id, 'Tantrum/meltdown',              -3, '😭', 7);

  -- Two demo children
  insert into children (family_id, name, avatar_color, date_of_birth, is_active)
  values
    (v_family_id, 'Aarav',  '#3b82f6', '2016-05-12', true),
    (v_family_id, 'Aanya',  '#ec4899', '2019-09-03', true);

  select id into v_child_a_id from children where family_id = v_family_id and name = 'Aarav';
  select id into v_child_b_id from children where family_id = v_family_id and name = 'Aanya';

  -- Seven days of sample tracking for Aarav. total_points is computed by trigger.
  for i in 0..6 loop
    v_day := current_date - i;
    v_dow := extract(dow from v_day);
    v_dow_name := case v_dow
      when 0 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday'
      when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday'
      else 'Saturday' end;

    insert into daily_tracking (
      child_id, date, day_of_week,
      category_points,
      daily_bonuses, daily_deductions, notes
    ) values (
      v_child_a_id,
      v_day,
      v_dow_name,
      jsonb_build_object(
        'healthNutrition', 2 + (i % 2),
        'screenDiscipline', 2,
        'selfStudy', case when v_dow in (0,6) then 1 else 2 end,
        'household', 2,
        'behaviorRespect', case when i = 3 then 0 else 2 end
      ),
      case when i = 1 then 3 else 0 end,
      case when i = 3 then -2 else 0 end,
      case
        when i = 1 then 'Helped little sister with homework.'
        when i = 3 then 'Argued about bedtime.'
        else null
      end
    );
  end loop;

  -- A single tracking row for Aanya so the dashboard has multi-child data.
  insert into daily_tracking (
    child_id, date, day_of_week,
    category_points, daily_bonuses, daily_deductions, notes
  ) values (
    v_child_b_id,
    current_date,
    case extract(dow from current_date)
      when 0 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday'
      when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday'
      else 'Saturday' end,
    jsonb_build_object(
      'healthNutrition', 3,
      'screenDiscipline', 2,
      'selfStudy', 2,
      'household', 3,
      'behaviorRespect', 2
    ),
    2, 0, 'Perfect day.'
  );
end
$$;
