-- Migration: Add search queries table for analytics
-- Description: Creates a table to track search queries for trending searches analytics

CREATE TABLE IF NOT EXISTS search_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- Enable Row Level Security
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own search queries
CREATE POLICY "Users can insert their own search queries" ON search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to read their own search queries
CREATE POLICY "Users can read their own search queries" ON search_queries
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow reading all search queries for trending analytics (service role or authenticated users)
CREATE POLICY "Allow reading all search queries for analytics" ON search_queries
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to read all search queries for analytics
CREATE POLICY "Service role can read all search queries" ON search_queries
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');