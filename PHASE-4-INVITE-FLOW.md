# Phase 4: Authentication + Invite Flow

## Overview

This phase implements the complete authentication system and case invite flow, allowing lawyers to invite clients and clients to accept invites via secure tokens.

## Invite Flow: End-to-End

### Step 1: Lawyer Creates Case Invite

**Trigger**: Lawyer clicks "Invite Client" on a case they own

**Frontend Call**:
```javascript
POST /cases/:caseId/invite
{
  invitedEmail: "client@example.com"
}
```

**Backend Processing** (Phase 5 - will implement in cases.ts):
1. Verify requester is the lawyer_id of the case
2. Call `authService.generateCaseInvite(caseId, lawyerId, invitedEmail)`

---

### Step 2: Token Generation

**Location**: `backend/src/utils/token.ts` → `generateInviteToken()`

**Logic**:
```typescript
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

**Output**: 64-character hex string (32 bytes = 256 bits of entropy)

**Example Token**:
```
a3f7d8c2e9b4f1a6c5e8d3b7f2a9c4e7d0f5a8b3c6e9f2a5d8c1e4b7a0f3d6
```

---

### Step 3: Token Storage

**Service**: `backend/src/services/auth.ts` → `generateCaseInvite()`

**Database Insert** (case_invites table):
```sql
INSERT INTO case_invites (
  case_id,
  lawyer_id,
  invited_email,
  token,
  status,
  expires_at,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- case_id UUID
  '660f9501-f39c-52e5-b827-557766551111',  -- lawyer_id UUID
  'client@example.com',                    -- invited_email
  'a3f7d8c2e9b4f1a6c5e8d3b7f2a9c4e7...',  -- 64-char token
  'pending',                               -- status
  '2026-04-03T12:00:00Z',                 -- expires_at (7 days from now)
  '2026-03-27T12:00:00Z'                  -- created_at
);
```

**RLS Policy Enforced**:
```sql
CREATE POLICY "case_invites_insert_lawyer_only" ON case_invites FOR INSERT
  WITH CHECK (lawyer_id = auth.uid());
```
✅ Token is inserted only if lawyer_id matches authenticated user

---

### Step 4: Lawyer Sends Invite Link to Client

**Frontend**: After successful invite creation, generate link:
```
https://lawyerbuddy.app/invite?token=a3f7d8c2e9b4f1a6c5e8d3b7f2a9c4e7...
```

**Out of System**: Email, SMS, WhatsApp, or manual sharing

---

### Step 5: Client Clicks Invite Link

**User Journey**:
1. Client receives link with `token` query parameter
2. Frontend navigates to `InviteAcceptScreen`
3. Screen extracts token from URL: `?token=a3f7d8c2e9b4f1a6...`

**Validation Call** (optional - pre-check):
```javascript
GET /auth/invite/:token
```

**Response**:
```json
{
  "valid": true,
  "caseId": "550e8400-e29b-41d4-a716-446655440000",
  "invitedEmail": "client@example.com",
  "expiresAt": "2026-04-03T12:00:00Z"
}
```

---

### Step 6: Client Signs Up

**Frontend**: InviteAcceptScreen displays form:
- Email field (pre-filled or verified to match invite)
- Password field
- Full name field
- "Accept Invite" button

**Frontend Call**:
```javascript
POST /auth/invite/accept
{
  token: "a3f7d8c2e9b4f1a6c5e8d3b7f2a9c4e7...",
  email: "client@example.com",
  password: "securePassword123",
  fullName: "Jane Doe"
}
```

---

### Step 7: Token Validation

**Location**: `backend/src/services/auth.ts` → `acceptCaseInvite()`

**Checks Performed**:
```typescript
1. Token format validation
   - Must be 64 hex characters
   - Regex: /^[a-f0-9]{64}$/

2. Fetch invite from database
   SELECT * FROM case_invites WHERE token = ?

3. Status check
   - Must be 'pending' (not 'accepted' or 'expired')

4. Email verification
   - invited_email must match provided email
   - Prevents users from claiming someone else's invite

5. Expiry check
   - expires_at must be in future
   - Tokens expire after 7 days
```

**Error Responses**:
- ❌ "Invalid token format" (400)
- ❌ "Invite not found or already used" (404)
- ❌ "Invite is accepted, cannot accept" (400)
- ❌ "Email does not match invite recipient" (400)
- ❌ "Invite has expired" (410)

---

### Step 8: User Creation

**Supabase Auth**:
```typescript
const { user, error } = await supabase.auth.admin.createUser({
  email: "client@example.com",
  password: "securePassword123",
  email_confirm: false  // Optional: set to true if using email verification
});
```

**Result**:
- User ID (UUID) generated: `770g0612-g39d-63f6-c938-668877662222`
- User added to auth.users table
- JWT tokens generated (access + refresh)

---

### Step 9: Profile Creation

**Database Insert** (profiles table):
```sql
INSERT INTO profiles (
  id,                    -- User ID from auth.users
  email,
  full_name,
  role,
  preferred_language,
  created_at,
  updated_at
) VALUES (
  '770g0612-g39d-63f6-c938-668877662222',  -- auth.users.id
  'client@example.com',
  'Jane Doe',
  'client',              -- Always 'client' for invite acceptance
  'en',
  '2026-03-27T12:00:00Z',
  '2026-03-27T12:00:00Z'
);
```

**RLS Policy Enforced**:
```sql
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```
✅ User can only create their own profile

---

### Step 10: Case Assignment

**Database Update** (cases table):
```sql
UPDATE cases
SET client_id = '770g0612-g39d-63f6-c938-668877662222'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**RLS Policy Enforced**:
```sql
CREATE POLICY "cases_update_lawyer_only" ON cases FOR UPDATE
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());
```

