-- Supabase Schema for Child Reward System
-- Multi-user, multi-child support with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FAMILIES TABLE
-- ============================================
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHILDREN TABLE (trackable children in family)
-- ============================================
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional: link to a profile for child login
  name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#3b82f6',
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  can_view_dashboard BOOLEAN DEFAULT false, -- Whether child can login and view
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIGURATION TABLE (per-family settings)
-- ============================================
CREATE TABLE configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  points_to_minutes DECIMAL(10,2) DEFAULT 0.5,
  points_to_dollars DECIMAL(10,2) DEFAULT 1.0,
  christmas_goal DECIMAL(10,2) DEFAULT 500.0,
  max_weekly_screen_time INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id)
);

-- ============================================
-- CATEGORIES TABLE (per-family point categories)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  icon TEXT NOT NULL,
  max_points INT NOT NULL,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, key)
);

-- ============================================
-- BONUS PRESETS TABLE (per-family)
-- ============================================
CREATE TABLE bonus_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INT NOT NULL,
  icon TEXT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEDUCTION PRESETS TABLE (per-family)
-- ============================================
CREATE TABLE deduction_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INT NOT NULL, -- Stored as negative values
  icon TEXT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY TRACKING TABLE (per-child)
-- ============================================
CREATE TABLE daily_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  
  -- Category points stored as JSONB: { "categoryKey": pointsValue }
  category_points JSONB DEFAULT '{}',
  
  -- Legacy fields for backward compatibility
  health_nutrition INT DEFAULT 0,
  screen_discipline INT DEFAULT 0,
  self_study INT DEFAULT 0,
  household INT DEFAULT 0,
  behavior_respect INT DEFAULT 0,
  
  -- Calculated totals
  daily_bonuses INT DEFAULT 0,
  daily_deductions INT DEFAULT 0,
  screen_time_total INT DEFAULT 0,
  christmas_fund_total INT DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, date)
);

-- ============================================
-- BONUS EVENTS TABLE (per-child daily events)
-- ============================================
CREATE TABLE bonus_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_tracking_id UUID NOT NULL REFERENCES daily_tracking(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus', 'deduction')),
  category TEXT NOT NULL,
  points INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY SUMMARIES TABLE (per-child)
-- ============================================
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  year INT NOT NULL,
  week_number INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  total_screen_points INT DEFAULT 0,
  total_christmas_points INT DEFAULT 0,
  screen_time_earned INT DEFAULT 0,
  screen_time_used INT DEFAULT 0,
  christmas_fund_earned DECIMAL(10,2) DEFAULT 0,
  
  notes TEXT,
  behavior_goal TEXT,
  is_finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, year, week_number)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_family ON profiles(family_id);
CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_daily_tracking_child ON daily_tracking(child_id);
CREATE INDEX idx_daily_tracking_date ON daily_tracking(date);
CREATE INDEX idx_bonus_events_tracking ON bonus_events(daily_tracking_id);
CREATE INDEX idx_weekly_summaries_child ON weekly_summaries(child_id);
CREATE INDEX idx_categories_family ON categories(family_id);
CREATE INDEX idx_bonus_presets_family ON bonus_presets(family_id);
CREATE INDEX idx_deduction_presets_family ON deduction_presets(family_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE deduction_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's family_id
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
  SELECT role = 'parent' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if child belongs to user's family
CREATE OR REPLACE FUNCTION child_in_family(child_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = child_uuid AND c.family_id = get_user_family_id()
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Parents can view family profiles"
  ON profiles FOR SELECT
  USING (family_id = get_user_family_id());

-- FAMILIES policies
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id = get_user_family_id());

CREATE POLICY "Parents can update own family"
  ON families FOR UPDATE
  USING (id = get_user_family_id() AND is_parent());

-- CHILDREN policies
CREATE POLICY "Parents can manage children in their family"
  ON children FOR ALL
  USING (family_id = get_user_family_id() AND is_parent());

CREATE POLICY "Children can view themselves"
  ON children FOR SELECT
  USING (
    linked_profile_id = auth.uid() OR
    (family_id = get_user_family_id() AND is_parent())
  );

-- CONFIGURATIONS policies
CREATE POLICY "Family members can view config"
  ON configurations FOR SELECT
  USING (family_id = get_user_family_id());

CREATE POLICY "Parents can manage config"
  ON configurations FOR ALL
  USING (family_id = get_user_family_id() AND is_parent());

-- CATEGORIES policies
CREATE POLICY "Family members can view categories"
  ON categories FOR SELECT
  USING (family_id = get_user_family_id());

CREATE POLICY "Parents can manage categories"
  ON categories FOR ALL
  USING (family_id = get_user_family_id() AND is_parent());

-- BONUS_PRESETS policies
CREATE POLICY "Family members can view bonus presets"
  ON bonus_presets FOR SELECT
  USING (family_id = get_user_family_id());

CREATE POLICY "Parents can manage bonus presets"
  ON bonus_presets FOR ALL
  USING (family_id = get_user_family_id() AND is_parent());

-- DEDUCTION_PRESETS policies
CREATE POLICY "Family members can view deduction presets"
  ON deduction_presets FOR SELECT
  USING (family_id = get_user_family_id());

CREATE POLICY "Parents can manage deduction presets"
  ON deduction_presets FOR ALL
  USING (family_id = get_user_family_id() AND is_parent());

-- DAILY_TRACKING policies
CREATE POLICY "Parents can manage daily tracking"
  ON daily_tracking FOR ALL
  USING (child_in_family(child_id) AND is_parent());

CREATE POLICY "Children can view their own tracking"
  ON daily_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = daily_tracking.child_id
      AND c.linked_profile_id = auth.uid()
      AND c.can_view_dashboard = true
    )
  );

