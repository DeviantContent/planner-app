-- Planner App Schema
-- Run this migration to set up the required tables

-- Users table
CREATE TABLE IF NOT EXISTS planner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (conversation history)
CREATE TABLE IF NOT EXISTS planner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  surge_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS planner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS planner_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES planner_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_planner_users_phone ON planner_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_planner_messages_user ON planner_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planner_goals_user ON planner_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user ON planner_tasks(user_id, completed);

-- Enable RLS
ALTER TABLE planner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_tasks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON planner_users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON planner_messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON planner_goals FOR ALL USING (true);
CREATE POLICY "Service role full access" ON planner_tasks FOR ALL USING (true);