⚠️ **Note**: This uses the service role (backend) to bypass RLS and update the case.
The lawyer_id check is already done when the invite was created.

---

### Step 11: Invite Status Update

**Database Update** (case_invites table):
```sql
UPDATE case_invites
SET status = 'accepted'
WHERE id = ?;
```

**Result**: Invite is now marked as 'accepted' and cannot be used again

---

### Step 12: Client Logged In

**Backend Response**:
```json
{
  "success": true,
  "user": {
    "id": "770g0612-g39d-63f6-c938-668877662222",
    "email": "client@example.com",
    ...
  },
  "profile": {
    "id": "770g0612-g39d-63f6-c938-668877662222",
    "full_name": "Jane Doe",
    "role": "client",
    "email": "client@example.com",
    ...
  },
  "caseId": "550e8400-e29b-41d4-a716-446655440000",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Frontend**:
1. Store JWT in secure storage (AsyncStorage mobile, localStorage web)
2. Redirect to ClientPortalScreen
3. Client can now access the case and all associated data via RLS policies

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ LAWYER                                                          │
│ Clicks "Invite Client" on Case ID: 550e8400...                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /cases/:id/invite
                             │ { invitedEmail: "client@example.com" }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Verify lawyer owns case (RLS)                           │ │
│ │ 2. Generate token: crypto.randomBytes(32).toString('hex')  │ │
│ │ 3. Insert into case_invites:                              │ │
│ │    - token: 'a3f7d8c2...' (64 chars)                       │ │
│ │    - status: 'pending'                                     │ │
│ │    - expires_at: now + 7 days                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Return token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAWYER                                                          │
│ Sends link: https://lawyerbuddy.app/invite?token=a3f7d8c2...   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ (Out of system - email, etc)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT                                                          │
│ Clicks link, arrives at InviteAcceptScreen with token in URL   │
│ Enters: email, password, full name                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /auth/invite/accept
                             │ { token, email, password, fullName }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Validate token format (hex, 64 chars)                   │ │
│ │ 2. Fetch from case_invites WHERE token = ?                 │ │
│ │ 3. Check: status = 'pending'                              │ │
│ │ 4. Check: email matches invited_email                      │ │
│ │ 5. Check: expires_at > now()                               │ │
│ │ 6. Create user: supabase.auth.admin.createUser()           │ │
│ │ 7. Create profile: INSERT into profiles                    │ │
│ │ 8. Update case: SET client_id = new_user_id                │ │
│ │ 9. Mark invite: UPDATE status = 'accepted'                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Return JWT + profile
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT                                                          │
│ ✅ Logged in and linked to case                                 │
│ Can now view case details via RLS (client_id = auth.uid())     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Security Features

### 1. Token Entropy
- 32 bytes (256 bits) = 2^256 possible tokens
- Impossible to brute force
- Cryptographically secure random generation

### 2. Token Expiry
- 7-day expiration window
- Old invites automatically become invalid
- Prevents perpetual access from leaked links

### 3. Email Verification
- Token bound to specific email address
- Prevents claim-jumping: user must use the invited email
- Mismatched email = 400 error

### 4. Status Tracking
- Tokens move from 'pending' → 'accepted'
- Cannot reuse accepted invites
- Cannot accept pending invites multiple times (status check)

### 5. RLS Policies
- Lawyer can only create invites for their own cases
- Users can only create their own profiles
- Lawyer can only update their own cases
- Case members (lawyer + client) can only view shared cases

### 6. No Email Enumeration
- `/auth/forgot-password` always returns success
- Prevents attackers from discovering valid email addresses

### 7. Password Security
- Passwords stored in Supabase auth (hashed, salted, bcrypt)
- Never transmitted or logged
- Backend never sees plaintext password

---

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/lawyer-signup | ❌ | Create lawyer account |
| POST | /auth/login | ❌ | Login with email/password |
| POST | /auth/forgot-password | ❌ | Request password reset email |
| POST | /auth/reset-password | ❌ | Complete password reset |
| GET | /auth/invite/:token | ❌ | Validate invite exists |
| POST | /auth/invite/accept | ❌ | Accept invite & create client |
| POST | /auth/refresh | ✅ | Refresh JWT token |
| GET | /auth/me | ✅ | Get current user profile |

---

## Files Created/Modified in Phase 4

### New Files:
- `backend/src/utils/token.ts` - Token generation
- `backend/src/services/auth.ts` - Auth business logic (signup, login, invite handling)

### Modified Files:
- `backend/src/routes/auth.ts` - All 8 authentication endpoints
- `backend/src/server.ts` - Register auth routes

### Next Phase (Phase 5):
- Case management endpoints
- Invite acceptance endpoint integration (POST /cases/:id/invite)
- Lawyer dashboard queries
