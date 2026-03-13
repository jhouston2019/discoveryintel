# DiscoveryIntel Architecture

## System Overview

DiscoveryIntel is a full-stack AI-powered litigation intelligence platform that processes discovery documents and generates actionable insights for legal professionals.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 14 + TypeScript + TailwindCSS + ShadCN UI         │
│                                                              │
│  Pages: Landing, Auth, Dashboard, Case View, Demo           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Backend API                             │
│              Express + TypeScript + Node.js                  │
│                                                              │
│  Routes: /auth, /cases, /documents, /analysis, /search      │
└─────┬────────────┬────────────┬──────────────┬─────────────┘
      │            │            │              │
      │            │            │              │
┌─────▼────┐  ┌───▼─────┐  ┌──▼──────┐  ┌────▼─────────┐
│ Supabase │  │ OpenAI  │  │  Redis  │  │ Supabase     │
│ Postgres │  │   API   │  │ BullMQ  │  │   Storage    │
│ pgvector │  │         │  │  Queue  │  │              │
└──────────┘  └─────────┘  └─────────┘  └──────────────┘
```

## Data Flow

### 1. Document Upload Flow

```
User uploads file
    ↓
Frontend sends to /api/documents/upload
    ↓
Backend receives file via multer
    ↓
File uploaded to Supabase Storage
    ↓
Document record created in database
    ↓
Background job queued for processing
    ↓
Document Parser extracts text (PDF/DOCX/OCR)
    ↓
Text chunked into segments
    ↓
OpenAI generates embeddings for each chunk
    ↓
Chunks + embeddings stored in pgvector
    ↓
Processing status updated to 'completed'
```

### 2. Analysis Flow

```
All documents processed
    ↓
Analysis Orchestrator triggered
    ↓
Parallel execution of analysis modules:
    ├─ Timeline Generator
    ├─ Contradiction Detector
    ├─ Impeachment Finder
    ├─ Evidence Extractor
    ├─ Deposition Analyzer
    └─ Strategy Generator
    ↓
Each module:
    - Retrieves relevant document chunks
    - Sends to OpenAI GPT-4 with structured prompt
    - Parses JSON response
    - Stores results in analysis_results table
    ↓
Results available via API endpoints
```

### 3. Search Flow

```
User enters search query
    ↓
Frontend sends to /api/search
    ↓
Backend generates query embedding
    ↓
Vector similarity search in pgvector
    ↓
Top matching chunks returned
    ↓
