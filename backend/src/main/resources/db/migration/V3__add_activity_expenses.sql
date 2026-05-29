CREATE TABLE IF NOT EXISTS activity_expenses (
  id UUID PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL REFERENCES users(id),
  item_name VARCHAR(64) NOT NULL,
  amount_fen INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_activity_expenses_amount CHECK (amount_fen > 0)
);

CREATE INDEX IF NOT EXISTS idx_activity_expenses_activity_created ON activity_expenses(activity_id, created_at DESC);