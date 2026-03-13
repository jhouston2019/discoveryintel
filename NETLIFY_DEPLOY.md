# Netlify Deployment Guide for DiscoveryIntel

## Quick Deploy to Netlify

### Step 1: Configure Netlify

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub**
   - Choose "GitHub"
   - Authorize Netlify
   - Select repository: `jhouston2019/discoveryintel`

3. **Configure Build Settings**
   
   Netlify should auto-detect the `netlify.toml` file, but verify:
   
   - **Branch to deploy:** `main`
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/.next`

4. **Add Environment Variables**
   
   Click "Add environment variables" and add:
   
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   **Important:** You need to deploy the backend first to get the API URL!

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (3-5 minutes)

### Step 2: Deploy Backend First

Before deploying to Netlify, deploy your backend to Railway or Render:

#### Railway Deployment

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select `jhouston2019/discoveryintel`
4. Set root directory: `backend`
5. Add environment variables (see backend/.env.example)
6. Deploy
7. Copy the backend URL (e.g., `https://discoveryintel-backend.railway.app`)

#### Render Deployment

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Root directory: `backend`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Add environment variables
8. Deploy
9. Copy the backend URL

### Step 3: Update Netlify Environment

1. Go back to Netlify site settings
2. Environment variables
3. Update `NEXT_PUBLIC_API_URL` with your backend URL
4. Trigger redeploy

### Step 4: Configure Custom Domain (Optional)

1. In Netlify dashboard → Domain settings
2. Add custom domain
3. Configure DNS records
4. Enable HTTPS (automatic)

## Troubleshooting

### Build Fails with "Base directory does not exist"

**Solution:** The `netlify.toml` file should have:
```toml
[build]
  base = "frontend"
```

This is already configured in your repository.

### Build Fails with "Module not found"

**Solution:** Make sure build command includes `npm install`:
```toml
command = "npm install && npm run build"
```

This is already configured.

### Frontend Loads but API Calls Fail

**Problem:** Backend not deployed or wrong API URL

**Solution:**
1. Deploy backend to Railway/Render first
2. Update `NEXT_PUBLIC_API_URL` in Netlify environment variables
3. Redeploy frontend

### CORS Errors

**Problem:** Backend not configured for frontend domain

**Solution:** Update backend CORS configuration to allow your Netlify domain:

In `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-site.netlify.app', 'http://localhost:3000']
}));
```

## Alternative: Vercel Deployment

If you prefer Vercel over Netlify:

```bash
cd frontend
npm install -g vercel
vercel
```

Follow prompts and set environment variables in Vercel dashboard.

## Full Stack Deployment Checklist

- [ ] Deploy backend to Railway/Render
- [ ] Get backend URL
- [ ] Configure backend environment variables
- [ ] Deploy frontend to Netlify/Vercel
- [ ] Set frontend environment variables with backend URL
- [ ] Test authentication
- [ ] Test document upload
- [ ] Test analysis generation
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring

## Cost Estimates

### Netlify
- **Free tier:** 100GB bandwidth, 300 build minutes/month
- **Pro tier:** $19/month for more resources

### Railway (Backend)
- **Free tier:** $5 credit/month
- **Pro tier:** Usage-based (~$20-50/month)

### Supabase
- **Free tier:** 500MB database, 1GB storage
- **Pro tier:** $25/month

### OpenAI API
- **Usage-based:** ~$2-5 per case analyzed

**Total Monthly Cost:** $50-100 for moderate usage

## Production Checklist

Before going live:

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and loading
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Backup strategy in place

## Support

For deployment issues:
- Check Netlify build logs
- Verify environment variables
- Test backend health endpoint
- Review DEPLOYMENT.md for detailed guides

## Quick Links

- **Netlify Dashboard:** https://app.netlify.com
- **Railway Dashboard:** https://railway.app
- **Render Dashboard:** https://render.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repository:** https://github.com/jhouston2019/discoveryintel

---

**Your DiscoveryIntel platform is ready to deploy!** 🚀
