-- Create notifications table in Supabase
-- Run this SQL in the Supabase SQL Editor

CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  useremail text NOT NULL,
  type text NOT NULL, -- 'due', 'payment', 'ai_insight', 'statement', 'alert'
  icon text NOT NULL, -- 'alert', 'money', 'sparkles', 'success'
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  actionurl text,
  createdat timestamp DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_notifications_useremail ON notifications(useremail);
CREATE INDEX idx_notifications_createdat ON notifications(createdat DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
