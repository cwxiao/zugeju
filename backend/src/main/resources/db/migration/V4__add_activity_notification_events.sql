CREATE TABLE IF NOT EXISTS activity_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id),
  actor_user_id UUID REFERENCES users(id),
  event_type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  page_path TEXT NOT NULL,
  send_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  CONSTRAINT chk_notification_send_status CHECK (send_status IN ('pending', 'sent', 'skipped', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_activity_notification_target_status
  ON activity_notification_events(target_user_id, send_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_notification_activity_type
  ON activity_notification_events(activity_id, event_type, created_at DESC);