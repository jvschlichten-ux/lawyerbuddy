# Phase 6: Lawyer Portal

## Overview

This phase implements the lawyer's case management interface with three critical screens: Dashboard, Checklist Builder, and Export. The focus is on **attorney note security** — ensuring attorney notes remain private and are never exposed to clients.

---

## 🔒 CRITICAL SECURITY: Attorney Notes Never Exposed

### Key Principle

**Attorney notes are lawyer-private information and must NEVER be returned to client in any API response.**

### Where Attorney Notes Are Protected

#### 1. **Database Level (RLS Policy)**

```sql
CREATE POLICY "events_update_attorney_note_lawyer_only" ON events FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()))
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()));
```

- Only lawyers can UPDATE attorney_note field
- Clients cannot UPDATE this field
- Clients cannot SELECT this field (should be excluded in backend)

#### 2. **Backend API Level**

**All GET responses to clients EXCLUDE attorney_note:**

```typescript
// WRONG - returns attorney_note to client
const events = await db.select().from('events').where(...);

// CORRECT - explicitly excludes attorney_note
const events = await db.select(
  'id', 'title', 'narrative', 'severity', 'location',
  // ... other fields
  // ❌ NO 'attorney_note'
).from('events').where(...);
```

**Affected Endpoints:**
- `GET /cases/:id` → events EXCLUDE attorney_note
- `GET /cases/:id/events` → events EXCLUDE attorney_note
- `GET /cases/:id/events/:eventId` → EXCLUDE attorney_note
- `POST /cases/:id/export` → NEVER includes attorney_note, even if user requests it

#### 3. **Frontend Level**

- Attorney notes only displayed on lawyer screens
- Client screens never show notes field
- ExportScreen explicitly states: "Attorney notes are NOT included in exports"

---

## Phase 6 Screens

### 1. LawyerDashboardScreen ← Dashboard

**Location**: `apps/mobile/src/screens/lawyer/LawyerDashboardScreen.tsx`

**Purpose**: Overview of all lawyer's cases and pending event reviews

**Features**:
- **Active Cases List**
  - Case title, client name
  - Event count
  - Pending review count (red badge)
  - Status indicator
  - Click to view case details

- **Pending Events Section**
  - Events awaiting lawyer review
  - Client name, event type, title
  - Severity badge (color-coded)
  - Time since creation ("2h ago")
  - Click to open event review

- **Quick Stats**
  - Total cases, active cases
  - Pending reviews count
  - Unreviewed event notifications

**Data Flow**:
```
LawyerDashboardScreen
├─ Fetch GET /cases (lawyer sees own cases)
├─ Fetch GET /cases/:id/events (pending events)
└─ Display with real-time badge updates
```

**Screenshot**:
```
┌─────────────────────────────────────┐
│ Dashboard                        [+] │
│ ┌─────────────────────────────────┐ │
│ │ Active Cases                    │ │
│ ├─────────────────────────────────┤ │
│ │ Smith v. County Sheriff      [3]│ │
│ │ John Smith                      │ │
│ │ 📋 12 events  🔍 3 pending    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Pending Review                2 │ │
│ ├─────────────────────────────────┤ │
│ │ [H] Traffic Stop on Main St   │ │
│ │     John Smith • 2h ago       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 2. ChecklistBuilderScreen ← Checklist Management

**Location**: `apps/mobile/src/screens/lawyer/ChecklistBuilderScreen.tsx`

**Purpose**: Create and manage case checklists with permission-based editing

**Critical Feature**: Only lawyers can edit; clients see read-only view

#### Permission Model

| Action | Lawyer | Client |
|--------|--------|--------|
| **View checklist** | ✓ | ✓ |
| **Add items** | ✓ | ✕ |
| **Mark complete** | ✓ | ✕ |
| **Edit label** | ✓ | ✕ |
| **Delete items** | ✓ | ✕ |
| **Reorder items** | ✓ (drag) | ✕ |

#### Lawyer View (Full Editor)

```
Checklist               Progress: 2 of 4 (50%)
─────────────────────────────────
☑ File complaint ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ ✓ Mar 20
☑ Gather evidence ▔▔▔▔▔▔▔▔▔▔▔▔▔▔ ✓ Mar 22
☐ Prep deposition [≡] ▔▔▔▔▔▔▔▔▔▔▔ [✕]
☐ Review court filings [≡]        [✕]
─────────────────────────────────
+ Add Item
─────────────────────────────────
☐ Drag to reorder
☐ Click checkbox to complete
☐ Swipe to delete
```

#### Client View (Read-Only)

```
Checklist               Progress: 2 of 4 (50%)
─────────────────────────────────
☑ File complaint ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
☑ Gather evidence ▔▔▔▔▔▔▔▔▔▔▔▔▔▔
☐ Prep deposition
☐ Review court filings
─────────────────────────────────
👁️ View Only
Your lawyer manages this checklist
```

#### Features

**For Lawyers:**
- Add new checklist items with label + optional description
- Click checkbox to mark complete (auto-timestamps)
- Drag items to reorder (updates order_index in DB)
- Delete items (with confirmation)
- See completion timestamp ("✓ Completed Mar 22, 2:30 PM")
- Progress bar (% complete)

**For Clients:**
- See all items and completion status
- See when items were completed
- Cannot add, edit, or delete
- Cannot interact with items (view-only)

#### Data Structure

```typescript
interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  isComplete: boolean;
  completedAt?: ISO timestamp;
  completedBy?: string;           // "You" or lawyer name
  orderIndex: number;
}
```

#### Backend Integration

**RLS Policies Enforce Permissions:**

```sql
-- Client can READ checklist items
CREATE POLICY "checklist_items_select_case_members" ON checklist_items FOR SELECT
  USING (case_id IN (
    SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
  ));

