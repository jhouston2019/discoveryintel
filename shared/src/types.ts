export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  case_name: string;
  description?: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding_vector?: number[];
}

export interface AnalysisResult {
  id: string;
  case_id: string;
  analysis_type: AnalysisType;
  result_json: any;
  created_at: string;
}

export type AnalysisType = 
  | 'timeline'
  | 'contradictions'
  | 'impeachment'
  | 'evidence'
  | 'deposition'
  | 'strategy';

export interface TimelineEvent {
  date: string;
  event: string;
  document_source: string;
  document_id: string;
  confidence: number;
}

export interface Contradiction {
  id: string;
  statement_a: string;
  statement_b: string;
  source_a: string;
  source_b: string;
  document_id_a: string;
  document_id_b: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface ImpeachmentOpportunity {
  id: string;
  witness: string;
  statement: string;
  contradicting_evidence: string;
  document_source: string;
  document_id: string;
  page_reference?: string;
  strength: 'high' | 'medium' | 'low';
}

export interface EvidenceSignal {
  id: string;
  signal_type: 'admission' | 'inconsistency' | 'suspicious_communication' | 'timeline_gap' | 'other';
  description: string;
  document_source: string;
  document_id: string;
  page_reference?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface DepositionAnalysis {
  id: string;
  witness: string;
  key_admissions: DepositionFinding[];
  contradictions: DepositionFinding[];
  evasive_answers: DepositionFinding[];
  document_id: string;
}

export interface DepositionFinding {
  page_reference: string;
  statement: string;
  analysis: string;
  significance: 'high' | 'medium' | 'low';
}

export interface CaseStrategy {
  case_strengths: string[];
  case_weaknesses: string[];
  key_leverage_points: string[];
  potential_defense_narrative: string;
  recommended_actions: string[];
}

export interface SearchResult {
  document_id: string;
  document_name: string;
  chunk_text: string;
  similarity_score: number;
  page_reference?: string;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  status: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
