-- Daily Plans table - stores each day's planned goals and schedule
CREATE TABLE IF NOT EXISTS planner_daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  goals JSONB NOT NULL DEFAULT '[]',  -- Array of {title, description, project_id?, completed}
  schedule JSONB DEFAULT '[]',         -- Array of {time, duration, activity, goal_index?}
  reflection TEXT,                      -- End of day reflection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date)            -- One plan per user per day
);

-- Add project-related fields to goals table
ALTER TABLE planner_goals
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_planner_daily_plans_user_date
  ON planner_daily_plans(user_id, plan_date DESC);

-- Enable RLS
ALTER TABLE planner_daily_plans ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON planner_daily_plans FOR ALL USING (true);
