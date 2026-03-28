# LawyerBuddy / Tu Abogado

A secure, bilingual (English/Spanish) case tracking and event logging app for lawyers and their clients.

**Status**: Project scaffold complete. Features being built in 10-phase development.

---

## 🏗️ Project Structure

### `/apps`
Frontend applications

- **`/mobile`** — React Native + Expo
  - iOS and Android support
  - Offline-first with real-time sync
  - Push notifications

- **`/web`** — React Native Web
  - Same codebase as mobile
  - Webpack-based build

### `/packages`
Shared libraries and utilities

- **`/shared`** — Shared components, hooks, types, utilities
  - React components usable across mobile/web
  - Custom hooks (useAuth, useCaseData, etc.)
  - TypeScript interfaces and types

- **`/i18n`** — Internationalization
  - i18next configuration
  - English (en) and Latin American Spanish (es) translations
  - Language switcher component
  - Auto-detect device language with override option

- **`/api`** — Supabase integration
  - Supabase client initialization
  - API call wrappers
  - Authentication helpers
  - Real-time subscriptions
  - Shared TypeScript types

- **`/security`** — Security utilities
  - File hashing (SHA-256)
  - EXIF metadata extraction
  - End-to-end message encryption (libsodium)
  - Secure file access (signed URLs)
  - Audit logging

### `/backend`
Node.js + Express REST API

```
/src
  /routes          — API route handlers
    auth.ts        — Authentication & invite flow
    cases.ts       — Case, checklist, event, attachment, message routes
  /middleware      — Request processing
    auth.ts        — JWT verification
    rls.ts         — Row Level Security enforcement
  /services        — Business logic
    cases.ts       — Case operations
  /types           — TypeScript definitions
    index.ts       — Shared types
  server.ts        — Express app entry point
```

- Runs on port 3000 (configurable via `PORT` env var)
- Protected routes require JWT authentication
- All data operations enforce RLS policies

### `/supabase`
Database configuration and migrations

- **`/migrations`** — SQL migration files (numbered: 001_, 002_, etc.)
  - `001_initial_schema.sql` — tables, indexes, RLS policies
  - All schema changes go here for version control

- **`/seed`** — Seed data for local development
  - Insert test users, cases, and events
  - Only used locally; never committed if sensitive

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend (Mobile)** | React Native, Expo SDK 51, React Navigation |
| **Frontend (Web)** | React Native Web, Webpack |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **i18n** | i18next, react-i18next |
| **Security** | JWT (auth), libsodium (encryption), SHA-256 (file hashing) |
| **Package Manager** | pnpm with workspaces |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Expo CLI (for mobile development)

### Installation

```bash
# Install dependencies
pnpm install

# Set up Supabase locally (optional)
# Instructions in /supabase/README.md (to be created)

# Create .env file at project root
cp .env.example .env
# Fill in Supabase credentials, API URLs, etc.
```

### Development

```bash
# Run all packages in development mode
pnpm dev

# Or run specific packages:
pnpm -F @lawyerbuddy/shared dev
pnpm -F lawyerbuddy-mobile dev
pnpm -F @lawyerbuddy/backend dev
```

### Building

```bash
# Build all packages
pnpm build

# Or specific packages:
pnpm -F lawyerbuddy-mobile build:ios
pnpm -F lawyerbuddy-mobile build:android
pnpm -F @lawyerbuddy/backend build
```

---

## 📋 10-Phase Development Plan

> **Note**: Each phase builds on previous ones. Always complete phase checkpoints before moving forward.

### Phase 1 ✅
**Project Scaffold** — Directory structure, TypeScript configs, package.json files
- [x] Monorepo structure with pnpm workspaces
- [x] All packages initialized with TypeScript
- [x] Root README and documentation structure

### Phase 2
**Internationalization (i18n)** — Multi-language support
- [ ] i18next setup with en/es namespaces
- [ ] Translation files for all feature areas
- [ ] LanguageSwitcher component
- [ ] useTranslation hook wrapper

### Phase 3
**Supabase Database Schema** — Full schema design
- [ ] Tables: profiles, cases, events, checklist_items, messages, audit_log, etc.
- [ ] Row Level Security (RLS) policies
- [ ] Storage bucket for case files
- [ ] Indexes and relationships

### Phase 4
**Authentication + Invite Flow** — User signup and case invitations
- [ ] WelcomeScreen, LoginScreen, SignupScreen
- [ ] Password reset flow
- [ ] Case invite link generation and acceptance
- [ ] JWT middleware for protected routes

