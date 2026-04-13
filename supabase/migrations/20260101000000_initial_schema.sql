-- =====================================================================
-- Child Reward System — Baseline Schema
-- Consolidated from remote Supabase project on 2026-04-13
-- Run with: supabase db push
-- =====================================================================

create extension if not exists "uuid-ossp";

-- =====================================================================
-- Tables
-- =====================================================================

create table families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  role text not null check (role in ('parent', 'child')),
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table children (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  linked_profile_id uuid references profiles(id) on delete set null,
  name text not null,
  avatar_url text,
  avatar_color text default '#3b82f6',
  date_of_birth date,
  is_active boolean default true,
  can_view_dashboard boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table configurations (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  points_to_minutes decimal(10,2) default 0.5,
  points_to_dollars decimal(10,2) default 1.0,
  christmas_goal decimal(10,2) default 500.0,
  max_weekly_screen_time int default 60,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(family_id)
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  key text not null,
  icon text not null,
  max_points int not null,
  order_index int default 0,
  is_active boolean default true,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(family_id, key)
);

create table bonus_presets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  label text not null,
  points int not null,
  icon text,
  order_index int default 0,
  is_active boolean default true,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table deduction_presets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  label text not null,
  points int not null,
  icon text,
  order_index int default 0,
  is_active boolean default true,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table daily_tracking (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  date date not null,
  day_of_week text not null,
  category_points jsonb default '{}'::jsonb,
  health_nutrition int default 0,
  screen_discipline int default 0,
  self_study int default 0,
  household int default 0,
  behavior_respect int default 0,
  daily_bonuses int default 0,
  daily_deductions int default 0,
  screen_time_total int default 0,
  christmas_fund_total int default 0,
  screen_time_used int default 0,
  total_points int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(child_id, date)
);

create table bonus_events (
  id uuid primary key default uuid_generate_v4(),
  daily_tracking_id uuid not null references daily_tracking(id) on delete cascade,
  type text not null check (type in ('bonus', 'deduction')),
  category text not null,
  points int not null,
  description text,
  created_at timestamptz default now()
);

create table weekly_summaries (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  year int not null,
  week_number int not null,
  week_start date not null,
  week_end date not null,
  total_screen_points int default 0,
  total_christmas_points int default 0,
  total_points int default 0,
  screen_time_earned int default 0,
  screen_time_used int default 0,
  christmas_fund_earned decimal(10,2) default 0,
  allowance_earned decimal(10,2) default 0,
  days_tracked int default 0,
  is_paid boolean default false,
  notes text,
  behavior_goal text,
  is_finalized boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(child_id, year, week_number)
);

-- =====================================================================
-- Indexes
-- =====================================================================

create index idx_profiles_family on profiles(family_id);
create index idx_children_family on children(family_id);
create index idx_daily_tracking_child on daily_tracking(child_id);
create index idx_daily_tracking_date on daily_tracking(date);
create index idx_bonus_events_tracking on bonus_events(daily_tracking_id);
create index idx_weekly_summaries_child on weekly_summaries(child_id);
create index idx_categories_family on categories(family_id);
create index idx_bonus_presets_family on bonus_presets(family_id);
create index idx_deduction_presets_family on deduction_presets(family_id);

-- =====================================================================
-- Helper functions (search_path hardened)
-- =====================================================================

create or replace function get_user_family_id()
returns uuid
language sql
security definer
set search_path to 'public'
as $$
  select family_id from profiles where id = auth.uid();
$$;

create or replace function is_parent()
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select role = 'parent' from profiles where id = auth.uid();
$$;

create or replace function child_in_family(child_uuid uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from children c
    where c.id = child_uuid and c.family_id = get_user_family_id()
  );
$$;

create or replace function get_iso_week_number(input_date date)
returns integer
language plpgsql
immutable
as $$
begin
  return extract(week from input_date)::integer;
end;
$$;

-- =====================================================================
-- updated_at triggers
-- =====================================================================

create or replace function update_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tr_families_updated_at before update on families
  for each row execute function update_updated_at();
create trigger tr_profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger tr_children_updated_at before update on children
  for each row execute function update_updated_at();
create trigger tr_configurations_updated_at before update on configurations
  for each row execute function update_updated_at();
create trigger tr_categories_updated_at before update on categories
  for each row execute function update_updated_at();
create trigger tr_bonus_presets_updated_at before update on bonus_presets
  for each row execute function update_updated_at();
create trigger tr_deduction_presets_updated_at before update on deduction_presets
  for each row execute function update_updated_at();
create trigger tr_daily_tracking_updated_at before update on daily_tracking
  for each row execute function update_updated_at();
create trigger tr_weekly_summaries_updated_at before update on weekly_summaries
  for each row execute function update_updated_at();

-- =====================================================================
-- Aggregation + total_points computation
-- =====================================================================

create or replace function calculate_daily_total_points(tracking_record daily_tracking)
returns integer
language plpgsql
immutable
as $$
declare
  category_sum integer := 0;
  key text;
  value jsonb;
begin
  for key, value in select * from jsonb_each(tracking_record.category_points)
  loop
    category_sum := category_sum + coalesce((value::text)::integer, 0);
  end loop;
  return category_sum + coalesce(tracking_record.daily_bonuses, 0) + coalesce(tracking_record.daily_deductions, 0);
end;
$$;

create or replace function update_daily_tracking_total()
returns trigger
language plpgsql
as $$
declare
  category_sum integer := 0;
  key text;
  value jsonb;
begin
  for key, value in select * from jsonb_each(new.category_points)
  loop
    category_sum := category_sum + coalesce((value::text)::integer, 0);
  end loop;
  new.total_points := category_sum + coalesce(new.daily_bonuses, 0) + coalesce(new.daily_deductions, 0);
  return new;
end;
$$;

create trigger trigger_update_daily_tracking_total
  before insert or update on daily_tracking
  for each row execute function update_daily_tracking_total();

create or replace function get_weekly_summary(
  p_child_id uuid,
  p_week_start date,
  p_week_end date
)
returns table (
  total_points integer,
  screen_time_earned integer,
  allowance_earned numeric,
  days_tracked integer,
  daily_breakdown jsonb
)
language plpgsql
stable
as $$
declare
  v_config record;
begin
  select c.points_to_minutes, c.points_to_dollars
  into v_config
  from children ch
  join configurations c on c.family_id = ch.family_id
  where ch.id = p_child_id
  limit 1;

  return query
  select
    coalesce(sum(dt.total_points), 0)::integer,
    (coalesce(sum(dt.total_points), 0) * coalesce(v_config.points_to_minutes, 5))::integer,
    (coalesce(sum(dt.total_points), 0) * coalesce(v_config.points_to_dollars, 0.5))::numeric,
    count(dt.id)::integer,
    jsonb_agg(
      jsonb_build_object(
        'date', dt.date,
        'points', dt.total_points,
        'category_points', dt.category_points,
        'bonuses', dt.daily_bonuses,
        'deductions', dt.daily_deductions
      ) order by dt.date
    )
  from daily_tracking dt
  where dt.child_id = p_child_id
    and dt.date >= p_week_start
    and dt.date <= p_week_end;
end;
$$;

create or replace function upsert_weekly_summary(
  p_child_id uuid,
  p_week_start date,
  p_week_end date
)
returns void
language plpgsql
as $$
declare
  v_summary record;
  v_year integer;
  v_week_number integer;
begin
  v_year := extract(year from p_week_start)::integer;
  v_week_number := get_iso_week_number(p_week_start);

  select * into v_summary
  from get_weekly_summary(p_child_id, p_week_start, p_week_end);

  insert into weekly_summaries (
    child_id, year, week_number, week_start, week_end,
    total_screen_points, total_christmas_points, screen_time_earned, is_finalized
  )
  values (
    p_child_id, v_year, v_week_number, p_week_start, p_week_end,
    coalesce(v_summary.total_points, 0),
    coalesce(v_summary.total_points, 0),
    coalesce(v_summary.screen_time_earned, 0),
    false
  )
  on conflict (child_id, year, week_number)
  do update set
    total_screen_points = excluded.total_screen_points,
    total_christmas_points = excluded.total_christmas_points,
    screen_time_earned = excluded.screen_time_earned,
    week_start = excluded.week_start,
    week_end = excluded.week_end,
    updated_at = now();
end;
$$;

create or replace function auto_update_weekly_summary()
returns trigger
language plpgsql
as $$
declare
  v_week_start date;
  v_week_end date;
  v_day_of_week integer;
begin
  v_day_of_week := extract(dow from coalesce(new.date, old.date));
  if v_day_of_week = 0 then
    v_week_start := coalesce(new.date, old.date) - interval '6 days';
  else
    v_week_start := coalesce(new.date, old.date) - interval '1 day' * (v_day_of_week - 1);
  end if;
  v_week_end := v_week_start + interval '6 days';

  perform upsert_weekly_summary(
    coalesce(new.child_id, old.child_id),
    v_week_start::date,
    v_week_end::date
  );
  return coalesce(new, old);
end;
$$;

create trigger trigger_auto_update_weekly_summary
  after insert or update or delete on daily_tracking
  for each row execute function auto_update_weekly_summary();

-- =====================================================================
-- Auth integration: create profile on signup
-- =====================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'parent')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- Bootstrap defaults for a new family
-- =====================================================================

