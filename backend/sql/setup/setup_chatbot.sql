-- Create chatbot conversation history table
-- Run this directly in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chatbot_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  useremail TEXT NOT NULL,
  useruserid UUID,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  message TEXT NOT NULL,
  createdat TIMESTAMP DEFAULT now(),
  updatedat TIMESTAMP DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chatbot_useremail ON public.chatbot_history(useremail);
CREATE INDEX IF NOT EXISTS idx_chatbot_createdat ON public.chatbot_history(createdat DESC);

-- Optional: Create a view to get conversation summary
CREATE OR REPLACE VIEW chatbot_conversation_summary AS
SELECT 
  useremail,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages,
  MAX(createdat) as last_message_at
FROM public.chatbot_history
GROUP BY useremail;
