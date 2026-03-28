# Pre-Launch TODO

Critical items that must be completed before LawyerBuddy goes live.

## 1. Supabase Service Role Client for Invite Validation

**Location**: `backend/src/routes/auth.ts` → `GET /auth/invite/:token` (line 188-215)

**Current State**: Placeholder implementation that always returns success

**Required Implementation**:
- Create a Supabase service role client (bypasses RLS)
- Query `case_invites` table by token without authentication
- Validate:
  - Token exists
  - Status = 'pending'
  - expires_at > now()
- Return invite details: caseId, invitedEmail, expiresAt, lawyerName
- Add rate limiting to prevent brute force attacks (e.g., 10 requests per IP per minute)

**Code Changes Needed**:
```typescript
// In backend/src/lib/supabase.ts (new file)
export const supabaseServiceRole = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // This is the key - not the public key
);

// In backend/src/routes/auth.ts → GET /auth/invite/:token
const { data: invite, error } = await supabaseServiceRole
  .from('case_invites')
  .select('*, cases(lawyer:profiles(full_name))')
  .eq('token', token)
  .eq('status', 'pending')
  .gt('expires_at', new Date().toISOString())
  .single();
```

**Security Considerations**:
- Service role key has full access - store in `.env.local` only, never commit
- Implement rate limiting at endpoint level
- Log validation failures for audit trail
- Consider adding request signing to prevent token enumeration

**Testing**:
- Create test invite with valid token
- Attempt to fetch with valid/invalid/expired token
- Verify brute force protection works
- Test that invalid tokens return 404, not error details

---

## 2. End-to-End Testing

Before launch, validate complete flows:
- [ ] Lawyer signup → Create case → Generate invite
- [ ] Client clicks link → Accepts invite → Logged into case
- [ ] Client logs event → Captures media → Submits
- [ ] Lawyer reviews event → Adds attorney note → Client sees note
- [ ] Password reset flow works end-to-end

---

## 3. Environment Variables

Ensure all required `.env` files are configured:
```
Backend (.env):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (secret! for /auth/invite/:token)
- SUPABASE_PUBLIC_KEY
- JWT_SECRET
- PORT
- FRONTEND_URL

Frontend (.env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_PUBLIC_KEY
```

---

## 4. Security Audit

- [ ] Review all RLS policies for logic errors
- [ ] Verify no sensitive data in error messages
- [ ] Test SQL injection on all string inputs
- [ ] Check for XSS vulnerabilities in event narrative storage
- [ ] Validate file upload restrictions (size, type, EXIF stripping)
- [ ] Review password reset token expiry (Supabase default: 24 hours)

---

## 5. Performance Optimization

- [ ] Add indexes for common queries (case lookups, event sorting)
- [ ] Implement pagination for event lists
- [ ] Add caching for lawyer profile data
- [ ] Test with 10,000+ events per case
- [ ] Monitor query performance in Supabase dashboard

---

## 6. SHA-256 Hash Verification Detail

**Location**: `apps/mobile/src/services/media.ts` → `processMediaFile()` (lines 126-131)

**Current Implementation**: SHA-256 hashes are computed on Base64-encoded file content, not raw bytes.

```typescript
const fileContent = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,  // ← File read as Base64
});

const sha256Hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  fileContent,  // ← Hash computed on Base64 string
  { encoding: Crypto.CryptoEncoding.Base64 }
);
```

**Why**: Expo's crypto APIs work with string input, so Base64 encoding is necessary for cross-platform compatibility.

**Important Documentation Needed**:
- This is **valid for integrity verification** — if the file hasn't changed, the hash will match
- External verification tools must **Base64-encode the file first** before computing SHA-256
- Example: `sha256(base64(file_bytes))`, not `sha256(file_bytes)`
- If users export events and want to verify hash externally, they need to decode the file, then Base64-encode it again, then hash

**Testing Before Launch**:
- [ ] Document this in user-facing help text
- [ ] Consider adding note in event export (Phase 7+): "Hash verification requires Base64-encoding"
- [ ] Test external hash verification tool with real event data
- [ ] Add example script showing correct hash verification process

---

## 7. EXIF Preservation on Android

**Location**: `apps/mobile/src/services/media.ts` → `captureFromCamera()` (line 99)

**Current Implementation**: `exif: true` in `launchCameraAsync()` configuration.

```typescript
const result = await ImagePicker.launchCameraAsync({
  exif: true,  // Preserve EXIF metadata
  // ...
});
```

**Platform Behavior**:
- **iOS**: EXIF preservation works reliably ✓
- **Android**: Device-dependent behavior
  - Some devices: EXIF preserved fully
  - Some devices: Partial EXIF data
  - Some devices: EXIF stripped by camera hardware

**This is an Expo limitation**, not a code bug. The underlying camera APIs vary by device.

**Testing Before Launch**:
- [ ] Test on 5+ different Android devices (different manufacturers: Samsung, Google Pixel, OnePlus, etc.)
- [ ] Test on older Android versions (SDK 24-26) and newer (SDK 30+)
- [ ] Document which devices/versions have reliable EXIF capture
- [ ] Consider fallback: capture timestamp separately from camera if EXIF missing
- [ ] Update user documentation: "Location and timestamp data captured separately for reliability"

