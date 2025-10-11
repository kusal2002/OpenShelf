-- Database Fix Script for OpenShelf
-- Run this BEFORE running the main schema if you get extension errors

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create the missing bookmarks table that's referenced in indexes
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(material_id, user_id, page_number)
);

-- Enable RLS for bookmarks table
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookmarks table
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON public.bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Add columns for PDF content search
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS content_extraction_status VARCHAR(20) DEFAULT 'pending';

-- Create indexes (now that pg_trgm is enabled)
CREATE INDEX IF NOT EXISTS idx_materials_content_text_gin 
ON public.materials USING gin(content_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_materials_content_extraction_status 
ON public.materials(content_extraction_status);