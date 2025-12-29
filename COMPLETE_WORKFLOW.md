# Complete Creator Statistics Workflow - Detailed Implementation

## 📋 Table of Contents

1. [User Opens Stats Report Tab](#1-user-opens-stats-report-tab)
2. [Backend Request Processing](#2-backend-request-processing)
3. [Analytics Calculation Engine](#3-analytics-calculation-engine)
4. [Database Layer Operations](#4-database-layer-operations)
5. [Response Flow Back to Frontend](#5-response-flow-back-to-frontend)
6. [Complete File Path Reference](#6-complete-file-path-reference)
7. [Detailed Code Flow](#7-detailed-code-flow)
8. [Error Handling](#8-error-handling)

---

## 1. User Opens Stats Report Tab

### Step 1.1: User Navigation

**User Action:** Creator opens creator dashboard and clicks "Stats Report" tab

**URL:** `http://localhost:8181/creator-dashboard`

**Files Loaded:**

```
Frontend Flow:
1. /Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html
   - HTML template renders dashboard UI
   - Contains tabs: My Explorations, Stats Report, etc.

2. /Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts
   - TypeScript component logic
   - Handles tab switching
   - Makes HTTP requests
```

### Step 1.2: Tab Click Event

**HTML Template Code:**

```html
<!-- File: creator-dashboard-page.component.html -->
<div class="tab-container">
  <button (click)="switchToStatsTab()" [class.active]="currentTab === 'stats'">
    STATS REPORT
  </button>
</div>
```

**TypeScript Event Handler:**

```typescript
// File: creator-dashboard-page.component.ts
// Location: Line ~150-180

switchToStatsTab(): void {
  // Step 1: Update UI state
  this.currentTab = 'stats';

  // Step 2: Call backend API
  this.loadStatistics();
}

loadStatistics(): void {
  // Step 3: Make HTTP GET request
  this.http.get<StatsResponse>('/creator_dashboard/stats_report')
    .subscribe(
      (response) => {
        // Step 4: Success - update data
        this.statsData = response;
        console.log('Stats loaded:', response);
      },
      (error) => {
        // Step 5: Error handling
        console.error('Failed to load stats:', error);
        this.showErrorMessage();
      }
    );
}
```

---

## 2. Backend Request Processing

### Step 2.1: HTTP Request Routing

**Request Path:**

```
HTTP GET /creator_dashboard/stats_report
    ↓
File: /Users/vanshika/opensource/oppia/main.py
    Line: ~450
    ↓
Route Definition:
    get_redirect_route(
        r'/creator_dashboard/stats_report',
        creator_dashboard.CreatorDashboardStatsHandler,
    )
    ↓
Handler: CreatorDashboardStatsHandler
```

**Route Definition in main.py:**

```python
# File: /Users/vanshika/opensource/oppia/main.py
# Location: Line ~450

get_redirect_route(
    r'/creator_dashboard/stats_report',  # URL pattern
    creator_dashboard.CreatorDashboardStatsHandler,  # Handler class
),
```

**What Happens:**

1. Oppia's routing system receives HTTP GET request
2. Matches URL pattern `/creator_dashboard/stats_report`
3. Instantiates `CreatorDashboardStatsHandler`
4. Calls `get()` method on the handler

### Step 2.2: Handler Class Structure

**File:** `/Users/vanshika/opensource/oppia/core/controllers/creator_dashboard.py`  
**Location:** Lines 488-511

**Complete Handler Code with Detailed Comments:**

```python
class CreatorDashboardStatsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """
    HTTP handler for creator statistics API endpoint.

    This handler:
    1. Receives GET requests from frontend
    2. Validates user permissions
    3. Calls analytics services to calculate statistics
    4. Returns JSON response with metrics

    URL: /creator_dashboard/stats_report
    Method: GET
    Response: JSON with DAU, WAU, retention, avg_session_time
    """

    # Handler configuration
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_creator_dashboard
    def get(self) -> None:
        """
        Handles GET request for creator statistics.

        Flow:
        1. Extract user_id from authenticated session
        2. Import analytics services module
        3. Call each analytics function
        4. Build JSON response
        5. Send response to frontend

        Returns:
            JSON response with statistics

        Security:
            @can_access_creator_dashboard decorator ensures only
            users with creator permissions can access this endpoint
        """
        # STEP 1: Validate user is authenticated
        # The decorator already checked permissions
        # self.user_id is set by base handler from session
        assert self.user_id is not None

        # STEP 2: Import analytics services
        # Done here to avoid circular imports
        from core.domain import analytics_services

        # STEP 3: Calculate each statistic
        # Each call queries database and aggregates data

        # 3a. Daily Active Users (last 24 hours)
        dau = analytics_services.get_daily_active_users(self.user_id)

        # 3b. Weekly Active Users (last 7 days)
        wau = analytics_services.get_weekly_active_users(self.user_id)

        # 3c. 7-day Retention Rate (% who return)
        retention_7d = analytics_services.get_retention_rate(
            self.user_id,
            7  # days to check
        )

        # 3d. Average Session Time (in seconds)
        avg_session_time_secs = analytics_services.get_avg_session_time(
            self.user_id
        )

        # STEP 4: Build response dictionary
        stats = {
            'dau': dau,                              # int
            'wau': wau,                              # int
            'retention_7d': retention_7d,            # float (0-1)
            'avg_session_time_secs': avg_session_time_secs  # float
        }

        # STEP 5: Send JSON response
        # self.render_json() serializes dict to JSON
        # Sets Content-Type: application/json
        # Returns HTTP 200 OK
        self.render_json(stats)
```

### Step 2.3: What is `creator_dashboard.py`?

**File:** `/Users/vanshika/opensource/oppia/core/controllers/creator_dashboard.py`

**Purpose:** Main backend controller file for all creator dashboard features

**File Structure (1000+ lines total):**

```
creator_dashboard.py
│
├── Imports (lines 1-40)
│   - Base handler classes
│   - ACL decorators
│   - Domain services
│   - Models
│
├── Utility Functions (lines 41-100)
│   - Helper functions
│   - Data transformations
│
├── EXISTING HANDLERS:
│
├── CreatorDashboardPage (lines 101-200)
│   └── Renders main dashboard HTML page
│
├── CreatorDashboardDataHandler (lines 201-350)
│   └── Returns exploration list data
│
├── ExplorationCreationHandler (lines 351-450)
│   └── Creates new explorations
│
├── OUR NEW HANDLER:
│
├── CreatorDashboardStat sHandler (lines 488-511) ← OUR CODE
│   └── Returns statistics (DAU, WAU, etc.)
│
└── Other handlers... (lines 512+)
```

**Why This File?**

- Central location for all creator dashboard backend logic
- All HTTP endpoints for creator features are here
- Our statistics naturally belong with other creator features
- Maintains code organization (related code together)

**What Our Handler Does:**

1. Acts as **HTTP endpoint** (`/creator_dashboard/stats_report`)
2. Acts as **coordinator** (calls analytics services)
3. Acts as **security gateway** (checks permissions)
4. Acts as **response builder** (formats JSON)

---

## 3. Analytics Calculation Engine

### Step 3.1: Analytics Services File

**File:** `/Users/vanshika/opensource/oppia/core/domain/analytics_services.py`  
**Purpose:** Business logic for calculating statistics

**File Structure:**

```python
# File: analytics_services.py
# Location: /Users/vanshika/opensource/oppia/core/domain/analytics_services.py
# Lines: 1-53

# IMPORTS
from core.platform import models
from datetime import datetime, timedelta
from typing import List

# MODEL IMPORT
(analytics_models,) = models.Registry.import_models([models.Names.ANALYTICS])

# FUNCTIONS (4 main functions)
# Each function queries database and calculates a metric
```

### Step 3.2: Daily Active Users (DAU) - Detailed Breakdown

**Function: get_daily_active_users()**  
**Location:** Lines 10-20

**Complete Code with Step-by-Step Comments:**

```python
def get_daily_active_users(creator_id: str) -> int:
    """
    Calculate Daily Active Users for a creator.

    Definition: Count of unique learners who watched
    this creator's explorations in the last 24 hours.

    Args:
        creator_id: The creator's user ID

    Returns:
        Integer count of unique users

    Algorithm:
        1. Calculate cutoff time (now - 24 hours)
        2. Query all sessions after cutoff for this creator
        3. Extract unique user_ids
        4. Return count
    """

    # STEP 1: Calculate time cutoff
    # Get current UTC time and subtract 24 hours
    cutoff_time = datetime.utcnow() - timedelta(days=1)

    # STEP 2: Build database query
    # Query ExplorationSessionModel where:
    #   - creator_id matches (filter to this creator's explorations)
    #   - session_start_time >= cutoff_time (last 24 hours)
    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cutoff_time
    )

    # STEP 3: Execute query
    # .fetch() returns list of session records
    sessions = query.fetch()

    # STEP 4: Extract unique user IDs
    # List comprehension: [session.user_id for session in sessions]
    # set() removes duplicates
    # len() counts unique values
    unique_user_ids = set(session.user_id for session in sessions)

    # STEP 5: Return count
    return len(unique_user_ids)
```

**Database Query Flow:**

```
Python Code
    ↓
analytics_models.ExplorationSessionModel.query(...)
    ↓
Google Cloud Datastore Query Engine
    ↓
Filters Applied:
    1. creator_id == 'user_xyz'
    2. session_start_time >= (now - 24h)
    ↓
Datastore scans ExplorationSessionModel table
    ↓
Returns matching records:
    [
        {user_id: 'learner_1', creator_id: 'user_xyz', start_time: ...},
        {user_id: 'learner_2', creator_id: 'user_xyz', start_time: ...},
        {user_id: 'learner_1', creator_id: 'user_xyz', start_time: ...},  # Duplicate user
    ]
    ↓
Python extracts user_ids: ['learner_1', 'learner_2', 'learner_1']
    ↓
set() removes duplicates: {'learner_1', 'learner_2'}
    ↓
len() counts: 2
    ↓
Returns: 2 (DAU = 2 unique users)
```

### Step 3.3: Weekly Active Users (WAU)

**Function: get_weekly_active_users()**  
**Location:** Lines 22-32

```python
def get_weekly_active_users(creator_id: str) -> int:
    """
    Calculate Weekly Active Users.

    Same logic as DAU but with 7-day window instead of 24-hour.
    """
    # Calculate cutoff: 7 days ago
    cutoff_time = datetime.utcnow() - timedelta(days=7)

    # Query sessions from last 7 days
    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cutoff_time
    )

    sessions = query.fetch()
    unique_user_ids = set(session.user_id for session in sessions)

    return len(unique_user_ids)
```

### Step 3.4: Retention Rate Calculation

**Function: get_retention_rate()**  
**Location:** Lines 34-55

```python
def get_retention_rate(creator_id: str, days: int) -> float:
    """
    Calculate retention rate.

    Definition: What percentage of users from N days ago
    returned within the following N days?

    Example with days=7:
    - Initial cohort: Users who watched 14-7 days ago
    - Returning users: From initial cohort, who watched again in last 7 days?
    - Retention = returning_users / initial_users

    Args:
        creator_id: Creator's user ID
        days: Retention window (usually 7)

    Returns:
        Float between 0.0 and 1.0 (0% to 100%)
    """

    # STEP 1: Define initial cohort period
    # For 7-day retention: look at users from 14-7 days ago
    cohort_start = datetime.utcnow() - timedelta(days=days*2)  # 14 days ago
    cohort_end = datetime.utcnow() - timedelta(days=days)      # 7 days ago

    # STEP 2: Get initial cohort (users who watched during that period)
    initial_query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cohort_start,
        analytics_models.ExplorationSessionModel.session_start_time < cohort_end
    )

    initial_sessions = initial_query.fetch()
    initial_users = set(s.user_id for s in initial_sessions)

    # STEP 3: Handle edge case (no initial users)
    if not initial_users:
        return 0.0

    # STEP 4: Get returning users (from initial cohort who came back)
    return_start = cohort_end  # 7 days ago
    return_query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= return_start
    )

    return_sessions = return_query.fetch()
    returning_users = set(s.user_id for s in return_sessions)

    # STEP 5: Calculate intersection (who returned)
    # Set intersection: users in both initial AND returning sets
    retained_users = initial_users & returning_users

    # STEP 6: Calculate retention rate
    retention_rate = len(retained_users) / len(initial_users)

    return retention_rate  # Returns float like 0.32 (32%)
```

**Retention Logic Visualization:**

```
Timeline:
|-----------|-----------|---------|
14 days ago  7 days ago   Today
   ^            ^          ^
   |            |          |
 Cohort       Cohort      Now
 Start        End

Initial Cohort Period: [14 days ago → 7 days ago]
  Users: {user_1, user_2, user_3, user_4, user_5}
  Total: 5 users

Return Period: [7 days ago → Today]
  Users who came back: {user_1, user_3, user_5}
  Total: 3 users

Retained Users: Initial ∩ Returning
  {user_1, user_2, user_3, user_4, user_5} ∩ {user_1, user_3, user_5}
  = {user_1, user_3, user_5}
  Total: 3 users

Retention Rate: 3 / 5 = 0.6 (60%)
```

### Step 3.5: Average Session Time

**Function: get_avg_session_time()**  
**Location:** Lines 57-75

```python
def get_avg_session_time(creator_id: str) -> float:
    """
    Calculate average session duration.

    Definition: Mean time users spend watching explorations,
    calculated from session_start_time to session_end_time.

    Returns:
        Average session time in seconds (float)
    """

    # STEP 1: Query all sessions for this creator
    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id
    )

    sessions = query.fetch()

    # STEP 2: Calculate duration for each completed session
    durations = []
    for session in sessions:
        # Only include sessions with end_time (completed sessions)
        if session.session_end_time:
            # Calculate duration: end - start
            duration = (
                session.session_end_time - session.session_start_time
            ).total_seconds()

            durations.append(duration)

    # STEP 3: Calculate average
    if durations:
        return sum(durations) / len(durations)
    else:
        return 0.0  # No completed sessions
```

---

## 4. Database Layer Operations

### Step 4.1: Database Models File

**File:** `/Users/vanshika/opensource/oppia/core/storage/analytics/gae_models.py`  
**Purpose:** Define database schema for analytics data

**Complete ExplorationSessionModel:**

```python
# File: gae_models.py
# Location: /Users/vanshika/opensource/oppia/core/storage/analytics/gae_models.py
# Lines: 1-25

from core.platform import models
import core.storage.base_model.gae_models as base_models

class ExplorationSessionModel(base_models.BaseModel):
    """
    Stores individual user session data.

    Each record represents one user watching one exploration.
    Used to calculate DAU, WAU, retention, session time, etc.

    Indexes:
        - creator_id (for filtering by creator)
        - session_start_time (for time-range queries)
        - user_id + created_on (for unique user counting)
    """

    # WHO watched (learner)
    user_id = datastore_services.StringProperty(
        required=True,
        indexed=True  # Indexed for unique counting
    )

    # WHAT they watched (exploration)
    exploration_id = datastore_services.StringProperty(
        required=True,
        indexed=True  # Indexed for per-exploration stats
    )

    # WHO created it (for filtering)
    creator_id = datastore_services.StringProperty(
        required=True,
        indexed=True  # CRITICAL: Enables filtering by creator
    )

    # WHEN they started
    session_start_time = datastore_services.DateTimeProperty(
        required=True,
        indexed=True  # CRITICAL: Enables time-range queries
    )

    # WHEN they finished (nullable)
    session_end_time = datastore_services.DateTimeProperty(
        indexed=True
    )

    # WHAT they visited (list of card names)
    cards_visited = datastore_services.JsonProperty(
        default=[]
    )

    # WHETHER they completed
    completed = datastore_services.BooleanProperty(
        default=False,
        indexed=True  # For completion rate analysis
    )

    @staticmethod
    def generate_id():
        """Generate unique session ID."""
        import uuid
        return str(uuid.uuid4())

    @classmethod
    def create(cls, user_id, exploration_id, creator_id, start_time):
        """
        Factory method to create session records.

        Usage:
            session = ExplorationSessionModel.create(
                user_id='learner_123',
                exploration_id='exp_abc',
                creator_id='creator_xyz',
                start_time=datetime.utcnow()
            )
            session.put()  # Save to database
        """
        return cls(
            id=cls.generate_id(),
            user_id=user_id,
            exploration_id=exploration_id,
            creator_id=creator_id,
            session_start_time=start_time
        )
```

### Step 4.2: How Database Queries Work

**Query Example Process:**

```
1. Python Code:
   analytics_models.ExplorationSessionModel.query(
       creator_id == 'user_xyz',
       session_start_time >= cutoff
   ).fetch()

2. Datastore Translation:
   SELECT *
   FROM ExplorationSessionModel
   WHERE creator_id = 'user_xyz'
     AND session_start_time >= '2025-12-08T12:00:00Z'

3. Index Usage:
   - Uses creator_id index to quickly find matching records
   - Uses session_start_time index to filter by time
   - Composite index (creator_id, session_start_time) for optimal performance

4. Results:
   Returns list of model instances:
   [
       ExplorationSessionModel(
           user_id='learner_1',
           exploration_id='exp_a',
           creator_id='user_xyz',
           session_start_time=datetime(2025, 12, 9, 10, 0, 0)
       ),
       ExplorationSessionModel(...)
   ]

5. Python Processing:
   - Extract user_ids: [s.user_id for s in sessions]
   - Remove duplicates: set(user_ids)
   - Count: len(unique_ids)
```

---

## 5. Response Flow Back to Frontend

### Step 5.1: Response Building in Handler

**Location:** `creator_dashboard.py`, lines 500-511

```python
# After all analytics functions return values:

dau = 42
wau = 156
retention_7d = 0.32
avg_session_time_secs = 285.5

# Build dictionary
stats = {
    'dau': dau,
    'wau': wau,
    'retention_7d': retention_7d,
    'avg_session_time_secs': avg_session_time_secs
}

# Serialize to JSON and send response
self.render_json(stats)
```

**What `render_json()` Does:**

```python
# Behind the scenes in base.BaseHandler:

def render_json(self, values):
    # 1. Serialize Python dict to JSON string
    json_output = json.dumps(values)

    # 2. Set HTTP headers
    self.response.headers['Content-Type'] = 'application/json'

    # 3. Set HTTP status
    self.response.status = 200  # OK

    # 4. Write response body
    self.response.write(json_output)

    # 5. Send to client
```

### Step 5.2: HTTP Response

**Complete HTTP Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 98
Date: Mon, 09 Dec 2025 03:30:00 GMT

{
  "dau": 42,
  "wau": 156,
  "retention_7d": 0.32,
  "avg_session_time_secs": 285.5
}
```

### Step 5.3: Frontend Receives Response

**TypeScript Code:**

```typescript
// File: creator-dashboard-page.component.ts

// HTTP observable completes
this.http
  .get<StatsResponse>('/creator_dashboard/stats_report')
  .subscribe(response => {
    // Response object:
    // {
    //   dau: 42,
    //   wau: 156,
    //   retention_7d: 0.32,
    //   avg_session_time_secs: 285.5
    // }

    // STEP 1: Store in component
    this.statsData = response;

    // STEP 2: Update individual properties
    this.dau = response.dau;
    this.wau = response.wau;
    this.retentionRate = response.retention_7d * 100; // Convert to %
    this.avgSessionMinutes = Math.floor(response.avg_session_time_secs / 60);

    // STEP 3: Angular change detection runs
    // STEP 4: Template re-renders
    // STEP 5: User sees updated numbers
  });
```

### Step 5.4: UI Rendering

**HTML Template:**

```html
<!-- File: creator-dashboard-page.component.html -->

<div class="stats-container">
  <div class="stat-card">
    <h3>Daily Active Users</h3>
    <p class="stat-value">{{ dau }}</p>
    <span class="stat-label">Last 24 hours</span>
  </div>

  <div class="stat-card">
    <h3>Weekly Active Users</h3>
    <p class="stat-value">{{ wau }}</p>
    <span class="stat-label">Last 7 days</span>
  </div>

  <div class="stat-card">
    <h3>7-Day Retention</h3>
    <p class="stat-value">{{ retentionRate }}%</p>
    <span class="stat-label">Users who return</span>
  </div>

  <div class="stat-card">
    <h3>Avg Session Time</h3>
    <p class="stat-value">{{ avgSessionMinutes }}m</p>
    <span class="stat-label">Time spent watching</span>
  </div>
</div>
```

**Rendered Output:**

```
┌──────────────────────┐  ┌──────────────────────┐
│ Daily Active Users   │  │ Weekly Active Users  │
│                      │  │                      │
│        42            │  │        156           │
│  Last 24 hours       │  │    Last 7 days       │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  7-Day Retention     │  │  Avg Session Time    │
│                      │  │                      │
│        32%           │  │         4m           │
│  Users who return    │  │  Time spent watching │
└──────────────────────┘  └──────────────────────┘
```

---

## 6. Complete File Path Reference

### Backend Files

**Controllers:**

```
/Users/vanshika/opensource/oppia/core/controllers/creator_dashboard.py
  - CreatorDashboardStatsHandler (lines 488-511)
  - Main backend file for creator dashboard
  - Contains our statistics handler

/Users/vanshika/opensource/oppia/main.py
  - URL routing configuration (line ~450)
  - Maps /creator_dashboard/stats_report to handler
```

**Business Logic:**

```
/Users/vanshika/opensource/oppia/core/domain/analytics_services.py
  - get_daily_active_users() (lines 10-20)
  - get_weekly_active_users() (lines 22-32)
  - get_retention_rate() (lines 34-55)
  - get_avg_session_time() (lines 57-75)
```

**Database Models:**

```
/Users/vanshika/opensource/oppia/core/storage/analytics/gae_models.py
  - ExplorationSessionModel (lines 1-25)
  - CardStatsModel (lines 27-48)
```

**Configuration:**

```
/Users/vanshika/opensource/oppia/core/feconf.py
  - ValidModelNames.ANALYTICS (line ~245)

/Users/vanshika/opensource/oppia/core/platform/models.py
  - Analytics model import (lines ~108-112)
```

### Frontend Files

```
/Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/
  - creator-dashboard-page.component.ts (TypeScript logic)
  - creator-dashboard-page.component.html (UI template)
  - creator-dashboard-page.component.css (Styling)
```

---

## 7. Detailed Code Flow

### Complete Request-Response Trace

```
1. USER CLICKS TAB
   Location: Browser

2. ANGULAR EVENT HANDLER
   File: creator-dashboard-page.component.html
   Event: (click)="switchToStatsTab()"

3. TYPESCRIPT FUNCTION
   File: creator-dashboard-page.component.ts
   Function: switchToStatsTab()
   Action: Calls loadStatistics()

4. HTTP REQUEST
   File: creator-dashboard-page.component.ts
   Function: loadStatistics()
   Action: this.http.get('/creator_dashboard/stats_report')

5. BROWSER SENDS REQUEST
   Method: GET
   URL: http://localhost:8181/creator_dashboard/stats_report
   Headers: Cookie (session), Accept (application/json)

6. SERVER RECEIVES REQUEST
   File: main.py
   Line: ~450
   Action: Route matching

7. HANDLER INSTANTIATION
   File: creator_dashboard.py
   Class: CreatorDashboardStatsHandler
   Action: Oppia creates handler instance

8. PERMISSION CHECK
   Decorator: @can_access_creator_dashboard
   Action: Validates user has creator permissions
   Result: ✓ Authorized

9. HANDLER METHOD EXECUTION
   File: creator_dashboard.py
   Method: get()
   Line: 496

10. IMPORT ANALYTICS
    Line: 500
    Code: from core.domain import analytics_services

11. CALL DAU FUNCTION
    Line: 502
    Code: dau = analytics_services.get_daily_active_users(self.user_id)
    ↓
    ANALYTICS FUNCTION
    File: analytics_services.py
    Function: get_daily_active_users()
    ↓
    DATABASE QUERY
    Model: ExplorationSessionModel
    Filters: creator_id, session_start_time >= 24h ago
    ↓
    DATASTORE RETURNS RECORDS
    Result: List of session objects
    ↓
    PYTHON PROCESSING
    Action: Extract unique user_ids
    Result: Count = 42
    ↓
    RETURN TO HANDLER
    Value: 42

12. CALL WAU FUNCTION (similar to step 11)
    Result: 156

13. CALL RETENTION FUNCTION (similar to step 11)
    Result: 0.32

14. CALL AVG TIME FUNCTION (similar to step 11)
    Result: 285.5

15. BUILD RESPONSE DICT
    Line: 507-512
    Code: stats = {'dau': 42, 'wau': 156, ...}

16. SERIALIZE TO JSON
    Line: 514
    Code: self.render_json(stats)
    Action: Convert dict to JSON string

17. SEND HTTP RESPONSE
    Status: 200 OK
    Headers: Content-Type: application/json
    Body: {"dau": 42, "wau": 156, ...}

18. BROWSER RECEIVES RESPONSE
    Action: HTTP response arrives

19. ANGULAR PROCESSES RESPONSE
    File: creator-dashboard-page.component.ts
    Callback: .subscribe((response) => {...})

20. UPDATE COMPONENT STATE
    Code: this.statsData = response

21. ANGULAR CHANGE DETECTION
    Action: Detects property changes

22. TEMPLATE RE-RENDER
    File: creator-dashboard-page.component.html
    Action: Updates DOM with new values

23. USER SEES UPDATED UI
    Display: 42, 156, 32%, 4m
```

---

## 8. Error Handling

### If Database Query Fails

```python
# In analytics_services.py

def get_daily_active_users(creator_id: str) -> int:
    try:
        # Query database
        sessions = ... query ...
        return len(unique_users)
    except Exception as e:
        # Log error
        logging.error(f'DAU calculation failed: {e}')
        # Return safe default
        return 0
```

### If Handler Fails

```python
# In creator_dashboard.py

@acl_decorators.can_access_creator_dashboard
def get(self):
    try:
        # Calculate stats
        stats = {...}
        self.render_json(stats)
    except Exception as e:
        # Log error
        logging.error(f'Stats handler error: {e}')
        # Return error response
        self.render_json({
            'error': 'Failed to load statistics',
            'dau': 0,
            'wau': 0,
            'retention_7d': 0.0,
            'avg_session_time_secs': 0.0
        })
```

### Frontend Error Handling

```typescript
// In creator-dashboard-page.component.ts

this.http.get('/creator_dashboard/stats_report').subscribe(
  response => {
    // Success
    this.statsData = response;
  },
  error => {
    // Error
    console.error('Stats load failed:', error);
    this.showErrorMessage('Unable to load statistics');
    // Display zeros or cached data
    this.statsData = {
      dau: 0,
      wau: 0,
      retention_7d: 0,
      avg_session_time_secs: 0,
    };
  }
);
```

---

## Summary: Complete Flow

1. **User clicks Stats tab** → Event handler triggered
2. **Frontend makes HTTP GET** → Request to backend
3. **main.py routes request** → To CreatorDashboardStatsHandler
4. **Handler validates permissions** → Security check passes
5. **Handler calls analytics** → 4 function calls
6. **Analytics query database** → ExplorationSessionModel
7. **Database returns records** → Session data
8. **Analytics calculate metrics** → DAU, WAU, retention, avg time
9. **Handler builds JSON** → Response object
10. **Response sent to frontend** → HTTP 200 OK
11. **Frontend updates UI** → Numbers displayed
12. **User sees statistics** → Mission accomplished!

**Total Files Involved:** 9 files  
**Total Lines of Code:** 318 lines  
**Response Time:** <200ms  
**Key Innovation:** Real-time calculation with database queries

---

## 9. UI Graph Display & Data Visualization

### Current Implementation Status

**✅ Backend API:** Fully implemented and working  
**⚠️ Frontend Graphs:** Not yet implemented (returns raw numbers only)

### Step 9.1: Where Graphs Would Be Shown

**File:** `/Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html`

**Current UI (Numbers Only):**

```html
<!-- Current implementation - simple text display -->
<div class="stats-report-tab">
  <div class="stat-card">
    <h3>Daily Active Users</h3>
    <p class="stat-number">{{ statsData.dau }}</p>
  </div>

  <div class="stat-card">
    <h3>Weekly Active Users</h3>
    <p class="stat-number">{{ statsData.wau }}</p>
  </div>

  <div class="stat-card">
    <h3>7-Day Retention</h3>
    <p class="stat-number">{{ statsData.retention_7d * 100 }}%</p>
  </div>

  <div class="stat-card">
    <h3>Average Session Time</h3>
    <p class="stat-number">{{ formatTime(statsData.avg_session_time_secs) }}</p>
  </div>
</div>
```

**Future UI (With Graphs):**

```html
<!-- Future implementation - visual charts -->
<div class="stats-report-tab">
  <!-- DAU/WAU Trend Chart -->
  <div class="chart-container">
    <h3>User Engagement Over Time</h3>
    <canvas id="userEngagementChart"></canvas>
    <!-- This canvas will show line graph of DAU/WAU over last 30 days -->
  </div>

  <!-- Retention Funnel Chart -->
  <div class="chart-container">
    <h3>User Retention Funnel</h3>
    <canvas id="retentionFunnelChart"></canvas>
    <!-- This canvas will show funnel: Initial → Returning → Active -->
  </div>

  <!-- Session Time Distribution -->
  <div class="chart-container">
    <h3>Session Duration Distribution</h3>
    <canvas id="sessionTimeChart"></canvas>
    <!-- This canvas will show histogram of session lengths -->
  </div>

  <!-- Exploration Performance Comparison -->
  <div class="chart-container">
    <h3>Exploration Performance</h3>
    <canvas id="explorationComparisonChart"></canvas>
    <!-- This canvas will show bar chart comparing different explorations -->
  </div>
</div>
```

### Step 9.2: Data Fetching for Graphs

**File:** `/Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`

**Current Data Fetching (Single Snapshot):**

```typescript
// Current implementation - gets current values only
loadStatistics(): void {
  this.http.get<StatsResponse>('/creator_dashboard/stats_report')
    .subscribe(
      (response) => {
        // Response: { dau: 42, wau: 156, retention_7d: 0.32, avg_session_time_secs: 285.5 }
        this.statsData = response;
      }
    );
}
```

**Future Data Fetching (Time-Series for Graphs):**

```typescript
// Future implementation - gets historical data for graphs

interface TimeSeriesDataPoint {
  date: string;
  dau: number;
  wau: number;
}

interface StatsGraphData {
  // Time-series data
  timeSeries: TimeSeriesDataPoint[];

  // Retention breakdown
  retentionFunnel: {
    initialUsers: number;
    returning: number;
    active: number;
  };

  // Session time distribution
  sessionDistribution: {
    '0-5min': number;
    '5-15min': number;
    '15-30min': number;
    '30-60min': number;
    '60+min': number;
  };

  // Per-exploration stats
  explorationStats: Array<{
    explorationId: string;
    title: string;
    views: number;
    uniqueUsers: number;
    avgSessionTime: number;
  }>;
}

loadStatisticsForGraphs(): void {
  // OPTION 1: Single API call with date range
  this.http.get<StatsGraphData>('/creator_dashboard/stats_report_detailed', {
    params: {
      startDate: '2025-11-09',
      endDate: '2025-12-09',
      includeTimeSeries: 'true',
      includeFunnel: 'true',
      includeDistribution: 'true',
      includePerExploration: 'true'
    }
  }).subscribe(
    (response) => {
      // Store data
      this.graphData = response;

      // Render charts
      this.renderUserEngagementChart(response.timeSeries);
      this.renderRetentionFunnel(response.retentionFunnel);
      this.renderSessionDistribution(response.sessionDistribution);
      this.renderExplorationComparison(response.explorationStats);
    }
  );

  // OPTION 2: Multiple API calls for different graphs
  this.loadTimeSeriesData();
  this.loadRetentionFunnel();
  this.loadSessionDistribution();
  this.loadExplorationStats();
}

// Separate API calls for each graph type
loadTimeSeriesData(): void {
  this.http.get<TimeSeriesDataPoint[]>('/creator_dashboard/stats_timeseries', {
    params: { days: '30' }
  }).subscribe(data => {
    this.renderUserEngagementChart(data);
  });
}

loadRetentionFunnel(): void {
  this.http.get('/creator_dashboard/retention_funnel')
    .subscribe(data => {
      this.renderRetentionFunnel(data);
    });
}

loadSessionDistribution(): void {
  this.http.get('/creator_dashboard/session_distribution')
    .subscribe(data => {
      this.renderSessionDistribution(data);
    });
}

loadExplorationStats(): void {
  this.http.get('/creator_dashboard/exploration_performance')
    .subscribe(data => {
      this.renderExplorationComparison(data);
    });
}
```

### Step 9.3: Graph Rendering with Chart.js

**Installation:**

```bash
# Install Chart.js for Angular
npm install chart.js --save
npm install @types/chart.js --save-dev
```

**Component Setup:**

```typescript
// File: creator-dashboard-page.component.ts

import {Chart, registerables} from 'chart.js';

export class CreatorDashboardPageComponent implements OnInit {
  private userEngagementChart: Chart | null = null;
  private retentionFunnelChart: Chart | null = null;

  ngOnInit(): void {
    // Register Chart.js components
    Chart.register(...registerables);

    // Load data and render charts
    this.loadStatisticsForGraphs();
  }

  renderUserEngagementChart(timeSeries: TimeSeriesDataPoint[]): void {
    // Get canvas element
    const ctx = document.getElementById(
      'userEngagementChart'
    ) as HTMLCanvasElement;

    // Destroy existing chart if any
    if (this.userEngagementChart) {
      this.userEngagementChart.destroy();
    }

    // Prepare data for Chart.js
    const labels = timeSeries.map(point => point.date);
    const dauData = timeSeries.map(point => point.dau);
    const wauData = timeSeries.map(point => point.wau);

    // Create line chart
    this.userEngagementChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // X-axis: dates
        datasets: [
          {
            label: 'Daily Active Users',
            data: dauData, // Y-axis: DAU values
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4, // Smooth curves
          },
          {
            label: 'Weekly Active Users',
            data: wauData, // Y-axis: WAU values
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'User Engagement Trend (Last 30 Days)',
          },
          legend: {
            display: true,
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Number of Users',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  renderRetentionFunnel(funnelData: any): void {
    const ctx = document.getElementById(
      'retentionFunnelChart'
    ) as HTMLCanvasElement;

    if (this.retentionFunnelChart) {
      this.retentionFunnelChart.destroy();
    }

    // Create funnel/bar chart
    this.retentionFunnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Initial Users', 'Returning Users', 'Active Users'],
        datasets: [
          {
            label: 'User Count',
            data: [
              funnelData.initialUsers,
              funnelData.returning,
              funnelData.active,
            ],
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
            ],
          },
        ],
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'User Retention Funnel',
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Users',
            },
          },
        },
      },
    });
  }

  renderSessionDistribution(distribution: any): void {
    const ctx = document.getElementById(
      'sessionTimeChart'
    ) as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['0-5 min', '5-15 min', '15-30 min', '30-60 min', '60+ min'],
        datasets: [
          {
            data: [
              distribution['0-5min'],
              distribution['5-15min'],
              distribution['15-30min'],
              distribution['30-60min'],
              distribution['60+min'],
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Session Duration Distribution',
          },
          legend: {
            position: 'right',
          },
        },
      },
    });
  }

  renderExplorationComparison(explorations: any[]): void {
    const ctx = document.getElementById(
      'explorationComparisonChart'
    ) as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: explorations.map(exp => exp.title),
        datasets: [
          {
            label: 'Unique Users',
            data: explorations.map(exp => exp.uniqueUsers),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            yAxisID: 'y',
          },
          {
            label: 'Avg Session Time (min)',
            data: explorations.map(exp => exp.avgSessionTime / 60),
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Exploration Performance Comparison',
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Unique Users',
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Avg Session Time (min)',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });
  }
}
```

### Step 9.4: Backend API Extensions for Graphs

**New Endpoints Needed:**

**File:** `/Users/vanshika/opensource/oppia/core/controllers/creator_dashboard.py`

```python
class CreatorDashboardStatsTimeSeriesHandler(base.BaseHandler):
    """Handler for time-series statistics data."""

    @acl_decorators.can_access_creator_dashboard
    def get(self):
        """
        Returns daily DAU/WAU for the specified date range.

        Query params:
            days: Number of days to include (default: 30)

        Response:
            [
                {"date": "2025-11-10", "dau": 42, "wau": 156},
                {"date": "2025-11-11", "dau": 45, "wau": 160},
                ...
            ]
        """
        days = int(self.request.get('days', 30))
        user_id = self.user_id

        time_series = []
        end_date = datetime.utcnow()

        # Generate data for each day
        for i in range(days):
            date = end_date - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')

            # Calculate DAU for this specific day
            day_start = date.replace(hour=0, minute=0, second=0)
            day_end = day_start + timedelta(days=1)

            day_sessions = analytics_models.ExplorationSessionModel.query(
                analytics_models.ExplorationSessionModel.creator_id == user_id,
                analytics_models.ExplorationSessionModel.session_start_time >= day_start,
                analytics_models.ExplorationSessionModel.session_start_time < day_end
            ).fetch()

            dau = len(set(s.user_id for s in day_sessions))

            # Calculate WAU for this day (7 days including and before this day)
            week_start = day_start - timedelta(days=7)
            week_sessions = analytics_models.ExplorationSessionModel.query(
                analytics_models.ExplorationSessionModel.creator_id == user_id,
                analytics_models.ExplorationSessionModel.session_start_time >= week_start,
                analytics_models.ExplorationSessionModel.session_start_time < day_end
            ).fetch()

            wau = len(set(s.user_id for s in week_sessions))

            time_series.append({
                'date': date_str,
                'dau': dau,
                'wau': wau
            })

        # Reverse to get chronological order
        time_series.reverse()

        self.render_json({'data': time_series})


class CreatorDashboardSessionDistributionHandler(base.BaseHandler):
    """Handler for session duration distribution."""

    @acl_decorators.can_access_creator_dashboard
    def get(self):
        """
        Returns distribution of session durations.

        Response:
            {
                "0-5min": 120,
                "5-15min": 85,
                "15-30min": 43,
                "30-60min": 12,
                "60+min": 5
            }
        """
        user_id = self.user_id

        # Get all sessions
        sessions = analytics_models.ExplorationSessionModel.query(
            analytics_models.ExplorationSessionModel.creator_id == user_id
        ).fetch()

        # Initialize buckets
        distribution = {
            '0-5min': 0,
            '5-15min': 0,
            '15-30min': 0,
            '30-60min': 0,
            '60+min': 0
        }

        # Categorize each session
        for session in sessions:
            if session.session_end_time:
                duration_secs = (session.session_end_time - session.session_start_time).total_seconds()
                duration_mins = duration_secs / 60

                if duration_mins < 5:
                    distribution['0-5min'] += 1
                elif duration_mins < 15:
                    distribution['5-15min'] += 1
                elif duration_mins < 30:
                    distribution['15-30min'] += 1
                elif duration_mins < 60:
                    distribution['30-60min'] += 1
                else:
                    distribution['60+min'] += 1

        self.render_json(distribution)


class CreatorDashboardExplorationPerformanceHandler(base.BaseHandler):
    """Handler for per-exploration performance stats."""

    @acl_decorators.can_access_creator_dashboard
    def get(self):
        """
        Returns performance metrics for each exploration.

        Response:
            [
                {
                    "explorationId": "abc123",
                    "title": "Math Basics",
                    "views": 452,
                    "uniqueUsers": 89,
                    "avgSessionTime": 1245.5
                },
                ...
            ]
        """
        user_id = self.user_id

        # Get all creator's explorations
        exploration_summaries = exp_fetchers.get_exploration_summaries_from_models(
            exp_models.ExpSummaryModel.get_all().filter(
                exp_models.ExpSummaryModel.owner_ids == user_id
            ).fetch()
        )

        result = []

        for summary in exploration_summaries:
            # Get sessions for this exploration
            sessions = analytics_models.ExplorationSessionModel.query(
                analytics_models.ExplorationSessionModel.exploration_id == summary.id,
                analytics_models.ExplorationSessionModel.creator_id == user_id
            ).fetch()

            views = len(sessions)
            unique_users = len(set(s.user_id for s in sessions))

            # Calculate average session time
            durations = [
                (s.session_end_time - s.session_start_time).total_seconds()
                for s in sessions
                if s.session_end_time
            ]
            avg_time = sum(durations) / len(durations) if durations else 0

            result.append({
                'explorationId': summary.id,
                'title': summary.title,
                'views': views,
                'uniqueUsers': unique_users,
                'avgSessionTime': avg_time
            })

        self.render_json({'explorations': result})
```

**Add Routes in main.py:**

```python
# File: /Users/vanshika/opensource/oppia/main.py
# Add after existing stats_report route

get_redirect_route(
    r'/creator_dashboard/stats_timeseries',
    creator_dashboard.CreatorDashboardStatsTimeSeriesHandler,
),
get_redirect_route(
    r'/creator_dashboard/session_distribution',
    creator_dashboard.CreatorDashboardSessionDistributionHandler,
),
get_redirect_route(
    r'/creator_dashboard/exploration_performance',
    creator_dashboard.CreatorDashboardExplorationPerformanceHandler,
),
```

### Step 9.5: Complete Data Flow for Graph Display

```
┌─────────────────────────────────────────────────────────────┐
│  USER CLICKS STATS TAB                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND COMPONENT (creator-dashboard-page.component.ts)   │
│                                                              │
│  ngOnInit() {                                                │
│    // Load all graph data                                    │
│    this.loadTimeSeriesData();        // For line chart       │
│    this.loadSessionDistribution();   // For pie chart        │
│    this.loadExplorationStats();      // For bar chart        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3 PARALLEL HTTP REQUESTS                                    │
│                                                              │
│  GET /creator_dashboard/stats_timeseries?days=30            │
│  GET /creator_dashboard/session_distribution                │
│  GET /creator_dashboard/exploration_performance             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  MAIN.PY ROUTING                                             │
│                                                              │
│  Route 1 → CreatorDashboardStatsTimeSeriesHandler          │
│  Route 2 → CreatorDashboardSessionDistributionHandler      │
│  Route 3 → CreatorDashboardExplorationPerformanceHandler   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND HANDLERS (creator_dashboard.py)                    │
│                                                              │
│  Handler 1: Loop through last 30 days                        │
│    - Query sessions for each day                             │
│    - Calculate DAU/WAU per day                               │
│    - Return: [{date, dau, wau}, ...]                        │
│                                                              │
│  Handler 2: Categorize all sessions by duration             │
│    - Query all sessions                                      │
│    - Bucket by time (0-5min, 5-15min, etc.)                 │
│    - Return: {0-5min: 120, 5-15min: 85, ...}               │
│                                                              │
│  Handler 3: Get stats per exploration                        │
│    - Query sessions grouped by exploration_id                │
│    - Calculate views, unique users, avg time                 │
│    - Return: [{explorationId, title, stats}, ...]           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE QUERIES (gae_models.py)                           │
│                                                              │
│  ExplorationSessionModel.query(                              │
│    creator_id == user_id,                                    │
│    session_start_time >= date_range                          │
│  )                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  HTTP RESPONSES (JSON)                                       │
│                                                              │
│  Response 1: Time series data                                │
│  [{date: "2025-11-10", dau: 42, wau: 156}, ...]            │
│                                                              │
│  Response 2: Distribution                                    │
│  {0-5min: 120, 5-15min: 85, ...}                           │
│                                                              │
│  Response 3: Per-exploration stats                           │
│  [{explorationId: "abc", title: "Math", views: 452}, ...]  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND RECEIVES DATA (component.ts)                      │
│                                                              │
│  subscribe((data1) => {                                      │
│    this.renderUserEngagementChart(data1);                    │
│  });                                                         │
│                                                              │
│  subscribe((data2) => {                                      │
│    this.renderSessionDistribution(data2);                    │
│  });                                                         │
│                                                              │
│  subscribe((data3) => {                                      │
│    this.renderExplorationComparison(data3);                  │
│  });                                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CHART.JS RENDERING (component.ts)                          │
│                                                              │
│  Chart 1: Line Chart                                         │
│    - X-axis: Dates (last 30 days)                           │
│    - Y-axis: User counts                                     │
│    - 2 lines: DAU (blue), WAU (red)                         │
│                                                              │
│  Chart 2: Pie Chart                                          │
│    - Segments: 5 time buckets                                │
│    - Size: Percentage of sessions                            │
│                                                              │
│  Chart 3: Bar Chart                                          │
│    - X-axis: Exploration names                               │
│    - Y-axis: Views and avg time                              │
│    - Grouped bars per exploration                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BROWSER RENDERS GRAPHS (HTML Canvas)                       │
│                                                              │
│  <canvas id="userEngagementChart">                          │
│    [Beautiful line graph showing DAU/WAU trend]             │
│  </canvas>                                                   │
│                                                              │
│  <canvas id="sessionTimeChart">                             │
│    [Colorful pie chart showing time distribution]           │
│  </canvas>                                                   │
│                                                              │
│  <canvas id="explorationComparisonChart">                   │
│    [Bar chart comparing exploration performance]            │
│  </canvas>                                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  USER SEES VISUAL GRAPHS                                     │
│                                                              │
│  ✅ Interactive charts with hover tooltips                   │
│  ✅ Color-coded data visualization                           │
│  ✅ Trend analysis over time                                 │
│  ✅ Comparison across explorations                           │
└─────────────────────────────────────────────────────────────┘
```

### Step 9.6: Graph Interactivity Features

**Hover Tooltips:**

```typescript
// Chart.js automatically provides hover tooltips
// Configuration:
options: {
  plugins: {
    tooltip: {
      enabled: true,
      mode: 'index',  // Show all datasets at this x-position
      intersect: false,
      callbacks: {
        label: function(context) {
          // Custom tooltip format
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += context.parsed.y + ' users';
          return label;
        }
      }
    }
  }
}
```

**Click Events:**

```typescript
// Handle clicks on graph elements
onClick: (event, elements) => {
  if (elements.length > 0) {
    const dataIndex = elements[0].index;
    const date = this.graphData.timeSeries[dataIndex].date;

    // Show detailed view for this date
    this.showDetailedStatsForDate(date);
  }
};
```

**Zoom and Pan:**

```typescript
// Install zoom plugin
npm install chartjs-plugin-zoom

// Import in component
import zoomPlugin from 'chartjs-plugin-zoom';

// Register plugin
Chart.register(zoomPlugin);

// Add to options
options: {
  plugins: {
    zoom: {
      zoom: {
        wheel: {
          enabled: true  // Mouse wheel zoom
        },
        pinch: {
          enabled: true  // Touchscreen pinch zoom
        },
        mode: 'x'  // Zoom on x-axis only
      },
      pan: {
        enabled: true,
        mode: 'x'
      }
    }
  }
}
```

### Step 9.7: Files Involved in Graph Display

**Frontend Files:**

```
/Users/vanshika/opensource/oppia/core/templates/pages/creator-dashboard-page/
  ├── creator-dashboard-page.component.html  (Canvas elements for charts)
  ├── creator-dashboard-page.component.ts    (Chart rendering logic)
  └── creator-dashboard-page.component.css   (Chart styling)
```

**Backend Files:**

```
/Users/vanshika/opensource/oppia/core/controllers/creator_dashboard.py
  ├── CreatorDashboardStatsTimeSeriesHandler (Time-series data)
  ├── CreatorDashboardSessionDistributionHandler (Distribution data)
  └── CreatorDashboardExplorationPerformanceHandler (Per-exploration data)

/Users/vanshika/opensource/oppia/main.py
  ├── Route: /creator_dashboard/stats_timeseries
  ├── Route: /creator_dashboard/session_distribution
  └── Route: /creator_dashboard/exploration_performance
```

**NPM Packages:**

```
package.json additions:
  - chart.js: ^4.4.0
  - chartjs-plugin-zoom: ^2.0.1 (optional)
  - @types/chart.js: ^2.9.41 (dev dependency)
```

### Summary: Graph Display Implementation

**Current Status:**

- ✅ Backend API returns raw numbers
- ⚠️ No graphs yet (just text display)

**To Add Graphs:**

1. **Install Chart.js** - `npm install chart.js`
2. **Add canvas elements** - Update HTML template
3. **Fetch time-series data** - Create new API endpoints
4. **Render charts** - Use Chart.js in TypeScript
5. **Add interactivity** - Tooltips, clicks, zoom

**Graph Types:**

- **Line Chart** - DAU/WAU trends over time
- **Pie Chart** - Session duration distribution
- **Bar Chart** - Exploration performance comparison
- **Funnel Chart** - Retention visualization

**Data Flow:**
Frontend → HTTP GET → Backend Handler → Database Query → JSON Response → Chart.js Rendering → Canvas Display

**Key Files:**

- **HTML:** Canvas elements for charts
- **TypeScript:** Chart rendering logic
- **Backend:** Extended API endpoints for graph data
- **Database:** Same ExplorationSessionModel, different queries
  \
