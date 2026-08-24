-- ============================================================
-- StudyDash — Complete Database Migration
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Helper: update updated_at automatically ────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ─── MODULES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  code           TEXT,
  lecturer_name  TEXT,
  lecturer_email TEXT,
  description    TEXT,
  academic_year  TEXT,
  semester       TEXT,
  colour         TEXT NOT NULL DEFAULT '#6366f1',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_all" ON modules FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ASSIGNMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES modules(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  due_date        DATE NOT NULL,
  due_time        TIME,
  status          TEXT NOT NULL DEFAULT 'Not Started'
                    CHECK (status IN ('Not Started','In Progress','Submitted','Completed')),
  assignment_type TEXT NOT NULL DEFAULT 'Individual'
                    CHECK (assignment_type IN ('Individual','Group')),
  weightage       NUMERIC(5,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_all" ON assignments FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ASSIGNMENT GROUP MEMBERS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_group_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL
);

ALTER TABLE assignment_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_all" ON assignment_group_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_id AND a.user_id = auth.uid()
  ));

-- ─── ASSIGNMENT FILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assignment_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignment_files_all" ON assignment_files FOR ALL
  USING (EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_id AND a.user_id = auth.uid()
  ));

-- ─── TESTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id  UUID REFERENCES modules(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME,
  location   TEXT,
  topics     TEXT[] NOT NULL DEFAULT '{}',
  weightage  NUMERIC(5,2),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_all" ON tests FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STUDY GOALS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES modules(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  week_start  DATE NOT NULL,  -- Monday of the goal's week
  priority    TEXT NOT NULL DEFAULT 'Medium'
                CHECK (priority IN ('Low','Medium','High')),
  status      TEXT NOT NULL DEFAULT 'Not Started'
                CHECK (status IN ('Not Started','In Progress','Completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_goals_all" ON study_goals FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER study_goals_updated_at
  BEFORE UPDATE ON study_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STUDY SESSIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id        UUID REFERENCES modules(id) ON DELETE SET NULL,
  study_goal_id    UUID REFERENCES study_goals(id) ON DELETE SET NULL,
  topic            TEXT,
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_sessions_all" ON study_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── CALENDAR CATEGORIES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  colour     TEXT NOT NULL DEFAULT '#6366f1',
  icon       TEXT NOT NULL DEFAULT 'calendar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON calendar_categories FOR ALL USING (auth.uid() = user_id);

-- ─── CALENDAR EVENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category_id     UUID REFERENCES calendar_categories(id) ON DELETE SET NULL,
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ NOT NULL,
  all_day         BOOLEAN NOT NULL DEFAULT FALSE,
  location        TEXT,
  description     TEXT,
  colour          TEXT,
  recurrence_rule TEXT,   -- e.g. "FREQ=WEEKLY;BYDAY=MO,WE"
  source_type     TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source_type IN ('manual','assignment','test','study_session')),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE,
  test_id         UUID REFERENCES tests(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES modules(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events_all" ON calendar_events FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED: Default calendar categories ────────────────────────
-- These are inserted on first sign-up via the application.
-- Leave this section as a reference; the app handles seeding.

-- ─── STORAGE BUCKET ──────────────────────────────────────────
-- Run this separately in Supabase → Storage → New bucket
-- OR uncomment and run here if using the service role:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('assignment-files', 'assignment-files', false)
-- ON CONFLICT DO NOTHING;
--
-- Storage RLS policies are set up in the Supabase dashboard
-- under Storage → Policies.

-- ============================================================
-- Migration complete.
-- ============================================================
