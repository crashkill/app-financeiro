# Coolify Deployment Guide - App Financeiro

## 🎯 Overview

This guide covers deploying **App-Financeiro** to the Imperial Coolify infrastructure.

**Coolify Instance**: `https://fsw-hitss.duckdns.org`  
**Supabase Instance**: `https://supabase.fsw-hitss.duckdns.org`

---

## 📋 Prerequisites

### 1. Coolify CLI Installation

**Windows (PowerShell)**:
```powershell
# Standard installation (requires admin)
irm https://raw.githubusercontent.com/coollabsio/coolify-cli/main/scripts/install.ps1 | iex

# User installation (no admin required)
$env:COOLIFY_USER_INSTALL=1; irm https://raw.githubusercontent.com/coollabsio/coolify-cli/main/scripts/install.ps1 | iex
```

**Linux/macOS**:
```bash
curl -fsSL https://raw.githubusercontent.com/coollabsio/coolify-cli/main/scripts/install.sh | bash
```

### 2. Configure Coolify Context

```powershell
# Add Imperial Coolify context
coolify context add hitss-prod https://fsw-hitss.duckdns.org/ "1|V0Oau51fmpx8HwOhVOd4JG26zYmiuhN7NopnXVUFb1cb7656" --default

# Verify connection
coolify context verify
```

---

## 🚀 Deployment Methods

### Method 1: Coolify CLI (Recommended)

#### Step 1: Verify Connection
```powershell
coolify context verify
```

#### Step 2: List Applications
```powershell
coolify app list
```

#### Step 3: Deploy Application
```powershell
# Deploy by name
coolify deploy name app-financeiro -f

# Or deploy by UUID (if you have it)
coolify deploy uuid <app-uuid> -f
```

#### Step 4: Monitor Deployment
```powershell
# Follow deployment logs
coolify app deployments logs <app-uuid> --follow

# Check application status
coolify app get <app-uuid>
```

---

### Method 2: Coolify Web UI

1. **Access Coolify Dashboard**
   - Navigate to `https://fsw-hitss.duckdns.org`
   - Login with Imperial credentials

2. **Create New Application**
   - Click "New Resource" → "Application"
   - Select "Docker Compose" or "Dockerfile"
   - Configure repository (GitHub) or manual upload

3. **Configure Build Settings**
   - **Build Method**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`
   - **Build Context**: `.`

4. **Set Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://supabase.fsw-hitss.duckdns.org
   VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTMxMjYyMCwiZXhwIjo0OTIwOTg2MjIwLCJyb2xlIjoiYW5vbiJ9.ROa02tImzr0KYvitB18aq3cmYEvn_v77nhYmhfL6kVc
   NODE_ENV=production
   ```

5. **Configure Build Args** (same as environment variables)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

6. **Set Port Mapping**
   - Internal Port: `80`
   - External Port: `443` (with SSL)

7. **Configure Healthcheck**
   - Path: `/health`
   - Interval: `30s`
   - Timeout: `5s`
   - Retries: `3`

8. **Deploy**
   - Click "Deploy"
   - Monitor logs in real-time

---

## 🔧 Configuration Details

### Dockerfile Build Args

The Dockerfile expects these build arguments:

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
```

These are automatically passed from environment variables in Coolify.

### Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://supabase.fsw-hitss.duckdns.org` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Imperial Supabase Anon Key | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `VITE_APP_NAME` | `App Financeiro` | ❌ Optional |
| `VITE_APP_VERSION` | `1.0.0` | ❌ Optional |

### Port Configuration

- **Container Port**: `80` (Nginx)
- **External Port**: `443` (HTTPS with SSL)
- **Healthcheck Endpoint**: `http://localhost:80/health`

---

## 📊 Monitoring & Logs

### View Deployment Logs
```powershell
# Real-time logs
coolify app deployments logs <app-uuid> --follow

# Last 100 lines
coolify app deployments logs <app-uuid> --tail 100
```

### View Application Logs
```powershell
# Application runtime logs
coolify app logs <app-uuid> --follow
```

### Check Application Status
```powershell
coolify app get <app-uuid>
```

### Healthcheck Verification
```powershell
# Via curl
curl https://app-financeiro.fsw-hitss.duckdns.org/health

# Expected response
# healthy
```

---

## 🔄 Update Deployment

### Update Environment Variables
```powershell
# Sync from local .env.production
coolify app env sync <app-uuid> --file .env.production

# Or update individual variables via UI
```

### Redeploy Application
```powershell
# Trigger new deployment
coolify deploy name app-financeiro -f

# Or force rebuild
coolify deploy name app-financeiro --force-rebuild
```

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs**:
```powershell
coolify app deployments logs <app-uuid>
```

**Common issues**:
- Missing environment variables → Verify in Coolify UI
- npm install fails → Check network connectivity
- Vite build fails → Verify `.env.production` is correct

**Solution**:
```powershell
# Rebuild with no cache
coolify deploy name app-financeiro --force-rebuild
```

---

### Application Not Accessible

**Verify deployment status**:
```powershell
coolify app get <app-uuid>
```

**Check healthcheck**:
```powershell
curl https://app-financeiro.fsw-hitss.duckdns.org/health
```

**Common issues**:
- SSL certificate not ready → Wait 2-5 minutes for cert generation
- Port mapping incorrect → Verify in Coolify UI (80 → 443)
- Nginx not serving files → Check Dockerfile and nginx.conf

---

### Database Connection Fails

**Verify Supabase URL**:
```powershell
# Check environment variable
coolify app env list <app-uuid> | grep SUPABASE
```

**Test connection**:
```powershell
# From local machine
curl https://supabase.fsw-hitss.duckdns.org/rest/v1/
```

**Common issues**:
- Wrong Supabase URL → Update environment variable
- Invalid Anon Key → Verify key in Coolify UI
- Network connectivity → Check firewall rules

---

## 🔐 Security Checklist

- ✅ Environment variables set in Coolify (not in code)
- ✅ SSL/TLS enabled (HTTPS)
- ✅ Healthcheck endpoint public (no auth required)
- ✅ API endpoints protected by Supabase RLS
- ✅ No secrets in Docker image
- ✅ Nginx security headers configured

---

## 📈 Performance Optimization

### Build Optimization
- Multi-stage Docker build (already configured)
- npm ci for faster installs
- Vite build optimizations enabled

### Runtime Optimization
- Nginx gzip compression enabled
- Static asset caching (1 year)
- CDN-ready (if needed in future)

### Monitoring
- Coolify built-in metrics
- Application logs via Coolify
- Custom metrics via `/health` endpoint

---

## 🔄 Rollback Procedure

### Quick Rollback
```powershell
# Rollback to previous deployment
coolify app rollback <app-uuid>
```

### Manual Rollback
1. Update `.env.production` with backup credentials
2. Redeploy:
   ```powershell
   coolify deploy name app-financeiro -f
   ```

---

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Coolify CLI Reference](https://github.com/coollabsio/coolify-cli)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 🎯 Next Steps After Deployment

1. ✅ Verify application is accessible
2. ✅ Test all major features
3. ✅ Monitor logs for errors
4. ✅ Set up alerts (if needed)
5. ✅ Document any custom configurations
6. ✅ Update team on new deployment URL

---

**Deployment Status**: Ready for Production  
**Last Updated**: 2025-12-15  
**Maintained By**: Imperial DevOps Team
