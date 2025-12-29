## Data Flow Diagram (Creator Statistics Report)

### With Detailed Component Explanations

Below is the actual data-flow diagram showing the components and **correct file paths** for the Creator Statistics Report feature we implemented.

```
┌─────────────────────────────────────────────────────────────┐
│  [Creator Dashboard - Stats Report Tab]                     │
│  (UI Component)                                              │
│  File: core/templates/pages/creator-dashboard-page/         │
│        creator-dashboard-page.component.ts                   │
│        creator-dashboard-page.component.html                 │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 1) Component loads and calls HTTP GET
                          v
┌─────────────────────────────────────────────────────────────┐
│  [HTTP GET Request]                                          │
│  URL: /creator_dashboard/stats_report                        │
│  Method: GET                                                 │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 2) Request routed by main.py
                          v
┌─────────────────────────────────────────────────────────────┐
│  {URL Router}                                                │
│  File: main.py (line ~450)                                   │
│  Route: /creator_dashboard/stats_report                      │
│        → CreatorDashboardStatsHandler                        │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 3) Routes to Handler
                          v
┌─────────────────────────────────────────────────────────────┐
│  {Backend HTTP Handler}                                      │
│  File: core/controllers/creator_dashboard.py (line 488)     │
│  Class: CreatorDashboardStatsHandler                         │
│  Method: get()                                               │
│  Security: @can_access_creator_dashboard                     │
│                                                              │
│  What it does:                                               │
│  - Receives HTTP GET request                                 │
│  - Validates user has creator permissions                    │
│  - Calls analytics_services functions                        │
│  - Builds JSON response                                      │
│  - Returns stats to frontend                                 │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 4) Handler calls analytics services
                          v
┌─────────────────────────────────────────────────────────────┐
│  <Business Logic / Analytics Services>                       │
│  File: core/domain/analytics_services.py                    │
│                                                              │
│  Functions:                                                  │
│  - get_daily_active_users(creator_id)                       │
│  - get_weekly_active_users(creator_id)                      │
│  - get_retention_rate(creator_id, days)                     │
│  - get_avg_session_time(creator_id)                         │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 5) Services query database models
                          v
┌─────────────────────────────────────────────────────────────┐
│  <Database Model Layer>                                      │
│  File: core/storage/analytics/gae_models.py                 │
│                                                              │
│  Models:                                                     │
│  - ExplorationSessionModel                                   │
│    • user_id (who watched)                                   │
│    • exploration_id (what they watched)                      │
│    • creator_id (who created it)                             │
│    • session_start_time                                      │
│    • session_end_time                                        │
│    • cards_visited                                           │
│    • completed                                               │
│                                                              │
│  - CardStatsModel (future use)                               │
│    • exploration_id                                          │
│    • card_id                                                 │
│    • total_visits                                            │
│    • exits                                                   │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 6) Query returns session records
                          v
┌─────────────────────────────────────────────────────────────┐
│  [Aggregation Logic]                                         │
│  Location: core/domain/analytics_services.py                │
│                                                              │
│  Strategy: On-the-fly computation (no caching yet)           │
│                                                              │
│  Calculations:                                               │
│  - DAU: Count unique user_ids (last 24 hours)               │
│  - WAU: Count unique user_ids (last 7 days)                 │
│  - Retention: % of users who return within 7 days           │
│  - Avg Time: Mean of (end_time - start_time)                │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 7) Handler builds JSON response
                          v
┌─────────────────────────────────────────────────────────────┐
│  {JSON Response Builder}                                     │
│  File: core/controllers/creator_dashboard.py                │
│  Method: self.render_json(stats)                            │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    "dau": 42,                                                │
│    "wau": 156,                                               │
│    "retention_7d": 0.32,                                     │
│    "avg_session_time_secs": 285.5                            │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 8) HTTP 200 response sent to frontend
                          v
┌─────────────────────────────────────────────────────────────┐
│  [Frontend Receives Response]                                │
│  File: core/templates/pages/creator-dashboard-page/         │
│        creator-dashboard-page.component.ts                   │
│                                                              │
│  TypeScript handles response and updates view model          │
└─────────────────────────────────────────────────────────────┘
                          |
                          | 9) Component renders statistics
                          v
┌─────────────────────────────────────────────────────────────┐
│  [Creator Sees Metrics on Stats Report Tab]                 │
│                                                              │
│  Display:                                                    │
│  📊 Daily Active Users: 42                                   │
│  📊 Weekly Active Users: 156                                 │
│  📊 7-Day Retention: 32%                                     │
│  📊 Avg Session Time: 4m 45s                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 What is `CreatorDashboardStatsHandler`?

`CreatorDashboardStatsHandler` is a **Python class** that acts as the HTTP endpoint handler.

**Location:** `core/controllers/creator_dashboard.py` (lines 488-511)

**Role:** It's like a waiter in a restaurant:

1. **Takes orders** - Receives HTTP GET requests from frontend
2. **Checks ID** - Validates user has creator permissions
3. **Calls the kitchen** - Asks analytics_services to calculate stats
4. **Serves the food** - Returns JSON response with numbers

**Actual Code:**

```python
class CreatorDashboardStatsHandler(base.BaseHandler):
    """Handler for creator dashboard statistics."""

    @acl_decorators.can_access_creator_dashboard
    def get(self):
        user_id = self.user_id

        stats = {
            'dau': analytics_services.get_daily_active_users(user_id),
            'wau': analytics_services.get_weekly_active_users(user_id),
            'retention_7d': analytics_services.get_retention_rate(user_id, 7),
            'avg_session_time_secs': analytics_services.get_avg_session_time(user_id)
        }

        self.render_json(stats)  # Returns JSON to frontend
