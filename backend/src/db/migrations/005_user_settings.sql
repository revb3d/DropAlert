-- Add user settings: default threshold, email notifications
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_threshold_percent INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_email TEXT;
