# Deployment Guide

Complete guide for deploying the Child Reward System to production.

## Prerequisites

### Required Accounts
1. **Supabase Account** (supabase.com) - Database & Auth
2. **Vercel Account** (vercel.com) - Hosting
3. **Google Cloud Console** (optional) - OAuth only

### Local Requirements
- Node.js 20.x or higher
- npm 10.x or higher
- Git for version control

---

## Supabase Setup

### 1. Create Project

1. Visit [supabase.com](https://supabase.com) and create account
2. Click "New Project"
3. Configure:
   - **Name:** child-reward-system-prod
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to users
   - **Plan:** Free or Pro

4. Wait ~2 minutes for initialization

### 2. Database Setup

#### Using SQL Editor (Recommended):

1. Navigate to **SQL Editor** in dashboard
2. Copy entire [supabase/schema.sql](../supabase/schema.sql)
3. Paste and click **Run**
4. Verify: **Database** → **Tables** (should see 10 tables)

#### Verify Setup:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### 3. Apply Migrations

Run in order:

1. Open [supabase/migrations/20260105_add_aggregate_functions.sql](../supabase/migrations/20260105_add_aggregate_functions.sql)
2. Copy, paste, **Run** in SQL Editor
3. Repeat for:
   - `20260105_fix_weekly_summary_function.sql`
   - `20260105_add_target_date_to_config.sql`

### 4. Configure Authentication

#### Email/Password (Enabled by default):
- Go to **Authentication** → **Providers**
- Email should be enabled
- Optionally customize email templates

#### Google OAuth:

**Create OAuth Credentials:**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable **Google+ API**
4. **Credentials** → **Create** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized origins: `https://your-project.supabase.co`
7. Redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
8. Copy **Client ID** and **Client Secret**

**Configure in Supabase:**
1. **Authentication** → **Providers** → **Google**
2. Enable Google
3. Paste Client ID and Secret
4. Click **Save**

**Add Redirect URLs:**
- Development: `http://localhost:3000/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

### 5. Get API Keys

1. **Project Settings** → **API**
2. Copy:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOi...`

---

## Environment Variables

### Local Development

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=development
```

### Vercel Production

Add in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Security:**
- ✅ Never commit `.env.local`
- ✅ Add to `.gitignore`
- ✅ Use different projects for dev/staging/prod
- ✅ Rotate keys if exposed

---

## Vercel Deployment

### GitHub Integration (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/child-reward-system.git
git push -u origin main
```

2. **Import to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import GitHub repository
   - Configure:
     - Framework: Next.js
     - Root: `./`
     - Build: `npm run build`
     - Output: `.next`

3. **Add Environment Variables:**
   - Expand **Environment Variables**
   - Add both Supabase variables
   - Select all environments

4. **Deploy:**
   - Click **Deploy**
   - Wait ~2-3 minutes

**Continuous Deployment:**
- Production: Commits to `main`
- Preview: Pull requests
- Rollback: Available in dashboard

### Custom Domain

1. **Vercel:** Settings → Domains → Add Domain
2. **DNS:** Add CNAME → `cname.vercel-dns.com`
3. **SSL:** Automatic via Vercel

---

## Alternative Deployments

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Run:
```bash
docker build -t child-reward-system .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  child-reward-system
```

### Self-Hosted (PM2)

```bash
npm install -g pm2
npm run build
pm2 start npm --name "child-reward-system" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Checklist

### Verify Deployment:
- [ ] Homepage loads
- [ ] Auth works (email/password)
- [ ] Google OAuth works
- [ ] User can sign up
- [ ] Family initialization works
- [ ] Dashboard displays
- [ ] Tracking saves
- [ ] Weekly review works
- [ ] Config updates persist

### Test Data Isolation:
- [ ] Create second family
- [ ] Verify families separated
- [ ] Test RLS policies

### Performance:
- [ ] Page load < 3s
- [ ] API response < 1s
- [ ] Test concurrent users

### Security:
- [ ] HTTPS enforced
- [ ] RLS enabled
- [ ] Test unauthorized access
- [ ] Session management works

---

## Monitoring & Maintenance

### Vercel Analytics
- Enable in Project → Analytics
- Monitor Web Vitals
- Track page load times

### Supabase Monitoring
- **Database** → Query Performance
- **Authentication** → Users
- **API** → Logs

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Backup & Recovery

### Database Backups

**Supabase Free:** 7-day retention  
**Supabase Pro:** 30-day PITR

**Manual Backup:**
```bash
pg_dump -h db.your-project.supabase.co \
  -U postgres -d postgres -F c \
  -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -h db.your-project.supabase.co \
  -U postgres -d postgres -F c backup.dump
```

### Disaster Recovery

1. **Data Loss:** Restore from Supabase backup
2. **Deployment Failure:** Rollback in Vercel
3. **Database Corruption:** Restore + verify

---

## Scaling

### Database Scaling

**Free Tier Limits:**
- 500 MB storage
- 2 GB bandwidth/month
- 500 concurrent connections

**When to Upgrade:**
- DB > 400 MB
- Bandwidth > 1.5 GB
- Connection errors

**Pro Tier:**
- 8 GB storage
- 50 GB bandwidth
- Dedicated resources

### Application Scaling

**Vercel Free:** 100 GB bandwidth  
**Vercel Pro:** 1 TB bandwidth

**Optimization:**
- Add DB indexes
- Use materialized views
- Implement caching
- Archive old data

---

## Troubleshooting

### Build Fails
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Supabase Connection Fails
```bash
# Verify env vars
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl https://your-project.supabase.co/rest/v1/
```

### RLS Blocking Queries
```sql
-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Debug (NOT for production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Google OAuth Not Working
- Verify redirect URI matches exactly
- Check consent screen configured
- Verify Client ID/Secret correct

---

## Security Hardening

### Checklist:
- [ ] Env vars in secure storage
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting (future)
- [ ] 2FA for admin (future)
- [ ] Daily backups enabled
- [ ] Error messages sanitized

### Security Headers

Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ]
}
```

---

## Cost Estimation

### Free Tier (1-5 families)
- Supabase Free: $0/month
- Vercel Free: $0/month
- **Total: $0/month**

### Pro Tier (10-50 families)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Domain: $15/year
- **Total: ~$45/month**

### Scale Tier (50+ families)
- Supabase Team: $599/month
- Vercel Enterprise: Custom
- Additional services: $30/month
- **Total: Custom pricing**

---

## Rollback Procedure

### Vercel:
1. Dashboard → Deployments
2. Find previous stable deployment
3. Click **...** → Promote to Production

### Database:
1. Identify backup in Supabase
2. Download or use PITR
3. Restore to timestamp
4. Verify integrity

---

**Deployment Guide Version:** 1.0  
**Last Updated:** January 5, 2026
