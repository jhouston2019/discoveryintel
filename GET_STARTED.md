# Get Started with DiscoveryIntel

Welcome! This guide will get you from zero to running DiscoveryIntel in about 15 minutes.

## What You're Building

A complete AI-powered litigation intelligence platform that:
- Analyzes discovery documents
- Generates case timelines
- Detects contradictions
- Finds impeachment opportunities
- Extracts evidence signals
- Provides strategic recommendations

## Prerequisites

Before starting, you need:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. **OpenAI Account** - [Sign up here](https://platform.openai.com/)
4. **Supabase Account** - [Sign up here](https://supabase.com/)
5. **Redis** - Installation instructions below

## Step-by-Step Setup

### Step 1: Get the Code (1 minute)

```bash
git clone https://github.com/jhouston2019/discoveryintel.git
cd discoveryintel
```

### Step 2: Install Redis (3 minutes)

**Windows:**
1. Download from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Set Up Supabase (5 minutes)

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose organization
   - Enter project name: "discoveryintel"
   - Choose region (closest to you)
   - Generate strong password
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

2. **Run Database Setup**
   - Click "SQL Editor" in left sidebar
   - Click "New query"
   - Open `backend/db/schema.sql` from your project
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Wait for success message

3. **Run Vector Search Function**
   - Click "New query" again
   - Open `backend/db/functions.sql`
   - Copy all contents
   - Paste and run

4. **Get Your API Keys**
   - Click "Settings" (gear icon)
   - Click "API"
   - Copy these three values:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` `public` key
     - `service_role` `secret` key (keep this secure!)

### Step 4: Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "DiscoveryIntel"
4. Copy the key (starts with `sk-`)
5. Save it securely (you won't see it again)

### Step 5: Configure Environment (2 minutes)

**Backend Configuration:**

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_KEY=your-actual-service-key
JWT_SECRET=generate-random-32-char-string
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Frontend Configuration:**

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

### Step 6: Install Dependencies (2 minutes)

```bash
npm install
cd shared && npm install && npm run build && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

Or use the quick command:
```bash
npm run install:all
```

### Step 7: Start the Application (1 minute)

**Option A: Automatic (Recommended)**

Windows:
```bash
start.bat
```

Mac/Linux:
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual**

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

**Option C: Docker**
```bash
docker-compose up
```

### Step 8: Access the Application

Open your browser to: **http://localhost:3000**

You should see the DiscoveryIntel landing page!

## First Use

### 1. Create Account
- Click "Sign Up"
- Enter email and password (min 8 characters)
- Click "Sign Up"

### 2. Create Your First Case
- You'll be redirected to Dashboard
- Click "New Case"
- Enter case name (e.g., "Smith v. ABC Corp")
- Add optional description
- Click "Create Case"

### 3. Upload a Document
- Click on your case
- Click "Choose File"
- Select a PDF, DOCX, or TXT file
- File will upload and start processing
- Watch status change: pending → processing → completed

### 4. View Analysis
- Once processing completes, click through the tabs:
  - **Overview**: Summary of all findings
  - **Timeline**: Chronological events
  - **Contradictions**: Conflicting statements
  - **Impeachment**: Witness credibility issues
  - **Evidence**: Key signals
  - **Deposition**: Transcript analysis (if applicable)
  - **Search**: Ask questions about your documents

### 5. Try the Demo
- Visit http://localhost:3000/demo
- See pre-loaded analysis results
- Explore all features without uploading files

## Common Issues & Solutions

### ❌ "Port 3000 already in use"

**Solution:**
```bash
# Kill the process
npx kill-port 3000

# Or run on different port
cd frontend
PORT=3002 npm run dev
```

### ❌ "Redis connection failed"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
```

### ❌ "OpenAI API error"

**Solutions:**
- Verify API key is correct (no extra spaces)
- Check you have credits: https://platform.openai.com/usage
- Ensure key has access to GPT-4 and embeddings

### ❌ "Supabase connection error"

**Solutions:**
- Verify all three keys are correct
- Check project is not paused (free tier pauses after inactivity)
- Ensure SQL migrations ran successfully
- Check project URL has `https://` prefix

### ❌ "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf shared/node_modules
npm run install:all
```

### ❌ "Cannot find shared types"

**Solution:**
```bash
cd shared
npm run build
cd ..
```

## Verification Checklist

After setup, verify:

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:3000
- [ ] Health check returns OK: http://localhost:3001/health
- [ ] Landing page loads
- [ ] Can create account
- [ ] Can login
- [ ] Can create case
- [ ] Can upload document
- [ ] Document processes successfully
- [ ] Analysis results appear

## Next Steps

### Learn the Platform
1. Read `FEATURES.md` - See all capabilities
2. Try the demo at `/demo`
3. Upload test documents
4. Explore analysis results

### Customize
1. Modify UI colors in `frontend/tailwind.config.ts`
2. Adjust analysis prompts in `backend/src/services/ai/`
3. Add custom analysis modules

### Deploy
1. Read `DEPLOYMENT.md`
2. Deploy to Vercel (frontend)
3. Deploy to Railway (backend)
4. Configure production environment variables

## Getting Help

### Documentation
- **Quick questions**: See QUICKSTART.md
- **Setup issues**: See SETUP.md
- **API usage**: See API.md
- **Architecture**: See ARCHITECTURE.md
- **Deployment**: See DEPLOYMENT.md

### Support
- **GitHub Issues**: Report bugs
- **GitHub Discussions**: Ask questions
- **Email**: support@discoveryintel.com (if configured)

## Tips for Success

### 1. Start with Demo Mode
- Visit `/demo` to see what the platform can do
- No setup required for demo
- Understand the output before uploading real documents

### 2. Test with Simple Documents First
- Start with a short, clear PDF
- Verify processing works
- Then try complex documents

### 3. Use Good File Names
- Name files descriptively
- Include document type (e.g., "deposition_smith.pdf")
- Helps with analysis and reference

### 4. Upload Multiple Documents
- Analysis improves with more documents
- Contradictions require 2+ documents
- Impeachment needs deposition + evidence

### 5. Ask Good Search Questions
- Use natural language
- Be specific
- Examples:
  - "What does the engineer say about the roof?"
  - "Timeline of inspections"
  - "Evidence contradicting the adjuster"

## Understanding Processing Time

- **Small PDF (1-5 pages)**: 30-60 seconds
- **Medium PDF (10-20 pages)**: 1-2 minutes
- **Large PDF (50+ pages)**: 3-5 minutes
- **Full analysis (5 documents)**: 5-10 minutes

Be patient! The AI is reading and analyzing every document thoroughly.

## Cost Awareness

### OpenAI API Costs
- Embeddings: ~$0.02 per 1M tokens
- GPT-4: ~$0.03 per 1K tokens
- Typical case (10 documents): $2-5
- Monitor usage: https://platform.openai.com/usage

### Supabase Costs
- Free tier: 500MB database, 1GB storage
- Sufficient for testing
- Upgrade to Pro ($25/month) for production

## Success Indicators

You'll know it's working when:
- ✅ Documents upload successfully
- ✅ Status changes to "completed"
- ✅ Timeline tab shows events
- ✅ Other tabs populate with findings
- ✅ Search returns relevant results

## Congratulations!

You now have a fully functional AI litigation intelligence platform running locally.

**Ready to analyze your first case?**

1. Create a case
2. Upload discovery documents
3. Wait for analysis
4. Explore the intelligence dashboard

**Questions?** Check the documentation or open an issue on GitHub.

**Ready to deploy?** See DEPLOYMENT.md for cloud deployment instructions.

---

**Welcome to DiscoveryIntel!** 🎉
