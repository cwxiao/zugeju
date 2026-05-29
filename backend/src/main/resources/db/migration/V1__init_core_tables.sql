CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  open_id VARCHAR(128) NOT NULL UNIQUE,
  nickname VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  type_code VARCHAR(64) NOT NULL,
  type_name VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  mode VARCHAR(16) NOT NULL,
  status VARCHAR(32) NOT NULL,
  target_participant_count INTEGER NOT NULL,
  max_participant_count INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  meetup_time TIMESTAMPTZ,
  meetup_address TEXT,
  venue_address TEXT,
  online_join_info JSONB,
  expense_mode VARCHAR(32) NOT NULL,
  expense_flag SMALLINT NOT NULL DEFAULT 0,
  allow_member_add_expense BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_activity_mode CHECK (mode IN ('online', 'offline')),
  CONSTRAINT chk_activity_status CHECK (status IN ('draft', 'recruiting', 'full', 'pending_start', 'in_progress', 'finished', 'cancelled')),
  CONSTRAINT chk_expense_mode CHECK (expense_mode IN ('none', 'aa', 'host_treat', 'designated_treat')),
  CONSTRAINT chk_participant_count CHECK (max_participant_count >= target_participant_count)
);

CREATE INDEX IF NOT EXISTS idx_activities_creator_status ON activities(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);

CREATE TABLE IF NOT EXISTS activity_members (
  id UUID PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(16) NOT NULL,
  join_status VARCHAR(16) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id),
  CONSTRAINT chk_member_role CHECK (role IN ('creator', 'member')),
  CONSTRAINT chk_join_status CHECK (join_status IN ('joined', 'quit', 'waiting'))
);

CREATE INDEX IF NOT EXISTS idx_activity_members_user_status ON activity_members(user_id, join_status);
CREATE INDEX IF NOT EXISTS idx_activity_members_activity_status ON activity_members(activity_id, join_status);