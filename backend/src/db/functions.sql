-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  target_case_id UUID DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  document_name TEXT,
  chunk_text TEXT,
  similarity FLOAT,
  page_reference TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vector vector(1536);
BEGIN
  query_vector := query_embedding::vector;

  RETURN QUERY
  SELECT
    dc.document_id,
    d.filename as document_name,
    dc.chunk_text,
    1 - (dc.embedding_vector <=> query_vector) as similarity,
    NULL::TEXT as page_reference
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE 
    (target_case_id IS NULL OR d.case_id = target_case_id)
    AND 1 - (dc.embedding_vector <=> query_vector) > match_threshold
  ORDER BY dc.embedding_vector <=> query_vector
  LIMIT match_count;
END;
$$;