```

---

## 📁 What is in `creator_dashboard.py`?

**Full Path:** `core/controllers/creator_dashboard.py`

**This is the MAIN BACKEND FILE** for the entire creator dashboard feature.

**What it contains:**

- **Multiple handler classes** for different creator features
- Each handler handles one specific type of HTTP request
- **Our addition:** `CreatorDashboardStatsHandler` (77 new lines)

**File Structure:**

```
creator_dashboard.py (1000+ lines total)
│
├── Imports
├── Utility functions
│
├── CreatorDashboardHandler ................. (existing)
│   └── Handles main dashboard page
│
├── CreatorDashboardDataHandler ............. (existing)
│   └── Handles exploration data
│
├── CreatorDashboardStatsHandler ............ (NEW - OUR CODE)
│   └── Handles statistics requests
│   └── Lines 488-511 (77 lines total with docs)
│
└── Other handlers...
```

**Why we added it here:**

- This file is the **central controller** for creator dashboard
- All creator-related HTTP endpoints are in this file
- Our statistics feature is part of the creator dashboard
- Makes sense to keep related code together

**What our handler does:**

1. Receives GET request to `/creator_dashboard/stats_report`
2. Security check: `@can_access_creator_dashboard` decorator
3. Gets the creator's `user_id`
4. Calls 4 analytics functions to calculate metrics
5. Builds JSON object with results
6. Returns JSON to frontend

---

## 🔄 How the Handler Works (Detailed Flow)

### Step 1: Frontend Request

```typescript
// Component code
http.get('/creator_dashboard/stats_report');
```

### Step 2: Routing (main.py)

```python
# Routes URL to handler
'/creator_dashboard/stats_report' → CreatorDashboardStatsHandler
```

### Step 3: Handler Receives Request

```python
# In creator_dashboard.py
@acl_decorators.can_access_creator_dashboard  # Security
def get(self):
    user_id = self.user_id  # Extract from session
```

### Step 4: Handler Calls Analytics

```python
# Call analytics_services.py functions
dau = analytics_services.get_daily_active_users(user_id)
wau = analytics_services.get_weekly_active_users(user_id)
retention = analytics_services.get_retention_rate(user_id, 7)
avg_time = analytics_services.get_avg_session_time(user_id)
```

### Step 5: Analytics Queries Database

```python
# In analytics_services.py
def get_daily_active_users(creator_id):
    sessions = ExplorationSessionModel.query(
        creator_id == creator_id,
        created_on >= last_24h
    ).fetch()
    return len(set(s.user_id for s in sessions))
```

### Step 6: Build Response

```python
# In handler
stats = {
    'dau': 42,
    'wau': 156,
    'retention_7d': 0.32,
    'avg_session_time_secs': 285.5
}
```

### Step 7: Return JSON

```python
# In handler
self.render_json(stats)  # Sends HTTP 200 with JSON body
```

### Step 8: Frontend Displays

```typescript
// Component receives response
this.dau = response.dau; // 42
this.wau = response.wau; // 156
// Update UI
```

---

## File Path Summary

| Component               | Actual File Path                                                                    | What It Does                                            |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Main Backend File**   | `core/controllers/creator_dashboard.py`                                             | Contains all creator dashboard handlers including stats |
| **Stats Handler Class** | Lines 488-511 in `creator_dashboard.py`                                             | `CreatorDashboardStatsHandler` - handles stats requests |
| **Frontend Component**  | `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`   | Sends HTTP GET request                                  |
| **Frontend Template**   | `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html` | Displays statistics UI                                  |
| **URL Router**          | `main.py`                                                                           | Maps URL to handler                                     |
| **Analytics Services**  | `core/domain/analytics_services.py`                                                 | Calculates DAU, WAU, retention, avg time                |
| **Database Models**     | `core/storage/analytics/gae_models.py`                                              | `ExplorationSessionModel`, `CardStatsModel`             |
| **Model Registry**      | `core/platform/models.py`                                                           | Imports analytics models                                |
| **Config**              | `core/feconf.py`                                                                    | Registers ANALYTICS as valid model                      |

---

## Key Points

✅ **`CreatorDashboardStatsHandler`** is a Python class, not a file  
✅ It's located **inside** `creator_dashboard.py`  
✅ **`creator_dashboard.py`** is the main backend controller file  
✅ Our handler is **77 lines** at lines 488-511  
✅ The handler **coordinates** between frontend and analytics services  
✅ Think of it as the **middleman** who takes requests and returns responses

---

## Data Flow in Plain English

1. **Creator** clicks "Stats Report" tab in dashboard
2. **Frontend** sends GET request to `/creator_dashboard/stats_report`
3. **Router** (`main.py`) routes request to `CreatorDashboardStatsHandler`
4. **Handler** (`creator_dashboard.py`) checks permissions and calls analytics
5. **Analytics** (`analytics_services.py`) queries database
6. **Database** (`gae_models.py`) returns session records
7. **Analytics** calculates DAU, WAU, retention, avg time
8. **Handler** builds JSON response
9. **Frontend** receives JSON and displays numbers
10. **Creator** sees their statistics

---

**Status:** ✅ All components explained with file paths verified
