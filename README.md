# DiscoveryIntel

**AI Litigation Intelligence from Discovery**

DiscoveryIntel is a production-grade AI-powered platform that analyzes litigation discovery documents and generates actionable intelligence including timelines, contradictions, impeachment opportunities, evidence signals, and case strategy summaries.

## Features

- **Document Ingestion**: Upload PDF, DOCX, TXT, deposition transcripts, and email exports
- **Case Timeline Generator**: Automatically extract and organize events chronologically
- **Contradiction Detection**: Identify conflicts between statements across documents
- **Impeachment Finder**: Discover witness statements contradicted by evidence
- **Evidence Signal Extraction**: Detect admissions, inconsistencies, and suspicious communications
- **Deposition Analysis**: Analyze transcripts for key admissions and evasive answers
- **Case Theory Generator**: Generate strategic case narratives with strengths and weaknesses
- **Vector Search**: Semantic search across all discovery documents
- **Demo Mode**: Pre-loaded sample case for immediate exploration

## Technology Stack

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- ShadCN UI

### Backend
- Node.js
- Express
- TypeScript

### AI & Data
- OpenAI API (GPT-4 & Embeddings)
- Supabase (PostgreSQL + pgvector)
- Supabase Storage
- Tesseract OCR
- pdf-parse

### Infrastructure
- Docker
- BullMQ (Job Queue)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API key
- Supabase account

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/jhouston2019/discoveryintel.git
cd discoveryintel
```

### 2. Set up environment variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=development
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Set up database

Run the SQL migration script in your Supabase SQL editor:
```bash
# The schema is in backend/db/schema.sql
```

### 5. Run the application

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up
```

**Option B: Run manually**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 6. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

1. **Sign Up**: Create an account
2. **Create Case**: Start a new litigation case
3. **Upload Documents**: Upload discovery files (PDF, DOCX, TXT)
4. **Process**: System automatically processes and analyzes documents
5. **View Intelligence**: Access the litigation intelligence dashboard
6. **Search**: Use semantic search to query across all documents

## Demo Mode

The application includes a pre-loaded demo case with sample discovery documents and analysis results. Click "View Demo" on the landing page to explore without uploading files.

## Project Structure

```
/discoveryintel
  /frontend          # Next.js application
    /app             # App router pages
    /components      # React components
    /lib             # Utilities and helpers
  /backend           # Express API server
    /api             # API routes
    /services        # Business logic
    /db              # Database utilities
    /utils           # Helper functions
  /shared            # Shared types and constants
  docker-compose.yml
  README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - List user's cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get case details

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:caseId` - List case documents
- `GET /api/documents/:id/status` - Check processing status

### Analysis
- `GET /api/analysis/:caseId/timeline` - Get case timeline
- `GET /api/analysis/:caseId/contradictions` - Get contradictions
- `GET /api/analysis/:caseId/impeachment` - Get impeachment opportunities
- `GET /api/analysis/:caseId/evidence` - Get evidence signals
- `GET /api/analysis/:caseId/deposition` - Get deposition analysis
- `GET /api/analysis/:caseId/strategy` - Get case strategy

### Search
- `POST /api/search` - Semantic search across documents

## Architecture

### Document Processing Flow

1. **Upload** → Document uploaded to Supabase Storage
2. **Parse** → Extract text (PDF/DOCX parsing, OCR for images)
3. **Chunk** → Split into semantic chunks
4. **Embed** → Generate OpenAI embeddings
5. **Store** → Save vectors to pgvector
6. **Analyze** → Run AI analysis modules
7. **Present** → Display results in dashboard

### AI Analysis Pipeline

Each analysis module uses:
- Vector search to find relevant document sections
- OpenAI GPT-4 to analyze and structure findings
- Structured output stored in `analysis_results` table

## Security

- JWT-based authentication
- Case-level data isolation (users only see their cases)
- Secure document storage with Supabase RLS
- Environment variable protection
- Input validation and sanitization

## Deployment

### Docker Deployment

```bash
docker-compose up --build
```

### Cloud Deployment

The application is ready to deploy to:
- Vercel (Frontend)
- Railway/Render (Backend)
- Supabase (Database & Storage)

See deployment guides in `/docs` folder.

## Development

### Run tests
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Type check
```bash
npm run type-check
```

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