Results displayed with similarity scores
```

## Technology Stack Details

### Frontend Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **TailwindCSS**: Utility-first CSS
- **ShadCN UI**: Pre-built accessible components
- **Zustand**: State management
- **Axios**: HTTP client

### Backend Stack

- **Express**: Web framework
- **TypeScript**: Type safety
- **Multer**: File upload handling
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Zod**: Runtime validation

### AI & Data Stack

- **OpenAI GPT-4**: Text analysis and generation
- **OpenAI Embeddings**: text-embedding-3-small model
- **Supabase**: PostgreSQL database with pgvector extension
- **pgvector**: Vector similarity search
- **Supabase Storage**: File storage
- **BullMQ**: Job queue for async processing
- **Redis**: Queue backend

### Document Processing

- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction
- **tesseract.js**: OCR for scanned documents

## Database Schema

### Tables

**users**
- Stores user accounts
- Password hashed with bcrypt
- Email unique constraint

**cases**
- One case per litigation matter
- Belongs to user (foreign key)
- Contains case metadata

**documents**
- Uploaded discovery files
- Belongs to case
- Tracks processing status
- References Supabase Storage path

**document_chunks**
- Text segments from documents
- Each chunk has embedding vector (1536 dimensions)
- Indexed with ivfflat for fast similarity search

**analysis_results**
- Stores AI analysis outputs
- JSON structure for flexibility
- One record per analysis type per case

### Indexes

- B-tree indexes on foreign keys
- ivfflat index on embedding vectors for similarity search
- Composite indexes for common query patterns

### Row Level Security (RLS)

- Users can only access their own data
- Enforced at database level
- Policies on all tables

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user (requires auth)

### Cases
- `GET /api/cases` - List user's cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get case with documents

### Documents
- `POST /api/documents/upload` - Upload file (multipart/form-data)
- `GET /api/documents/:caseId` - List case documents
- `GET /api/documents/:id/status` - Check processing status

### Analysis
- `POST /api/analysis/:caseId/run` - Trigger analysis
- `GET /api/analysis/:caseId/timeline` - Get timeline
- `GET /api/analysis/:caseId/contradictions` - Get contradictions
- `GET /api/analysis/:caseId/impeachment` - Get impeachment opportunities
- `GET /api/analysis/:caseId/evidence` - Get evidence signals
- `GET /api/analysis/:caseId/deposition` - Get deposition analysis
- `GET /api/analysis/:caseId/strategy` - Get case strategy

### Search
- `POST /api/search` - Semantic search (requires caseId and query)

## AI Analysis Modules

### Timeline Generator
- Extracts dates and events from all documents
- Uses GPT-4 to identify temporal references
- Sorts chronologically
- Returns structured timeline with confidence scores

### Contradiction Detector
- Compares all document pairs
- Identifies conflicting statements
- Severity classification (high/medium/low)
- Provides explanation of contradiction

### Impeachment Finder
- Focuses on deposition transcripts vs evidence
- Finds witness statements contradicted by documents
- Strength assessment
- Page references for court use

### Evidence Extractor
- Detects admissions, inconsistencies, suspicious communications
- Importance classification (critical/high/medium/low)
- Categorizes signal types
- Highlights key evidence

### Deposition Analyzer
- Analyzes deposition transcripts specifically
- Identifies key admissions
- Flags contradictions within testimony
- Detects evasive answers

### Strategy Generator
- Synthesizes all analysis results
- Identifies case strengths and weaknesses
- Suggests leverage points
- Predicts defense narrative
- Recommends actions

## Security Architecture

### Authentication
- JWT-based authentication
- Tokens expire after 7 days
- Passwords hashed with bcrypt (10 rounds)
- Bearer token in Authorization header

### Authorization
- Middleware validates JWT on protected routes
- User ID extracted from token
- Database queries filtered by user_id

### Data Isolation
- Row Level Security (RLS) in Supabase
- Users can only access their own cases
- Storage policies enforce access control

### Input Validation
- Zod schemas validate all inputs
- File type restrictions on uploads
- File size limits (50MB)
- SQL injection prevention via parameterized queries

## Scalability Considerations

### Current Architecture
- Suitable for 100-1000 users
- Handles cases with 10-50 documents
- Processing time: 2-5 minutes per document

### Scaling Options

**Horizontal Scaling:**
- Deploy multiple backend instances behind load balancer
- Redis queue enables distributed workers
- Stateless API design supports scaling

**Database Optimization:**
- pgvector indexes for fast similarity search
- Partitioning for large document_chunks table
- Read replicas for analytics queries

**Processing Optimization:**
- Increase BullMQ worker concurrency
- Batch embedding generation
- Cache frequently accessed analysis results

**Storage:**
- Supabase Storage scales automatically
- CDN for document delivery
- Compression for large files

## Monitoring & Logging

### Application Logs
- Console logging in development
- Structured logging for production
- Error tracking with stack traces

### Database Monitoring
- Supabase dashboard for query performance
- Connection pool monitoring
- Storage usage tracking

### API Monitoring
- Response time tracking
- Error rate monitoring
- Usage analytics

## Cost Estimates

### OpenAI API
- Embeddings: ~$0.02 per 1M tokens
- GPT-4: ~$0.03 per 1K tokens
- Typical case (10 docs): $2-5

### Supabase
- Free tier: 500MB database, 1GB storage
- Pro tier: $25/month for production use

### Infrastructure
- Redis: Free (self-hosted) or $10/month (managed)
- Hosting: $10-30/month (Railway/Render/Vercel)

## Future Enhancements

- Real-time collaboration
- Document annotations
- Export to PDF reports
- Email notifications
- Mobile app
- Advanced analytics dashboard
- Multi-language support
- Integration with case management systems
