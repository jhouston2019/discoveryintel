-- Apply to existing Postgres databases (e.g. Supabase) that predate these columns.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS analysis_paid BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'other';
