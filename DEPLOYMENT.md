# DiscoveryIntel Deployment Guide

## Deployment Options

### Option 1: Docker Compose (Easiest)

Best for: VPS deployment, local production testing

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Cloud Platform Deployment

#### Frontend Deployment (Vercel)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Go to https://vercel.com
- Import your GitHub repository
- Set root directory to `frontend`
- Add environment variables:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy

#### Backend Deployment (Railway)

1. **Create Railway Account**
- Go to https://railway.app
- Sign up with GitHub

2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository
- Set root directory to `backend`

3. **Configure Environment Variables**
Add all variables from `backend/.env`:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `PORT=3001`
- `NODE_ENV=production`

4. **Add Redis**
- In Railway project, click "New"
- Select "Database" > "Redis"
- Copy the Redis URL
- Add to backend environment as `REDIS_URL`

5. **Deploy**
- Railway auto-deploys on push to main
- Get your backend URL (e.g., `https://your-app.railway.app`)
- Update frontend `NEXT_PUBLIC_API_URL` to this URL
- Redeploy frontend

#### Alternative: Backend on Render

1. **Create Render Account**
- Go to https://render.com
- Sign up

2. **Create Web Service**
- New > Web Service
- Connect GitHub repository
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`

3. **Add Environment Variables**
Same as Railway

4. **Add Redis**
- Create Redis instance in Render
- Connect to web service

### Option 3: AWS Deployment

#### Frontend (AWS Amplify)
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

#### Backend (AWS ECS/Fargate)
- Build Docker image
- Push to ECR
- Create ECS task definition
- Deploy to Fargate

#### Database
- Use existing Supabase (recommended)
- Or migrate to AWS RDS PostgreSQL with pgvector

## Post-Deployment Checklist

- [ ] Verify frontend loads correctly
- [ ] Test user signup and login
- [ ] Create test case
- [ ] Upload test document
- [ ] Verify document processing completes
- [ ] Check analysis results appear
- [ ] Test semantic search
- [ ] Monitor error logs
- [ ] Set up SSL/HTTPS
- [ ] Configure custom domain
- [ ] Set up monitoring/alerts
- [ ] Configure backups

## Monitoring

### Application Monitoring

**Vercel:**
- Built-in analytics
- Real-time logs
- Performance metrics

**Railway/Render:**
- Application logs
- Resource usage
- Deployment history

### Database Monitoring

**Supabase:**
- Query performance
- Connection count
- Storage usage
- API requests

### Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for APM

## Backup Strategy

### Database Backups
- Supabase: Automatic daily backups (Pro plan)
- Manual export: Use Supabase dashboard

### Storage Backups
- Supabase Storage: Automatic replication
- Consider periodic exports to S3

### Code Backups
- GitHub repository
- Tag releases: `git tag v1.0.0`

## Security Checklist

- [ ] Environment variables secured (not in code)
- [ ] HTTPS enabled
- [ ] CORS configured for production domain only
- [ ] Rate limiting implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation
- [ ] JWT secret is strong and unique
- [ ] Supabase RLS policies active
- [ ] Service keys not exposed to frontend
- [ ] Regular dependency updates

## Performance Optimization

### Frontend
- Next.js automatic code splitting
- Image optimization
- Static page generation where possible
- CDN via Vercel Edge Network

### Backend
- Connection pooling for database
- Caching frequently accessed data
- Async processing for heavy operations
- Compression middleware

### Database
- Proper indexes on foreign keys
- Vector index for similarity search
- Query optimization
- Regular VACUUM operations

## Scaling Strategy

### Phase 1: Single Instance (0-100 users)
- Current architecture sufficient
- Monitor resource usage

### Phase 2: Horizontal Scaling (100-1000 users)
- Multiple backend instances
- Load balancer
- Redis cluster for queue
- Database read replicas

### Phase 3: Microservices (1000+ users)
- Separate document processing service
- Dedicated AI analysis service
- API gateway
- Message queue (RabbitMQ/Kafka)

## Cost Optimization

### Development
- Use Supabase free tier
- OpenAI API: Monitor usage
- Free hosting on Vercel/Railway free tier

### Production
- Supabase Pro: $25/month
- Railway: ~$20-50/month
- OpenAI API: Usage-based (~$2-5 per case)
- Total: ~$50-100/month for moderate usage

### Cost Reduction Tips
- Cache analysis results
- Batch API calls
- Use smaller embedding model if acceptable
- Implement usage limits per user
- Consider GPT-3.5 for some modules

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review error logs weekly
- Monitor API costs daily
- Backup database weekly
- Security patches immediately

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Rollback Procedure

If deployment fails:

1. **Vercel**: Rollback to previous deployment in dashboard
2. **Railway**: Rollback in deployments tab
3. **Database**: Restore from backup if needed
4. **Verify**: Test critical functionality

## Support & Monitoring

### Health Checks
- Frontend: Check page loads
- Backend: GET /health endpoint
- Database: Supabase dashboard

### Alerts
Set up alerts for:
- API errors > 5% error rate
- Response time > 2 seconds
- Database connections > 80% pool
- Storage > 80% capacity
- OpenAI API failures

## Disaster Recovery

### Backup Locations
- Code: GitHub
- Database: Supabase automatic backups
- Storage: Supabase Storage (replicated)

### Recovery Steps
1. Restore database from backup
2. Redeploy application from GitHub
3. Verify data integrity
4. Test critical paths
5. Monitor for issues

### RTO/RPO
- Recovery Time Objective: < 1 hour
- Recovery Point Objective: < 24 hours