-- BONUS_EVENTS policies
CREATE POLICY "Parents can manage bonus events"
  ON bonus_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM daily_tracking dt
      WHERE dt.id = bonus_events.daily_tracking_id
      AND child_in_family(dt.child_id)
      AND is_parent()
    )
  );

CREATE POLICY "Children can view their own bonus events"
  ON bonus_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_tracking dt
      JOIN children c ON c.id = dt.child_id
      WHERE dt.id = bonus_events.daily_tracking_id
      AND c.linked_profile_id = auth.uid()
      AND c.can_view_dashboard = true
    )
  );

-- WEEKLY_SUMMARIES policies
CREATE POLICY "Parents can manage weekly summaries"
  ON weekly_summaries FOR ALL
  USING (child_in_family(child_id) AND is_parent());

CREATE POLICY "Children can view their own weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = weekly_summaries.child_id
      AND c.linked_profile_id = auth.uid()
      AND c.can_view_dashboard = true
    )
  );

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_configurations_updated_at
  BEFORE UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_bonus_presets_updated_at
  BEFORE UPDATE ON bonus_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_deduction_presets_updated_at
  BEFORE UPDATE ON deduction_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_daily_tracking_updated_at
  BEFORE UPDATE ON daily_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_weekly_summaries_updated_at
  BEFORE UPDATE ON weekly_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION: Handle new user signup
-- Creates profile and optionally creates family
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'parent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Initialize family with default data
-- ============================================
CREATE OR REPLACE FUNCTION initialize_family(
  family_name TEXT,
  user_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_family_id UUID;
BEGIN
  -- Create family
  INSERT INTO families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;
  
  -- Link user to family
  UPDATE profiles
  SET family_id = new_family_id
  WHERE id = user_id;
  
  -- Create default configuration
  INSERT INTO configurations (family_id)
  VALUES (new_family_id);
  
  -- Create default categories
  INSERT INTO categories (family_id, name, key, icon, max_points, order_index) VALUES
    (new_family_id, 'Health & Nutrition', 'healthNutrition', '🥗', 3, 1),
    (new_family_id, 'Screen Discipline', 'screenDiscipline', '📱', 2, 2),
    (new_family_id, 'Self-Study & Learning', 'selfStudy', '📚', 2, 3),
    (new_family_id, 'Household Contribution', 'household', '🏠', 3, 4),
    (new_family_id, 'Behavior & Respect', 'behaviorRespect', '⭐', 2, 5);
  
  -- Create default bonus presets
  INSERT INTO bonus_presets (family_id, label, points, icon, order_index) VALUES
    (new_family_id, 'Perfect sugar-free day', 2, '🍏', 1),
    (new_family_id, 'Extraordinary helpfulness', 3, '🦸', 2),
    (new_family_id, 'Homework ahead of schedule', 2, '✅', 3),
    (new_family_id, 'Helped sibling/peer', 2, '🤝', 4);
  
  -- Create default deduction presets
  INSERT INTO deduction_presets (family_id, label, points, icon, order_index) VALUES
    (new_family_id, 'Disrespectful behavior', -2, '😤', 1),
    (new_family_id, 'Refused chore', -3, '🚫', 2),
    (new_family_id, 'Lied about something', -5, '🤥', 3),
    (new_family_id, 'Physical aggression', -5, '👊', 4),
    (new_family_id, 'Sneaking screen time', -5, '📵', 5),
    (new_family_id, 'Morning routine not completed', -1, '⏰', 6),
    (new_family_id, 'Tantrum/meltdown', -3, '😭', 7);
  
  RETURN new_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
