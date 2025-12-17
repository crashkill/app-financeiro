# ADR-001: Migration to Coolify and Self-Hosted Supabase

**Status**: Approved  
**Date**: 2025-12-15  
**Decision Makers**: HITSS Imperial Command  
**Technical Owner**: Darth Vader (Dark Side Coding Overlord)

---

## Context

The **App-Financeiro** project was initially developed using Supabase Cloud as the backend-as-a-service provider. As part of the Imperial Infrastructure consolidation strategy, all applications must migrate to self-hosted solutions under centralized control.

### Current State (Before Migration)
- **Backend**: Supabase Cloud (`oomhhhfahdvavnhlbioa.supabase.co`)
- **Deployment**: Local development / Docker containers
- **Database**: PostgreSQL on Supabase Cloud
- **Storage**: Supabase Cloud Storage
- **Cost**: Monthly subscription to Supabase Cloud
- **Control**: Limited (managed service)

### Drivers for Change
1. **Cost Optimization**: Eliminate recurring Supabase Cloud subscription fees
2. **Data Sovereignty**: Full control over data location and access
3. **Infrastructure Consolidation**: Align with Imperial self-hosted infrastructure
4. **Compliance**: Meet internal security and audit requirements
5. **Customization**: Enable custom configurations not available in Cloud tier

---

## Decision

We will migrate **App-Financeiro** to:

1. **Self-Hosted Supabase** (`https://supabase.fsw-hitss.duckdns.org`)
   - Full control over database and storage
   - Custom configurations and extensions
   - No vendor lock-in

2. **Coolify Deployment** (`https://fsw-hitss.duckdns.org`)
   - Self-hosted PaaS alternative to Heroku/Vercel
   - Docker-based deployments
   - Integrated CI/CD pipeline
   - SSL/TLS management

---

## Consequences

### Positive

✅ **Cost Reduction**
- Eliminate Supabase Cloud subscription (~$25-50/month)
- Utilize existing Imperial infrastructure

✅ **Full Control**
- Direct database access for advanced queries
- Custom PostgreSQL extensions
- Backup and recovery strategies under our control

✅ **Security & Compliance**
- Data remains within Imperial infrastructure
- Full audit trail capability
- Custom security policies

✅ **Performance Optimization**
- Ability to tune database parameters
- Direct network access (lower latency potential)
- Custom caching strategies

✅ **Scalability**
- Horizontal scaling under our control
- Resource allocation based on actual needs

### Negative

⚠️ **Operational Responsibility**
- We now own database maintenance and updates
- Monitoring and alerting setup required
- Backup management is our responsibility

⚠️ **Migration Complexity**
- Data migration required (estimated 30 min downtime)
- Authentication tokens invalidated (users must re-login)
- Potential for data integrity issues during migration

⚠️ **Learning Curve**
- Team must learn Coolify deployment workflows
- Self-hosted Supabase administration

### Neutral

ℹ️ **Feature Parity**
- Self-hosted Supabase provides same features as Cloud
- Coolify provides similar DX to Vercel/Heroku

---

## Implementation Strategy

### Phase 1: Data Migration
1. Export all data from Supabase Cloud
2. Import to self-hosted Supabase
3. Verify data integrity (checksums)

### Phase 2: Application Updates
1. Update environment variables
2. Remove hardcoded Cloud URLs
3. Test locally with new configuration

### Phase 3: Deployment
1. Configure Coolify application
2. Set environment variables in Coolify
3. Deploy and monitor

### Phase 4: Verification
1. Functional testing of all features
2. Performance benchmarking
3. User acceptance testing

---

## Alternatives Considered

### Alternative 1: Stay on Supabase Cloud
**Rejected** because:
- Ongoing costs not aligned with Imperial strategy
- Limited control over infrastructure
- Does not meet data sovereignty requirements

### Alternative 2: Migrate to AWS RDS + Custom Backend
**Rejected** because:
- Higher development effort (need to build backend APIs)
- Longer migration timeline
- Loss of Supabase features (Auth, Storage, Realtime)

### Alternative 3: Use Vercel + Supabase Cloud
**Rejected** because:
- Still dependent on Supabase Cloud
- Vercel costs for production deployments
- Does not solve infrastructure consolidation goal

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | **HIGH** | Low | Full backup before migration; checksums verification |
| Extended downtime | **MEDIUM** | Medium | Practice migration in staging; rollback plan ready |
| Performance degradation | **MEDIUM** | Low | Benchmark before/after; optimize if needed |
| User disruption | **MEDIUM** | High | Communicate maintenance window; off-hours deployment |
| SSL certificate issues | **LOW** | Low | Verify Coolify SSL before migration |

---

## Rollback Plan

If critical issues arise post-migration:

1. **Immediate Rollback** (< 1 hour)
   - Restore `.env.production` from backup (`.env.migration-backup`)
   - Redeploy with Cloud credentials
   - Users reconnect to Cloud instance

2. **Data Sync** (if needed)
   - Export any new data from self-hosted
   - Import back to Cloud
   - Verify integrity

3. **Investigation**
   - Analyze failure root cause
   - Fix issues in staging environment
   - Plan retry with fixes

---

## Monitoring and Success Metrics

### Key Metrics
- **Uptime**: Target 99.9% (same as Cloud)
- **Response Time**: ≤ 200ms for API calls (±20% of Cloud baseline)
- **Error Rate**: < 0.1%
- **Data Integrity**: 100% (zero data loss)

### Monitoring Tools
- Coolify built-in monitoring
- Application logs via Coolify
- Database metrics via Supabase dashboard
- Custom healthcheck endpoint (`/health`)

### Success Criteria
- ✅ Application accessible via Coolify FQDN
- ✅ All features functional
- ✅ Performance within acceptable range
- ✅ Zero data loss
- ✅ SSL/TLS working
- ✅ Healthchecks passing

---

## Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| Decision Approved | 2025-12-15 | ✅ Complete |
| Environment Configuration | 2025-12-15 | 🔄 In Progress |
| Data Migration | TBD | ⏳ Pending |
| Coolify Deployment | TBD | ⏳ Pending |
| Verification | TBD | ⏳ Pending |
| Production Cutover | TBD | ⏳ Pending |

---

## References

- [Coolify Documentation](https://coolify.io/docs)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Imperial Infrastructure Specification](../GEMINI.md)
- [Migration Implementation Plan](../implementation_plan.md)

---

## Notes

> "The migration is not a retreat—it is a strategic consolidation of power under Imperial control."
> 
> — Darth Vader, Dark Side Coding Overlord

**Approved by**: Imperial Command  
**Executed by**: Antigravity Agent (Darth Vader Mode)