**Client Impact**: Low — we capture GPS and timestamp separately in Step 4, so missing EXIF doesn't break functionality.

---

## 8. Explicit Field Exclusion in Phase 8 Queries

**Location**: `backend/src/routes/cases.ts` → Event SELECT queries

**Current State**: Queries return placeholder data with comments noting field exclusion

**Required Implementation in Phase 8**:
When wiring real Supabase queries, the SELECT statement must EXPLICITLY exclude attorney_note and attorney_flag fields in the actual SQL/query builder code, not just in comments.

```typescript
// WRONG - returns all fields to backend, then filters in application
const events = await supabase.from('events').select('*').where(...);

// CORRECT - excludes at database query level
const events = await supabase.from('events').select(
  'id, title, narrative, severity, occurred_at, created_at, ' +
  'case_id, client_id, location_description, gps_lat, gps_lng, ' +
  'event_type, is_recurring, court_order_reference, actions_taken, ' +
  'privacy_level, related_event_ids, legal_factor_tags, device_id, updated_at'
  // ❌ NOT attorney_note
  // ❌ NOT attorney_flag
).where(...);
```

**Why This Matters**:
- Prevents accidental exposure if API layer has bugs
- Ensures field never transmitted even if cache is compromised
- Defense-in-depth: database query itself doesn't return field

**Affected Endpoints in Phase 8**:
- GET /cases/:id → events array (exclude these fields)
- GET /cases/:id/events → events array (exclude these fields)
- GET /cases/:id/events/:eventId → single event (exclude these fields)
- GET /events/:caseId → events array (exclude these fields)
- GET /events/:caseId/:eventId → single event (exclude these fields)
- POST /cases/:id/export → exported events (exclude these fields)

**Testing Checklist**:
- [ ] SELECT statement explicitly lists safe fields
- [ ] attorney_note not in SELECT list
- [ ] attorney_flag not in SELECT list
- [ ] Verify in production logs that these fields never appear

---

## 9. Upgrade E2E Encryption to Asymmetric (libsodium box)

**Location**: `apps/mobile/src/services/encryption.ts`

**Current State**: Uses symmetric key derivation from caseId + userIds
- Both users derive same key from shared information
- Server could theoretically decrypt if it had the formula

**Required Upgrade Before Launch**:
Implement true E2E with asymmetric encryption using libsodium box:

```typescript
// Each user generates keypair
export async function generateKeypair(): Promise<{
  publicKey: string;  // Base64, stored in profiles.public_key
  secretKey: string;  // Base64, stored locally in SecureStore (never transmitted)
}> {
  const keypair = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(keypair.publicKey),
    secretKey: sodium.to_base64(keypair.secretKey),
  };
}

// Encrypt message to recipient's public key
export async function encryptToRecipient(
  plaintext: string,
  recipientPublicKey: string,
  senderSecretKey: string
): Promise<EncryptedMessage> {
  // Uses crypto_box: XSalsa20 + Poly1305
  // Only recipient with matching secret key can decrypt
}

// Decrypt message sent to user's public key
export async function decryptFromSender(
  encrypted: EncryptedMessage,
  senderPublicKey: string,
  recipientSecretKey: string
): Promise<DecryptedMessage> {
  // crypto_box_open: verify + decrypt
}
```

**Key Differences**:
- Lawyer's public key stored in profiles table (shared)
- Lawyer's secret key stored locally (never leaves device)
- Client's public key stored in profiles table (shared)
- Client's secret key stored locally (never leaves device)
- Server stores messages encrypted with recipient's public key
- Only recipient can decrypt (uses their secret key)
- **Server cannot decrypt even if it has the code** (no secret keys on server)

**Implementation Steps**:
1. On signup: Generate keypair, store secret in SecureStore, public in profiles.public_key
2. On message send: Fetch recipient's public key, encrypt with recipient's public key + sender's secret key
3. On message receive: Decrypt with sender's public key + recipient's secret key
4. On logout: Secret key remains in SecureStore (survives logout)
5. On device wipe: SecureStore cleared, secret key lost (backup recovery flow needed)

**Testing Before Launch**:
- [ ] Keypair generation works on iOS and Android
- [ ] Secret key persists across app restarts
- [ ] Message encryption/decryption works with real libsodium
- [ ] Server cannot decrypt messages without secret keys
- [ ] Lost secret key cannot be recovered (test recovery flow)
- [ ] Public key rotation works (user generates new keypair)

**Install libsodium.js**:
```bash
npm install libsodium.js
```

**Why This Matters**:
- Current implementation: Symmetric key is derived from case info
  - If someone knows caseId and userIds, they can derive the key
  - Server could theoretically decrypt if it wanted to
- New implementation: Only device with secret key can decrypt
  - Perfect forward secrecy: even if server is compromised, old messages stay encrypted
  - True end-to-end encryption (not just "encrypted in transit")

---

## Priority: CRITICAL ⚠️

Item #1 (Supabase Service Role) blocks the invite flow from working. This must be implemented before Phase 5 testing.
