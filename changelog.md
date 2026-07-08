# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Refactor: Extract auth and rate-limit middlewares** (PR #5)
  - Moved `requireAuth`, `requireSuperAdmin`, and `requireAppCheck` from inline in `server.ts` to dedicated file `src/middlewares/auth.middleware.ts`
  - Moved rate limiters (`apiLimiter`, `geminiLimiter`, `byokTestLimiter`) to `src/middlewares/rateLimit.middleware.ts`
  - No behavioral changes — purely organizational refactoring

### Fixed
- **Security: Harden debug endpoints with superadmin-only access** (PR #5)
  - `/api/debug/error` and `/api/debug-sentry` now require `requireAuth` + `requireSuperAdmin` middleware
  - Removed insecure NODE_ENV bypass check (developer couldn't accidentally expose in production)
  - Reverted incorrect provisioning-token logic that was temporarily merged but broke bootstrap isolation

### Added
- **Feat: Add RAG ingestion guards** (PR #7)
  - Conditional JSON parser: `/api/gemini/rag-ingest` accepts 10 MB payloads; other routes remain at 100 KB default
  - Tenant quota limiter: max 20 ingestion requests per tenant per hour (`ragIngestLimiter`)
  - Role-based access control: only `superadmin`, `admin`, or `creator` roles can trigger ingestion (403 for others)
  - Empirical investigation documented: confirmed global Express JSON parser rejects >100kb, solution is route-specific middleware

### Docs
- **Add fin-iteration workflow to CLAUDE.md** (commit from this session)
  - New section 9: structured protocol for closing iterations (analyze → document → next item → agent choice → liverable)
  - New point in section 6: security clause on unreliability of AI reviewers for auth/authorization code — requires human verification before merge
