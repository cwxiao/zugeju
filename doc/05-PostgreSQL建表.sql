CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
    CREATE TYPE user_status_enum AS ENUM ('active', 'disabled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_mode_enum') THEN
    CREATE TYPE activity_mode_enum AS ENUM ('online', 'offline');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_status_enum') THEN
    CREATE TYPE activity_status_enum AS ENUM (
      'draft',
      'recruiting',
      'full',
      'pending_start',
      'in_progress',
      'finished',
      'pending_settlement',
      'settled',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_mode_enum') THEN
    CREATE TYPE expense_mode_enum AS ENUM ('none', 'aa', 'host_treat', 'designated_treat');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_status_enum') THEN
    CREATE TYPE settlement_status_enum AS ENUM ('none', 'pending', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role_enum') THEN
    CREATE TYPE member_role_enum AS ENUM ('creator', 'member');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_join_status_enum') THEN
    CREATE TYPE member_join_status_enum AS ENUM ('joined', 'quit', 'waiting');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_channel_enum') THEN
    CREATE TYPE share_channel_enum AS ENUM ('group', 'friend', 'poster');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status_enum') THEN
    CREATE TYPE invite_status_enum AS ENUM ('invited', 'viewed', 'accepted', 'declined', 'expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_event_enum') THEN
    CREATE TYPE invite_event_enum AS ENUM ('viewed', 'accepted', 'declined', 'reopened', 'joined', 'quit');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decline_reason_enum') THEN
    CREATE TYPE decline_reason_enum AS ENUM (
      'time_conflict',
      'too_far',
      'budget_issue',
      'not_interested',
      'temporary_busy',
      'too_many_people',
      'next_time',
      'custom'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status_enum') THEN
    CREATE TYPE expense_status_enum AS ENUM ('pending', 'confirmed', 'rejected', 'deleted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_item_role_enum') THEN
    CREATE TYPE settlement_item_role_enum AS ENUM ('payer', 'receiver', 'balanced');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status_enum') THEN
    CREATE TYPE transfer_status_enum AS ENUM ('pending', 'paid', 'received', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ranking_type_enum') THEN
    CREATE TYPE ranking_type_enum AS ENUM (
      'created_count',
      'joined_count',
      'host_treat_count',
      'aa_count',
      'gaming_count',
      'offline_party_count'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_range_type_enum') THEN
    CREATE TYPE time_range_type_enum AS ENUM ('last_30_days', 'all_time');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_id VARCHAR(128) NOT NULL UNIQUE,
  union_id VARCHAR(128),
  nickname VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  gender SMALLINT,
  city VARCHAR(64),
  status user_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_union_id ON users(union_id);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  type_code VARCHAR(64) NOT NULL,
  type_name VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  mode activity_mode_enum NOT NULL,
  status activity_status_enum NOT NULL DEFAULT 'draft',
  target_participant_count INTEGER NOT NULL CHECK (target_participant_count > 0),
  max_participant_count INTEGER NOT NULL CHECK (max_participant_count > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  meetup_time TIMESTAMPTZ,
  meetup_address TEXT,
  meetup_latitude NUMERIC(10, 7),
  meetup_longitude NUMERIC(10, 7),
  venue_address TEXT,
  venue_latitude NUMERIC(10, 7),
  venue_longitude NUMERIC(10, 7),
  online_join_info JSONB,
  expense_mode expense_mode_enum NOT NULL DEFAULT 'none',
  expense_flag SMALLINT NOT NULL DEFAULT 0,
  allow_member_add_expense BOOLEAN NOT NULL DEFAULT TRUE,
  settlement_status settlement_status_enum NOT NULL DEFAULT 'none',
  share_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (max_participant_count >= target_participant_count)
);

CREATE INDEX IF NOT EXISTS idx_activities_creator_status ON activities(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_type_code ON activities(type_code);

CREATE TABLE IF NOT EXISTS activity_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role member_role_enum NOT NULL DEFAULT 'member',
  join_status member_join_status_enum NOT NULL DEFAULT 'joined',
  seat_index INTEGER,
  is_waiting_list BOOLEAN NOT NULL DEFAULT FALSE,
  is_settlement_participant BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_members_join_status ON activity_members(activity_id, join_status);

CREATE TABLE IF NOT EXISTS invitation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  share_channel share_channel_enum NOT NULL,
  share_scene VARCHAR(64),
  share_token VARCHAR(128) NOT NULL UNIQUE,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_links_activity_id ON invitation_links(activity_id);

CREATE TABLE IF NOT EXISTS activity_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  invitation_link_id UUID REFERENCES invitation_links(id) ON DELETE SET NULL,
  inviter_user_id UUID REFERENCES users(id),
  invitee_user_id UUID NOT NULL REFERENCES users(id),
  source_type VARCHAR(32) NOT NULL DEFAULT 'share_link',
  current_status invite_status_enum NOT NULL DEFAULT 'invited',
  first_viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  latest_decline_reason_code decline_reason_enum,
  latest_decline_reason_text VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, invitee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_invites_activity_status ON activity_invites(activity_id, current_status);
CREATE INDEX IF NOT EXISTS idx_activity_invites_inviter ON activity_invites(inviter_user_id);

CREATE TABLE IF NOT EXISTS invite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES activity_invites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  event_type invite_event_enum NOT NULL,
  event_value JSONB,
  reason_code decline_reason_enum,
  reason_text VARCHAR(255),
  client_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_events_invite_id ON invite_events(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_events_activity_event ON invite_events(activity_id, event_type);
CREATE INDEX IF NOT EXISTS idx_invite_events_user_id ON invite_events(user_id);

CREATE TABLE IF NOT EXISTS activity_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  invitation_link_id UUID REFERENCES invitation_links(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  anonymous_open_id VARCHAR(128),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_type VARCHAR(32) NOT NULL DEFAULT 'share_link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_view_logs_activity_viewed_at ON activity_view_logs(activity_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_view_logs_user_id ON activity_view_logs(user_id);

CREATE TABLE IF NOT EXISTS activity_rsvp_stats (
  activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
  invited_count INTEGER NOT NULL DEFAULT 0,
  viewed_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  declined_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL REFERENCES users(id),
  category_code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  remark TEXT,
  receipt_urls JSONB,
  status expense_status_enum NOT NULL DEFAULT 'pending',
  included_in_settlement BOOLEAN NOT NULL DEFAULT TRUE,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_activity_id ON expenses(activity_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payer_user_id ON expenses(payer_user_id);

CREATE TABLE IF NOT EXISTS expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  share_amount BIGINT NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  participant_count INTEGER NOT NULL CHECK (participant_count > 0),
  status settlement_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_activity_id ON settlements(activity_id);

CREATE TABLE IF NOT EXISTS settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  paid_amount BIGINT NOT NULL DEFAULT 0,
  should_bear_amount BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL DEFAULT 0,
  role_type settlement_item_role_enum NOT NULL DEFAULT 'balanced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(settlement_id, user_id)
);

CREATE TABLE IF NOT EXISTS settlement_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL CHECK (amount >= 0),
  transfer_status transfer_status_enum NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_transfers_settlement_id ON settlement_transfers(settlement_id);

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_created_count INTEGER NOT NULL DEFAULT 0,
  total_joined_count INTEGER NOT NULL DEFAULT 0,
  total_host_treat_count INTEGER NOT NULL DEFAULT 0,
  total_aa_count INTEGER NOT NULL DEFAULT 0,
  total_online_count INTEGER NOT NULL DEFAULT 0,
  total_offline_count INTEGER NOT NULL DEFAULT 0,
  total_paid_amount BIGINT NOT NULL DEFAULT 0,
  total_receive_amount BIGINT NOT NULL DEFAULT 0,
  total_pay_amount BIGINT NOT NULL DEFAULT 0,
  top_created_activity_type VARCHAR(64),
  top_joined_activity_type VARCHAR(64),
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_type_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type_code VARCHAR(64) NOT NULL,
  created_count INTEGER NOT NULL DEFAULT 0,
  joined_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_type_code)
);

CREATE TABLE IF NOT EXISTS user_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  co_activity_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, related_user_id),
  CHECK (user_id <> related_user_id)
);

CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ranking_type ranking_type_enum NOT NULL,
  time_range_type time_range_type_enum NOT NULL,
  ranked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_value BIGINT NOT NULL DEFAULT 0,
  rank_no INTEGER NOT NULL CHECK (rank_no > 0),
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_owner_scope ON ranking_snapshots(owner_user_id, ranking_type, time_range_type, snapshot_date DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_activity_members_updated_at ON activity_members;
CREATE TRIGGER trg_activity_members_updated_at BEFORE UPDATE ON activity_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_activity_invites_updated_at ON activity_invites;
CREATE TRIGGER trg_activity_invites_updated_at BEFORE UPDATE ON activity_invites
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settlements_updated_at ON settlements;
CREATE TRIGGER trg_settlements_updated_at BEFORE UPDATE ON settlements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_stats_updated_at ON user_stats;
CREATE TRIGGER trg_user_stats_updated_at BEFORE UPDATE ON user_stats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_type_stats_updated_at ON user_type_stats;
CREATE TRIGGER trg_user_type_stats_updated_at BEFORE UPDATE ON user_type_stats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_relations_updated_at ON user_relations;
CREATE TRIGGER trg_user_relations_updated_at BEFORE UPDATE ON user_relations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_activity_rsvp_stats_touch ON activity_rsvp_stats;
CREATE TRIGGER trg_activity_rsvp_stats_touch BEFORE UPDATE ON activity_rsvp_stats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();