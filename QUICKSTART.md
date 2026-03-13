# DiscoveryIntel Quick Start

Get DiscoveryIntel running in 10 minutes.

## 1. Prerequisites Check

```bash
node --version  # Should be 18+
npm --version
git --version
```

## 2. Clone and Install

```bash
git clone https://github.com/jhouston2019/discoveryintel.git
cd discoveryintel
npm install
cd shared && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 3. Supabase Setup (5 minutes)

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Run `backend/db/schema.sql`
5. Run `backend/db/functions.sql`
6. Go to Settings > API and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## 4. OpenAI Setup (2 minutes)

1. Go to https://platform.openai.com
2. Create API key
3. Copy the key

## 5. Configure Environment

**Backend** - Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=any-random-string-min-32-characters
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 6. Install Redis

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## 7. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 8. Access the App

Open http://localhost:3000

## 9. Test It Out

1. Click "Sign Up"
2. Create account
3. Create a case
4. Upload a PDF document
5. Wait for processing
6. View analysis results

## Common Issues

**Port in use:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

**Redis not running:**
```bash
redis-cli ping
# Should return PONG
```

**OpenAI errors:**
- Check API key is correct
- Verify you have credits
- Check API key has GPT-4 access

**Supabase errors:**
- Verify SQL migrations ran successfully
- Check all three keys are correct
- Ensure project is not paused

## Next Steps

- Try the demo: http://localhost:3000/demo
- Read full docs: `README.md`
- Architecture details: `ARCHITECTURE.md`
- Deployment guide: `DEPLOYMENT.md`

## Need Help?

Open an issue on GitHub with:
- Error message
- Steps to reproduce
- Environment (OS, Node version)
- Logs from terminal
