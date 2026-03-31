-- Setup AI Insights Table for daily financial analytical pulse
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    daily_quote TEXT NOT NULL,
    projected_savings NUMERIC DEFAULT 0,
    card_insights JSONB DEFAULT '[]'::jsonb,
    health_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours')
);

-- Index for performance
CREATE INDEX IF NOT EXISTS ai_insights_user_id_idx ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS ai_insights_created_at_idx ON public.ai_insights(created_at DESC);

-- Allow users to see their own insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own AI insights"
ON public.ai_insights FOR SELECT
USING (auth.uid() = user_id);

-- Provide a seed for development if no data exists
-- INSERT INTO public.ai_insights (daily_quote, projected_savings, card_insights, health_explanation)
-- VALUES ('Your wealth grows from what you keep, not just what you make.', 12500, '[]', 'Great job maintaining low utilization!');
