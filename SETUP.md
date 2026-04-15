# DiscoveryIntel Setup Guide

Complete step-by-step guide to set up and run DiscoveryIntel locally.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm installed
- Git installed
- Docker and Docker Compose (optional, for containerized deployment)
- OpenAI API account with API key
- Supabase account (free tier works)

## Step 1: Clone Repository

```bash
git clone https://github.com/jhouston2019/discoveryintel.git
cd discoveryintel
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for the database to be provisioned
4. Note your project URL and API keys

### 2.2 Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `backend/src/db/schema.sql`
4. Run the SQL script
5. Copy and paste the contents of `backend/src/db/functions.sql`
6. Run the SQL script

### 2.3 Configure Storage

1. In Supabase dashboard, go to Storage
2. The `discovery-documents` bucket should be created automatically by the schema
3. Verify the bucket exists and policies are set

## Step 3: Environment Variables

### 3.1 Backend Environment

Create `backend/.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-string-min-32-chars
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

**How to get Supabase keys:**
- Go to Project Settings > API
- Copy the Project URL
- Copy the `anon` public key
- Copy the `service_role` secret key (keep this secure!)

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2 Frontend Environment

Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Install Dependencies

From the **repository root**:

```bash
npm run install:all
```

This installs root tooling, then `shared` (and runs `npm run build` there), then `backend` and `frontend`. The repo `.npmrc` sets `install-links=true` so local `file:../shared` dependencies are **copied** instead of symlinked (avoids common Windows `EISDIR` errors).

To install only root dev tools (e.g. `concurrently`):

```bash
npm install
```

## Step 5: Build packages

From the repository root:

```bash
npm run build
```

This compiles `shared` and `backend`, then runs `next build` for the frontend.

## Step 6: Run the Application

### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

This will start:
- Redis (port 6379)
- Backend API (port 3001)
- Frontend (port 3000)

### Option B: Run Manually

You'll need 3 terminal windows:

**Terminal 1 - Redis:**
```bash
# Install Redis if not already installed
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 7: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Step 8: Test the Application

1. Open http://localhost:3000
2. Click "Sign Up" and create an account
3. Login with your credentials
4. Create a new case
5. Upload a discovery document (PDF, DOCX, or TXT)
6. Wait for processing to complete
7. View the analysis results in different tabs

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:

**Backend:**
Change `PORT` in `backend/.env` to a different port (e.g., 3002)

**Frontend:**
```bash
cd frontend
PORT=3001 npm run dev
```

### OpenAI API Errors

- Verify your API key is correct
- Check you have credits available in your OpenAI account
- Ensure the API key has access to GPT-4 and embeddings

### Supabase Connection Errors

- Verify all three Supabase environment variables are set correctly
- Check that the SQL migrations ran successfully
- Ensure your Supabase project is active

### Document Upload Fails

- Check that the `uploads` directory exists in backend folder
- Verify file size is under 50MB
- Ensure file type is PDF, DOCX, or TXT

### Redis Connection Errors

- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check REDIS_URL in backend/.env is correct

### Windows: Next.js `readlink` / `EISDIR` during `npm run build` (frontend)

This is **not** caused by dynamic routes like `app/cases/[id]` — it happens when the **full project path contains spaces** (Webpack/Next on Windows). The frontend **`prebuild`** script stops with a clear error if it detects that.

**Fixes:**

1. **Recommended:** clone or move the repo to a path **without spaces**, e.g. `C:\dev\discoveryintel`, then run `npm run install:all` and `npm run build` as usual.
2. **Or** from the repo root run **`npm run build:win`**, which stages `shared` + `frontend` under `%TEMP%`, runs the build there, and copies `frontend/.next` back.

### Windows: install errors (EISDIR, EPERM, or slow `npm install`)

- Use **`npm run install:all`** from the repo root (this project does not use npm workspaces, so `file:../shared` links avoid symlink issues).
- If install fails with **EPERM** on files under `node_modules`, close editors/terminals using that folder, pause antivirus for the project path, delete `backend/node_modules` (and other package `node_modules`), and run `npm run install:all` again.
- If a previous attempt left a broken tree, delete root `package-lock.json` and each `node_modules` folder, then reinstall.

## Development Tips

### Watch Logs

**Backend logs:**
```bash
cd backend
npm run dev
```

**Check document processing:**
- Watch the console output for processing status
- Check Supabase database for document_chunks entries

### Database Queries

Use Supabase SQL Editor to query data:

```sql
-- Check users
SELECT * FROM users;

-- Check cases
SELECT * FROM cases;

-- Check documents and processing status
SELECT id, filename, processing_status FROM documents;

-- Check analysis results
SELECT case_id, analysis_type, created_at FROM analysis_results;
```

### Reset Database

To start fresh:

```sql
TRUNCATE users, cases, documents, document_chunks, analysis_results CASCADE;
```

## Production Deployment

### Deploy to Cloud

**Frontend (Vercel):**
```bash
cd frontend
vercel deploy
```

**Backend (Railway/Render):**
1. Connect your GitHub repository
2. Set environment variables
3. Deploy from main branch

**Database:**
- Supabase is already cloud-hosted
- No additional deployment needed

### Environment Variables for Production

Ensure all production environment variables are set:
- Use production Supabase URL and keys
- Use secure JWT_SECRET
- Set NODE_ENV=production
- Configure CORS for your production domain

## Next Steps

- Customize the UI theme in `frontend/tailwind.config.ts`
- Add more analysis modules in `backend/src/services/ai/`
- Implement additional file type parsers
- Add email notifications for completed analysis
- Implement team collaboration features

## Support

For issues:
1. Check the logs in terminal
2. Verify environment variables
3. Check Supabase dashboard for errors
4. Open a GitHub issue with details