create or replace function initialize_family(
  family_name text,
  user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_family_id uuid;
begin
  insert into families (name) values (family_name) returning id into new_family_id;

  update profiles set family_id = new_family_id where id = user_id;

  insert into configurations (family_id) values (new_family_id);

  insert into categories (family_id, name, key, icon, max_points, order_index) values
    (new_family_id, 'Health & Nutrition', 'healthNutrition', '🥗', 3, 1),
    (new_family_id, 'Screen Discipline', 'screenDiscipline', '📱', 2, 2),
    (new_family_id, 'Self-Study & Learning', 'selfStudy', '📚', 2, 3),
    (new_family_id, 'Household Contribution', 'household', '🏠', 3, 4),
    (new_family_id, 'Behavior & Respect', 'behaviorRespect', '⭐', 2, 5);

  insert into bonus_presets (family_id, label, points, order_index) values
    (new_family_id, 'Perfect sugar-free day', 2, 1),
    (new_family_id, 'Extraordinary helpfulness', 3, 2),
    (new_family_id, 'Homework ahead of schedule', 2, 3),
    (new_family_id, 'Helped sibling/peer', 2, 4);

  insert into deduction_presets (family_id, label, points, order_index) values
    (new_family_id, 'Disrespectful behavior', -2, 1),
    (new_family_id, 'Excessive screen time', -3, 2),
    (new_family_id, 'Refused to help', -2, 3),
    (new_family_id, 'Unhealthy snacking', -1, 4);

  return new_family_id;
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table families enable row level security;
alter table profiles enable row level security;
alter table children enable row level security;
alter table configurations enable row level security;
alter table categories enable row level security;
alter table bonus_presets enable row level security;
alter table deduction_presets enable row level security;
alter table daily_tracking enable row level security;
alter table bonus_events enable row level security;
alter table weekly_summaries enable row level security;

-- profiles: policies use auth.uid() directly to avoid RLS recursion
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Parents can view family profiles" on profiles
  for select using (family_id = get_user_family_id());

-- families
create policy "Anyone can create family" on families
  for insert with check (true);
create policy "Users can view own family" on families
  for select using (id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can update own family" on families
  for update using (id = get_user_family_id() and is_parent());

-- children (split policies — avoids RLS recursion on profiles lookups)
create policy "Family members can view children" on children
  for select using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can add children" on children
  for insert with check (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));
create policy "Parents can update children" on children
  for update using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));
