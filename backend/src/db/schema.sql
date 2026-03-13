-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status VARCHAR(50) DEFAULT 'pending',
  processing_error TEXT
);

-- Document chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding_vector vector(1536)
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_case_id ON analysis_results(case_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(case_id, analysis_type);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY cases_select_own ON cases
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY cases_insert_own ON cases
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY documents_select_own ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = documents.case_id 
      AND cases.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY document_chunks_select_own ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      JOIN cases ON cases.id = documents.case_id
      WHERE documents.id = document_chunks.document_id 
      AND cases.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY analysis_results_select_own ON analysis_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = analysis_results.case_id 
      AND cases.user_id::text = auth.uid()::text
    )
  );

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('discovery-documents', 'discovery-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'discovery-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'discovery-documents' AND auth.role() = 'authenticated');