-- Only lawyer can INSERT
CREATE POLICY "checklist_items_insert_lawyer_only" ON checklist_items FOR INSERT
  WITH CHECK (case_id IN (
    SELECT id FROM cases WHERE lawyer_id = auth.uid()
  ));

-- Only lawyer can UPDATE
CREATE POLICY "checklist_items_update_lawyer_only" ON checklist_items FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()))
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()));

-- Only lawyer can DELETE
CREATE POLICY "checklist_items_delete_lawyer_only" ON checklist_items FOR DELETE
  USING (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()));
```

**If client tries to POST /cases/:id/checklist** → RLS rejects with error

---

### 3. ExportScreen ← Case Export

**Location**: `apps/mobile/src/screens/lawyer/ExportScreen.tsx`

**Purpose**: Export case data for court submission or records

**CRITICAL: Attorney notes NEVER included in exports**

#### Export Options

**Format Selection:**
- PDF (default)
- JSON
- DOCX (Word document)

**Include Options:**
- ☑ Checklist items
- ☑ Media files
- ☑ GPS coordinates

#### What Gets Exported

✅ **INCLUDED:**
- Case details (title, type, dates, jurisdiction)
- Client events (all logged incidents with narratives)
- Media (photos, videos with SHA-256 hashes for verification)
- GPS coordinates and addresses
- Checklist items (with completion status)
- Timestamps (UTC)

❌ **EXCLUDED (Never):**
- attorney_note field (lawyer private, not exportable)
- attorney_flag (internal lawyer flag, not exportable)
- Any attorney work-product

#### Backend Implementation

**CRITICAL SQL Query for Export:**

```typescript
// WRONG - includes attorney_note
const events = await db.select().from('events').where({ case_id: caseId });

// CORRECT - explicitly EXCLUDES attorney_note
const events = await db.select(
  'id',
  'title',
  'event_type',
  'narrative',
  'severity',
  'occurred_at',
  'location_description',
  'gps_lat',
  'gps_lng',
  'privacy_level',
  // ... other fields
  // ❌ NOT attorney_note
  // ❌ NOT attorney_flag
).from('events').where({ case_id: caseId });
```

#### User Interface

```
EXPORT CASE
┌────────────────────────────────────┐
│ 🔒 Attorney Notes Confidential    │
│ Attorney notes are lawyer-private  │
│ and cannot be included in exports. │
│ They remain in LawyerBuddy only.  │
└────────────────────────────────────┘

WHAT WILL BE EXPORTED:
  ✓ Case details
  ✓ Client events & narratives
  ✓ Location data & coordinates
  ✓ Media files (photos/videos)
  ❌ Attorney notes (excluded)
  ❌ Internal flags (excluded)

EXPORT OPTIONS:
  File Format: [PDF] [JSON] [DOCX]
  ☑ Include checklist items
  ☑ Include media files
  ☑ Include GPS coordinates

PRIVACY & SECURITY:
  🔐 Encrypted during transfer
  ⚖️ Court admissible
  📋 Audit trail logged