create policy "Parents can delete children" on children
  for delete using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));

-- configurations
create policy "Family members can view config" on configurations
  for select using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can manage config" on configurations
  for all
  using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'))
  with check (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));

-- categories
create policy "Family members can view categories" on categories
  for select using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can manage categories" on categories
  for all
  using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'))
  with check (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));

-- bonus_presets
create policy "Family members can view bonus presets" on bonus_presets
  for select using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can manage bonus presets" on bonus_presets
  for all
  using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'))
  with check (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));

-- deduction_presets
create policy "Family members can view deduction presets" on deduction_presets
  for select using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "Parents can manage deduction presets" on deduction_presets
  for all
  using (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'))
  with check (family_id in (select family_id from profiles where id = auth.uid() and role = 'parent'));

-- daily_tracking
create policy "Parents can manage daily tracking" on daily_tracking
  for all using (child_in_family(child_id));

-- bonus_events
create policy "Parents can manage bonus events" on bonus_events
  for all using (
    exists (
      select 1 from daily_tracking dt
      where dt.id = bonus_events.daily_tracking_id
      and child_in_family(dt.child_id)
    )
  );

-- weekly_summaries
create policy "Parents can manage weekly summaries" on weekly_summaries
  for all using (child_in_family(child_id));

-- =====================================================================
-- Grants
-- =====================================================================

grant execute on function get_user_family_id to authenticated;
grant execute on function is_parent to authenticated;
grant execute on function child_in_family to authenticated;
grant execute on function get_iso_week_number to authenticated;
grant execute on function calculate_daily_total_points to authenticated;
grant execute on function update_daily_tracking_total to authenticated;
grant execute on function get_weekly_summary to authenticated;
grant execute on function upsert_weekly_summary to authenticated;
grant execute on function auto_update_weekly_summary to authenticated;
grant execute on function initialize_family to authenticated;
