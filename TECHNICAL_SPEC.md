# Reflex Delivery Coordination System
## Technical Specification & Architecture

---

## 1. TECHNOLOGY STACK

### Frontend
- **Runtime:** Vanilla JavaScript (ES2020 standard, no transpilation)
- **DOM API:** Browser standard DOM APIs (querySelector, addEventListener, textContent)
- **CSS:** Pure CSS3 with media queries (no preprocessor, no framework)
- **HTML:** Semantic HTML5 with ARIA attributes for accessibility

### Why These Choices?
- **No build tool required** → Runs directly in browser, no npm install
- **No framework overhead** → Reduces bundle size from ~50KB (React) to ~30KB (single HTML file)
- **Offline-first by design** → No external API calls; works completely in browser
- **Easy to inspect and debug** → No transpiled code; breakpoints match source exactly
- **Zero dependencies** → No vulnerability surface, no dependency tree hell

### Constraint: Demo/POC Only
This stack is appropriate *only* for single-user demo environments. See [What Happens Outside The App](#5-what-happens-outside-the-app) for production requirements.

---

## 2. DATA MODEL

### Core Entities

#### Delivery
```javascript
{
  id:        String,      // "RX-1048" (format: "RX-" + (1049 + length))
  customer:  String,      // Customer name
  phone:     String,      // Contact phone number
  address:   String,      // Delivery location
  item:      String,      // Item description
  status:    Enum,        // "Open" | "Assigned" | "Picked Up" | "Delivered"
  rider:     String|null, // Rider name or null if unassigned
  created:   String,      // Human-readable timestamp ("8 min ago", "1 hr ago")
  code:      String|null  // 5-char confirmation code (generated on assign)
}
```

**Rationale for fields:**
- `id`: Scoped to branch; incremental ID for demo simplicity
- `code`: String (not numeric) for human readability; generated on assignment, not on creation
- `status`: Enumerated to support exactly 4 states (see [Status Flow](#4-status-update-flow))
- `created`: String (relative time) rather than timestamp for demo readability

#### Rider
```javascript
{
  name:      String,      // Rider display name
  initials:  String,      // 1-2 character initials for avatar
  area:      String,      // Service area (e.g., "Westlands area")
  deliveries: Number,     // Count of assigned deliveries (advisory only)
  color:     String       // Hex color for avatar background (#RRGGBB)
}
```

**Rationale:**
- `deliveries`: Not synchronized to actual delivery count; shown for UX context only
- `color`: Pre-assigned; no random color generation (deterministic for demo)
- `area`: Optional; defaults to branch area if missing

#### Branch
```javascript
{
  shop:           String,
  branch:         String,
  area:           String,
  seedDeliveries: Array<Delivery>,
  seedRiders:     Array<Rider>
}
```

**Branches implemented:**
1. **Westlands** (`id: "westlands"`)
   - 5 seed deliveries (IDs: RX-1044 to RX-1048)
   - 3 seed riders (David K., Samuel O., Lucy W.)

2. **CBD** (`id: "cbd"`)
   - 3 seed deliveries (IDs: RX-2046 to RX-2048)
   - 2 seed riders (Grace N., Isaac M.)

**Why separate branches?**
- Simulates multi-location business (e.g., franchise with multiple store branches)
- Data is isolated per branch (no cross-branch queries)
- Switching branches loads different rider teams and delivery records

### State Tree
```
Global Scope (app.js)
├── currentBranch          ("westlands" | "cbd")
├── currentRole            ("dispatcher" | "retailer" | "rider")
├── deliveries[]           (array of Delivery objects)
├── riders[]               (array of Rider objects)
└── branchProfiles{}       (read-only config)
```

**Why global?**
- Avoids prop-drilling in procedural rendering
- Simple to debug (print state to console)
- Sufficient for single-user demo
- **Production trade-off:** Would need state management library (Redux/MobX)

### Persistence Model

#### Storage Keys
```
localStorage[`reflex-${branchId}-deliveries`]  // Branch-specific delivery array
localStorage[`reflex-${branchId}-riders`]      // Branch-specific rider array
localStorage["reflex-branch"]                   // Current branch ID
localStorage["reflex-deliveries"]               // Legacy key (Westlands migration)
localStorage["reflex-riders"]                   // Legacy key (Westlands migration)
```

#### Load Strategy (on app startup)
```javascript
loadBranch("westlands") {
  // 1. Try branch-scoped key first
  deliveries = JSON.parse(localStorage.getItem(`reflex-westlands-deliveries`))
  
  // 2. If Westlands, try legacy key for backward compatibility
  if (!deliveries && branch === "westlands") {
    deliveries = JSON.parse(localStorage.getItem("reflex-deliveries"))
  }
  
  // 3. Otherwise use seed data
  if (!deliveries) {
    deliveries = branchProfiles[branch].seedDeliveries.map(d => ({...d}))
  }
}
```

**Rationale:**
- **Branch-scoped keys:** Prevent accidental data corruption when switching branches
- **Legacy key support:** Preserves user data from older versions
- **Shallow copy:** `{...delivery}` ensures seed data is not mutated

#### Storage Triggers
| Action | Storage Call |
|--------|--------------|
| Create delivery | `save()` → saves all deliveries |
| Assign delivery | `save()` + `saveRiders()` (code generation) |
| Update delivery status | `save()` |
| Add rider | `saveRiders()` |
| Delete rider | `saveRiders()` |
| Branch switch | `loadBranch()` → loads from storage |

**Why eager writes?**
- Simplicity: No transaction queue
- Reliability: Survives browser crash
- Cost: localStorage write is ~1ms per 100KB

**Trade-off:**
- No undo/redo (writes are permanent immediately)
- No sync across tabs (localStorage updates are isolated per tab)

---

## 3. HOW ASSIGNMENT WORKS

### Definition
*Assignment* = linking an unassigned delivery to a specific rider.

### Prerequisites
- Delivery status must be `"Open"`
- Rider must exist in current branch
- No validation that rider is available (no workload limits)

### Assignment Flow

```
1. User clicks "Assign" button on Open delivery
   ↓
2. openAssign(id) is called with delivery ID
   ├─ Fetch delivery record: const d = deliveries.find(x => x.id === id)
   ├─ Render modal with rider dropdown
   │  └─ Dropdown populated from riders[] array
   ├─ Attach form submit handler
   └─ Show modal
   ↓
3. User selects rider and clicks "Assign delivery" button
   ├─ Form submit prevented (e.preventDefault())
   ├─ FormData extracted: rider name
   ↓
4. Update delivery object in memory
   ├─ d.rider = selectedRiderName
   ├─ d.status = "Assigned"
   ├─ d.code = generateCode()  // 5-char alphanumeric
   └─ Delivery is now "hot" but not persisted yet
   ↓
5. Persist to localStorage
   ├─ save()   // writes deliveries array
   └─ closeModal()
   ↓
6. Re-render entire UI
   ├─ render() function called
   ├─ Delivery no longer shows in "Open requests"
   ├─ Appears in rider's assigned deliveries
   └─ Confirmation code displayed in tracking view
   ↓
7. Show feedback
   └─ Toast message: "RX-1048 assigned successfully"
```

### Code Generation (on assignment)
```javascript
d.code = Math.random().toString(36).slice(2, 7).toUpperCase();
// Example outputs: "K7M4Q", "C4B8M", "P2X8L"
```

**Why generated on assignment, not on creation?**
- Open deliveries don't need codes (no rider yet to deliver)
- Code is only needed when rider picks up the package
- Reduces cognitive load for dispatcher (fewer codes in backlog)

**Why this format?**
- 5 characters: Human readable, fits on receipt
- Alphanumeric (36^5 = ~60M combinations): Easy to type, still unique within single session
- Uppercase: Clearer on paper receipts
- Generated via `Math.random()`: Fast, no server required

**Trade-off:**
- Not cryptographically secure (predictable)
- Not guaranteed unique (collision risk with large datasets)
- No validation on delivery (rider can guess codes)
- *Acceptable for demo; production needs UUID or cryptographic hash*

### What Does NOT Change on Assignment
- `created` field remains unchanged
- `customer`, `phone`, `address`, `item` are immutable after creation
- No timestamp field tracks when assignment occurred
- No assignment audit trail

---

## 4. STATUS UPDATE FLOW

### Status Lifecycle
```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    v                                     │
              [Open] ──Assign──> [Assigned] ──Pickup──> [Picked Up] ──Confirm──> [Delivered]
                    │
                    │ (never reverses; no cancellation)
                    │
              (stuck in Open if never assigned)
```

### Status Transitions

#### Open → Assigned
**Trigger:** Dispatcher clicks "Assign" button  
**Entry points:** `openAssign()` modal form  
**Validation:** Delivery must be in Open status  
**Effect:**
```javascript
d.status = "Assigned"
d.rider = selectedRiderName
d.code = generateCode()
save()  // Persisted immediately
render()  // UI updated
```

#### Assigned → Picked Up
**Trigger:** Rider clicks "Mark picked up" button  
**Entry points:** `openUpdate()` modal, only for assigned deliveries  
**Validation:** Delivery must be Assigned or Picked Up  
**Effect:**
```javascript
d.status = "Picked Up"
save()
render()
```

**Why no code required?**
- Rider is already authenticated (demo simplification)
- Code needed only for final delivery confirmation

#### Picked Up → Delivered
**Trigger:** Rider clicks "Confirm delivery" button + enters confirmation code  
**Entry points:** `openUpdate()` modal  
**Validation:**
```javascript
if (userCode.toUpperCase() !== d.code) {
  showToast("That confirmation code does not match")
  return  // No state change
}
```

**Effect:**
```javascript
d.status = "Delivered"
save()
render()
showToast("Delivery confirmed")
```

**Why code required here?**
- Code proves recipient identity (demo: customer presents code on paper)
- Protects against accidental confirmation
- Rider cannot skip to delivery without code

#### No Reverse Transitions
**Design principle:** Status is write-once after creation

**Why?**
- Simplifies logic (no rollback state machine)
- Audit trail is implicit (can only move forward)
- Matches real-world: delivery lifecycle is irreversible

**Trade-off:**
- Cannot undo accidental "Delivered" status
- Rider stuck with "Picked Up" if they close app
- No "reassign" flow (delivery must stay with original rider)

### Status Visibility by Role

| Status | Dispatcher | Retailer | Rider |
|--------|-----------|----------|-------|
| Open | Yes, can assign | Yes, in recent list | No |
| Assigned | Yes | Yes, tracked | Only their own |
| Picked Up | Yes | Yes, tracked | Only their own |
| Delivered | Yes (history) | Yes (completed) | Only their own (completed) |

**Filter logic:**
```javascript
// Dispatcher sees all
if (currentRole === "dispatcher") showAllStatuses()

// Retailer sees only their 4 most recent deliveries
if (currentRole === "retailer") showLast4Deliveries()

// Rider sees only deliveries assigned to them, excluding Delivered
if (currentRole === "rider") {
  const assigned = deliveries.filter(d =>
    d.rider === riders[0].name && d.status !== "Delivered"
  )
}
```

### Update Metrics (on Every Status Change)
```javascript
const open = deliveries.filter(d => d.status === "Open").length
const active = deliveries.filter(d =>
  ["Assigned", "Picked Up"].includes(d.status)
).length
const done = deliveries.filter(d => d.status === "Delivered").length
```

**Recalculated on:** Any `render()` call  
**Cost:** O(n) scan of deliveries array  
**Acceptable because:** Delivery count typically < 1000 in demo

---

## 5. WHAT HAPPENS OUTSIDE THE APP

### Nothing (By Design)

Reflex is **entirely local to the browser.** No external services are called.

```
┌─────────────────────────────────────────┐
│  Browser (Single User)                  │
├─────────────────────────────────────────┤
│  Reflex SPA (app.js)                    │
│  ├─ Renders UI (index.html)             │
│  ├─ Manages state (JavaScript globals)  │
│  └─ Persists to localStorage            │
├─────────────────────────────────────────┤
│  localStorage (5-10MB quota)            │
│  ├─ reflex-westlands-deliveries         │
│  ├─ reflex-westlands-riders             │
│  ├─ reflex-cbd-deliveries               │
│  ├─ reflex-cbd-riders                   │
│  └─ reflex-branch (current)             │
└─────────────────────────────────────────┘
        ↑ (no network calls)
        │
    [No Backend]
    [No Database]
    [No API]
    [No WebSocket]
    [No Third Parties]
```

### Imports
The only external dependency is **Google Fonts** (CSS only):
```html
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
```

**Why?**
- Improves typography quality
- CSS-only; no JavaScript dependencies
- Can be disabled (fallback to system fonts)
- Static file, not calling any API

### No Real-Time Sync
The "Live sync on" indicator in the UI is **visual only:**
```javascript
setInterval(() => {
  document.querySelector(".sync-note small")
    ?.replaceChildren(
      document.createTextNode("Updated just now")
    )
}, 5000)
```

**What it does:** Updates the timestamp text every 5 seconds  
**What it doesn't do:** Any actual network call or data sync

**Rationale:** Demo environment; no other users to sync with

### CSV Export
The only data-moving operation is **manual export:**

```javascript
const csv = [headers, ...rows]
  .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
  .join("\n")

const link = document.createElement("a")
link.href = URL.createObjectURL(new Blob([csv], {type: "text/csv"}))
link.download = "reflex-deliveries.csv"
link.click()
```

**Flow:**
1. Generates CSV in memory
2. Creates Blob (binary large object)
3. Generates object URL
4. Triggers browser download
5. User saves file locally

**Why this approach?**
- No server storage needed
- User controls when export happens
- Data never leaves the browser
- CSV format is portable (Excel, Google Sheets, etc.)

### Persistence Is Permanent Until...
Deliveries persist in `localStorage` until:
1. User manually clicks "Reset demo data" → calls `resetData()`
2. User clears browser data → localStorage purged
3. Browser domain/origin changes → localStorage isolated per origin

**No automatic cleanup** (e.g., no TTL, no archival)

---

## 6. DESIGN JUSTIFICATIONS

### Why No Backend?
| Consideration | Rationale |
|---------------|-----------|
| Demo/POC scope | No authentication needed |
| Quick iteration | No API development cycle |
| Offline use | Works in airplane mode |
| Deployment | Single static HTML file |
| Learning | Shows browser capabilities clearly |

### Why No Database?
localStorage is sufficient for:
- ≤10,000 deliveries (per spec estimate)
- Single user (no concurrent writes)
- Data lifecycle < 1 month (typical)
- Non-critical data (can be recreated)

### Why Procedural Rendering?
| Trade-off | Benefit |
|-----------|---------|
| No virtual DOM | No library overhead |
| Immediate DOM updates | Simpler debugging |
| Full re-render | No stale UI states |
| Linear complexity | Acceptable for <1000 items |

### Why String Timestamps?
| Choice | Alternative | Why Avoided |
|--------|-------------|------------|
| "8 min ago" | `1234567890` (Unix timestamp) | Human-readable; no date logic |
| Relative | ISO string | Works in demo; production would track real time |

### Why Single Branch Switch per Session?
```javascript
currentBranch = localStorage.getItem("reflex-branch") || "westlands"
```

**Why not multi-branch UI?**
- Dispatcher manages one branch at a time
- Switching branches reloads all state
- Prevents accidental cross-branch assignments

**Trade-off:** Cannot view both branches simultaneously  
**Acceptable because:** Real business would use separate roles per user

### Why No Undo/Redo?
| Operation | Reversible? | Why? |
|-----------|-----------|-------|
| Create delivery | No | Would need soft-delete; not realistic |
| Assign delivery | No | Rider has already left to pick up |
| Confirm delivery | No | Recipient has package; immutable |
| Delete rider | No (guarded) | Cannot undelivery assignments |

**Only guarded operation:** Deleting a rider with active deliveries

---

## 7. SUMMARY TABLE: Justifications

| Component | Choice | Rationale | Trade-off |
|-----------|--------|-----------|-----------|
| **Stack** | Vanilla JS | Zero dependencies | Not scalable |
| **Storage** | localStorage | No server needed | 5-10MB limit |
| **State** | Global mutable | Simple debugging | Hard to test |
| **Render** | Full re-render | No diffing logic | Slower with 10k+ items |
| **Persistence** | Eager writes | Survives crash | No transactions |
| **Codes** | Math.random | Fast generation | Not cryptographically secure |
| **Statuses** | 4-state enum | Simple machine | No cancellations |
| **Roles** | UI filter only | Demo simplicity | No server-side auth |
| **Riders** | Hardcoded | Quick POC | Not configurable |
| **Branches** | 2 branches | Sufficient demo | Not extensible |
| **Activity** | Synthetic feed | Avoids event logging | Not audit-friendly |

---

## 8. KNOWN LIMITATIONS

These are not bugs; they are documented trade-offs of the POC architecture:

1. **No true multi-user support:** Only one person using app at a time
2. **No real authentication:** Role switching is UI-only demo
3. **No undo:** All writes are permanent
4. **No cross-tab sync:** Open same app in two tabs → they don't coordinate
5. **Hardcoded rider in Rider view:** Only first rider sees "their" deliveries
6. **Synthetic activity feed:** Timestamps don't reflect actual actions
7. **No rate limiting:** Can spam requests (no practical limits)
8. **Weak codes:** 5-char codes are guessable
9. **No error recovery:** Silent failures on invalid operations
10. **No offline notifications:** No service worker; won't work when disconnected

Each of these would require:
- Real backend for #1-3
- WebSocket for #4
- Role-per-user system for #5
- Event logging system for #6
- API rate limiting for #7
- Cryptographic hash library for #8
- Error boundary components for #9
- Service worker + push API for #10

---

## 9. MIGRATION PATH (If Scaling to Production)

```
Current (Demo)                Production (Year 1)
─────────────────             ──────────────────
app.js (900 lines)      →     Multiple modules
─ HTML injection        →     React/Vue components
─ Global state          →     Redux/MobX store
─ localStorage          →     PostgreSQL database
─ No auth               →     JWT + RBAC
─ Math.random codes     →     UUID v4
─ Synthetic activity    →     Real event log
─ Manual CSV export     →     API endpoint
└─ Browser-only         →     Client + Server
```

**Estimated effort:** 2-3 weeks (1-2 engineers)