[📥 EXPORT NOW]
```

#### Privacy Disclaimer

```
⚠️ IMPORTANT DISCLAIMER
• Exported data is confidential
• Attorney notes remain private (on your device only)
• You are responsible for data security post-export
• Ensure compliance with data protection regulations
```

---

## Backend Routes

### Cases Routes

**Location**: `backend/src/routes/cases.ts`

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /cases | ✓ | Create case (lawyer) |
| GET | /cases | ✓ | List cases (lawyer sees own) |
| GET | /cases/:id | ✓ | Get case details + events |
| PATCH | /cases/:id | ✓ | Update case (lawyer) |
| POST | /cases/:id/invite | ✓ | Generate invite token |
| POST | /cases/:id/export | ✓ | Export case (attorney_note excluded) |
| GET | /cases/:id/checklist | ✓ | Get checklist items |
| POST | /cases/:id/checklist | ✓ | Add item (lawyer) |
| PATCH | /cases/:id/checklist/:itemId | ✓ | Update item (lawyer) |
| DELETE | /cases/:id/checklist/:itemId | ✓ | Delete item (lawyer) |

### Events Routes

**Location**: `backend/src/routes/events.ts`

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /events | ✓ | Create event (client) |
| GET | /events/:caseId | ✓ | List events (attorney_note excluded) |
| GET | /events/:caseId/:eventId | ✓ | Get event (attorney_note excluded) |
| PATCH | /events/:caseId/:eventId | ✓ | Update event (lawyer adds notes) |

---

## Attorney Note Field

### Database Schema

```sql
CREATE TABLE events (
  ...
  attorney_flag BOOLEAN DEFAULT FALSE NOT NULL,     -- Lawyer internal flag
  attorney_note TEXT,                               -- Lawyer private notes
  ...
);
```

### RLS Policy

```sql
CREATE POLICY "events_update_attorney_note_lawyer_only" ON events FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()))
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid()));
```

- Only lawyers can update attorney_note
- Clients cannot access this field

### API Response Filtering

**When returning events to client:**

```typescript
function filterEventForClient(event: any) {
  const { attorney_note, attorney_flag, ...rest } = event;
  return rest;  // Exclude both fields
}
```

### Export Guarantee

**The export endpoint explicitly excludes attorney_note:**

```typescript
router.post('/:id/export', verifyJWT, async (req: Request, res: Response) => {
  // Fetch events WITHOUT attorney_note field
  const events = await db
    .from('events')
    .select('id, title, narrative, severity, ...') // ❌ NO attorney_note
    .where({ case_id: id });

  // Generate file
  // Return download URL
  // attorney_note is impossible to include, even if user tries
});
```

---

## Security Verification Checklist

### Phase 6 Launch Checklist

- [ ] **attorney_note NEVER in GET responses**
  - Test: Lawyer logs in, fetches case events
  - Verify: Response doesn't include attorney_note field
  - Test: Client logs in, fetches same case events
  - Verify: Response definitely doesn't include attorney_note

- [ ] **Export NEVER includes attorney_note**
  - Test: Lawyer exports case to PDF/JSON/DOCX
  - Verify: Open file, search for "attorney_note" → not found
  - Test: Try to request attorney_note in export body
  - Verify: Still excluded, field ignored

- [ ] **Clients can't edit checklist**
  - Test: Client attempts POST /cases/:id/checklist
  - Verify: 403 Forbidden (RLS rejects)
  - Test: Client attempts PATCH /cases/:id/checklist/:itemId
  - Verify: 403 Forbidden (RLS rejects)

- [ ] **Lawyers can add attorney notes**
  - Test: Lawyer updates event with attorney_note
  - Verify: PATCH succeeds, note stored
  - Test: Client fetches same event
  - Verify: Event returned without attorney_note field

- [ ] **Audit trail logs attorney note updates**
  - Test: Lawyer adds attorney note
  - Verify: Audit log shows update
  - Verify: Client cannot see audit log entries

---

## Testing Guide

### Test Case 1: Attorney Notes Not Leaked

```bash
# 1. Lawyer creates event with attorney_note
PATCH /cases/case_1/events/event_1
{
  "attorney_note": "Client appears unreliable. Recommend written communication."
}
# Result: attorney_note stored in DB

# 2. Lawyer fetches event
GET /cases/case_1/events/event_1
# Result: Event returned WITHOUT attorney_note field

# 3. Client fetches same event
GET /cases/case_1/events/event_1
# Result: Event returned WITHOUT attorney_note field (same as lawyer)

# 4. Export case
POST /cases/case_1/export { format: "pdf" }
# Result: PDF generated, search for "attorney_note" → not found
```

### Test Case 2: Client Can't Edit Checklist

```bash
# Client attempts to add item
POST /cases/case_1/checklist
{
  "label": "Pay filing fee"
}
# Result: 403 Forbidden
# Message: "RLS policy violation: user not lawyer"

# Client attempts to mark complete
PATCH /cases/case_1/checklist/item_1
{
  "isComplete": true
}
# Result: 403 Forbidden
```

---

## Files Created in Phase 6

### Frontend
```
apps/mobile/src/screens/lawyer/
├── LawyerDashboardScreen.tsx (Dashboard with case list + pending events)
├── ChecklistBuilderScreen.tsx (Checklist editor, lawyer-only modify)
└── ExportScreen.tsx (Export with attorney note disclaimer)
```

### Backend
```
backend/src/routes/
├── cases.ts (Updated with all case management endpoints)
└── events.ts (Updated, attorney_note handling)

backend/src/server.ts (Routes registered)
```

### Documentation
```
PHASE-6-LAWYER-PORTAL.md (This file)
```

---

## What's Next

### Phase 7: Security Implementation
- End-to-end encryption for messages
- Rate limiting on sensitive endpoints
- Audit log implementation
- Compliance logging

### Phase 8: Real-time + Notifications
- WebSocket events for new notifications
- Push notifications when events submitted
- Real-time checklist updates
- Lawyer notifications for case activity

### Phase 9: Mobile Optimization
- Offline support with sync
- App icons and branding
- Android/iOS specific optimizations
- Background sync for events

### Phase 10: Final Hardening
- Full security audit
- Load testing
- Penetration testing
- Compliance verification
