-- Track sent notifications to avoid duplicates
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accreditation_id UUID NOT NULL REFERENCES accreditations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  days_until_deadline INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_lookup
  ON notification_log(accreditation_id, user_email, notification_type);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification log" ON notification_log FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