### Phase 5
**Client Portal** — Event logging and case tracking
- [ ] ClientHomeScreen with checklist progress
- [ ] EventListScreen with filtering
- [ ] LogEventScreen (5-step form)
  - Event details
  - Narrative description
  - Location + GPS
  - Media attachments (photo, video, audio, document)
  - Review & save
- [ ] DocumentsScreen
- [ ] ClientMessagesScreen (encrypted chat)

### Phase 6
**Lawyer Portal** — Client management and review
- [ ] LawyerDashboardScreen (case list)
- [ ] NewCaseScreen (case creation and invite)
- [ ] CaseDetailScreen with tabs
- [ ] ChecklistBuilderScreen (create/edit/reorder steps)
- [ ] EventDetailScreen with attorney annotations
- [ ] LawyerMessagesScreen
- [ ] ExportScreen (placeholder for Phase 3)

### Phase 7
**Security Implementation** — Encryption, hashing, audit logging
- [ ] File hashing (SHA-256)
- [ ] EXIF metadata extraction
- [ ] End-to-end message encryption
- [ ] Secure file access (signed URLs)
- [ ] Audit logging for all actions
- [ ] JWT authentication middleware

### Phase 8
**Backend API Routes** — REST endpoints for all features
- [ ] Cases API (CRUD operations)
- [ ] Checklist API (items, templates)
- [ ] Events API (create, edit, audit trail)
- [ ] Attachments API (upload, download, delete)
- [ ] Messages API (send, read receipts)
- [ ] Audit log API

### Phase 9
**Navigation + App Shell** — Navigation structure and user interface
- [ ] Deep linking for invite flow
- [ ] Tab-based navigation (client and lawyer)
- [ ] Auth stack navigation
- [ ] Splash screen while checking auth
- [ ] Global error handling
- [ ] Header with language switcher and user menu

### Phase 10
**Real-Time + Notifications** — Live updates and push notifications
- [ ] Supabase Realtime subscriptions
  - Checklist updates
  - New messages
  - New events (for lawyers)
- [ ] Push notification infrastructure (Expo)
- [ ] Notification content in both languages

---

## 📋 Phase Checkpoints

After each phase, verify:

| Phase | Verification | Status |
|-------|--------------|--------|
| 1 | Project structure exists; TypeScript compiles | ✅ |
| 2 | i18n works; both languages render correctly | ⏳ |
| 3 | Database migrations run; RLS policies active | ⏳ |
| 4 | Lawyer signup → invite → client accept flow works | ⏳ |
| 5 | Client can log full event + attachments | ⏳ |
| 6 | Lawyer can view events; attorney notes hidden from client | ⏳ |
| 7 | File hashing, encryption, signed URLs work | ⏳ |
| 8 | All API routes return correct data; unauthorized requests blocked | ⏳ |
| 9 | Deep link invite works; role-based routing works | ⏳ |
| 10 | Real-time updates; push notifications fire | ⏳ |

---

## 🔐 Security Notes

- **Attorney notes** are never visible to clients and excluded from all exports
- **Encrypted messages** are end-to-end; private keys never leave the device
- **File attachments** are integrity-checked with SHA-256 hashing
- **Audit log** is immutable (INSERT-only, never UPDATE/DELETE)
- **Signed URLs** for file access expire in 10 minutes
- **RLS policies** enforce row-level access control
- **Push notifications** never include sensitive case details

---

## 🗣️ Languages

- **English** — Default, used throughout development
- **Spanish** — Latin American Spanish (es-MX, es-CO, es-AR neutral)

All user-facing text goes through i18n. **Never hardcode strings in components.**

---

## 📚 Reference Documentation

- [Supabase Setup](./supabase/README.md) — Database configuration
- [Backend API Docs](./backend/API.md) — API route reference (to be created)
- [Component Library](./packages/shared/README.md) — Shared components (to be created)
- [Security Guide](./packages/security/README.md) — Security best practices (to be created)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/phase-X-description`
2. Work within the appropriate package (`@lawyerbuddy/package-name`)
3. Ensure TypeScript strict mode passes: `pnpm type-check`
4. Commit with clear messages referencing the phase and feature
5. Push and create a pull request

---

## 📄 License

Proprietary — GreyNoise Intelligence

---

## 📞 Contact

For questions or feedback:
- **Project Lead**: [Name] ([email])
- **Lawyers Interviewed**: [Names] (feedback incorporated in phases 5-6)

---

**Last Updated**: 2026-03-27
**Current Phase**: 1 (Project Scaffold) ✅
**Next Phase**: 2 (Internationalization)
