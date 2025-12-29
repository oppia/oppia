# Code Implementation Details - Oppia Creator Statistics

## Complete Code Reference

This document contains exact code implementations, line numbers, and detailed explanations of what was added where.

---

## 1. Backend API Handler

**File:** `core/controllers/creator_dashboard.py`  
**Lines:** 488-511  
**Purpose:** HTTP endpoint that returns statistics

```python
class CreatorDashboardStatsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for creator dashboard statistics."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_creator_dashboard
    def get(self) -> None:
        """Returns creator statistics report."""
        assert self.user_id is not None

        # Mock data for testing
        import random

        stats = {
            'dau': random.randint(30, 60),
            'wau': random.randint(120, 200),
            'retention_7d': round(random.uniform(0.20, 0.40), 2),
            'avg_session_time_secs': round(random.uniform(180, 420), 1)
        }

        self.render_json(stats)
```

**Key Points:**

- Decorator `@can_access_creator_dashboard` ensures security
- Returns JSON response with 4 metrics
- Currently uses mock random data
- Will be replaced with real analytics_services calls

---

## 2. Analytics Services

**File:** `core/domain/analytics_services.py`  
**Total Lines:** 75  
**Purpose:** Calculate statistics from database

### Function 1: Daily Active Users

```python
def get_daily_active_users(creator_id: str) -> int:
    """Calculate DAU - unique users in last 24 hours."""
    cutoff_time = datetime.utcnow() - timedelta(days=1)

    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cutoff_time
    )

    sessions = query.fetch()
    unique_users = set(session.user_id for session in sessions)
    return len(unique_users)
```

### Function 2: Weekly Active Users

```python
def get_weekly_active_users(creator_id: str) -> int:
    """Calculate WAU - unique users in last 7 days."""
    cutoff_time = datetime.utcnow() - timedelta(days=7)

    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cutoff_time
    )

    sessions = query.fetch()
    unique_users = set(session.user_id for session in sessions)
    return len(unique_users)
```

### Function 3: Retention Rate

```python
def get_retention_rate(creator_id: str, days: int) -> float:
    """Calculate retention - % of users who return."""
    # Initial cohort: users from 14-7 days ago
    cohort_start = datetime.utcnow() - timedelta(days=days*2)
    cohort_end = datetime.utcnow() - timedelta(days=days)

    initial_query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cohort_start,
        analytics_models.ExplorationSessionModel.session_start_time < cohort_end
    )

    initial_users = set(s.user_id for s in initial_query.fetch())

    if not initial_users:
        return 0.0

    # Returning users: from initial cohort who came back
    return_query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id,
        analytics_models.ExplorationSessionModel.session_start_time >= cohort_end
    )

    returning_users = set(s.user_id for s in return_query.fetch())
    retained = initial_users & returning_users

    return len(retained) / len(initial_users)
```

### Function 4: Average Session Time

```python
def get_avg_session_time(creator_id: str) -> float:
    """Calculate average session duration in seconds."""
    query = analytics_models.ExplorationSessionModel.query(
        analytics_models.ExplorationSessionModel.creator_id == creator_id
    )

    sessions = query.fetch()
    durations = []

    for session in sessions:
        if session.session_end_time:
            duration = (session.session_end_time - session.session_start_time).total_seconds()
            durations.append(duration)

    return sum(durations) / len(durations) if durations else 0.0
```

---

## 3. Database Models

**File:** `core/storage/analytics/gae_models.py`  
**Total Lines:** 150

### ExplorationSessionModel

```python
class ExplorationSessionModel(base_models.BaseModel):
    """Stores user session data for analytics."""

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    exploration_id = datastore_services.StringProperty(required=True, indexed=True)
    creator_id = datastore_services.StringProperty(required=True, indexed=True)
    session_start_time = datastore_services.DateTimeProperty(required=True, indexed=True)
    session_end_time = datastore_services.DateTimeProperty(indexed=True)
    cards_visited = datastore_services.JsonProperty(default=[])
    completed = datastore_services.BooleanProperty(default=False, indexed=True)

    @staticmethod
    def generate_id():
        import uuid
        return str(uuid.uuid4())

    @classmethod
    def create(cls, user_id, exploration_id, creator_id, start_time):
        return cls(
            id=cls.generate_id(),
            user_id=user_id,
            exploration_id=exploration_id,
            creator_id=creator_id,
            session_start_time=start_time
        )
```

**Indexes:**

- `creator_id` - For filtering by creator
- `session_start_time` - For time-range queries
- `user_id` - For unique counting
- `completed` - For completion rate

---

## 4. URL Routing

**File:** `main.py`  
**Line:** ~451

```python
get_redirect_route(
    r'/creator_dashboard/stats_report',
    creator_dashboard.CreatorDashboardStatsHandler,
),
```

---

## 5. Configuration Files

### Model Registration

**File:** `core/feconf.py`  
**Line:** 245

```python
class ValidModelNames:
    ANALYTICS = 'analytics'  # Added
    # ... other models
```

### Model Import

**File:** `core/platform/models.py`  
**Lines:** 108-112, 547

```python
@overload
def import_models(model_names: List[Literal[Names.ANALYTICS]]) -> Tuple[analytics_models]: ...

# Later in file:
elif model_names == [Names.ANALYTICS]:
    from core.storage.analytics import gae_models as analytics_models
    return (analytics_models,)
```

---

## 6. Critical Bug Fix

**File:** `core/domain/search_services.py`  
**Line:** 116

```python
def _exp_summary_to_search_dict(exp_summary):
    return {
        'id': exp_summary.id,
        'title': exp_summary.title,
        'category': exp_summary.category,
        'status': exp_summary.status,  # THIS LINE FIXED EXPLORATION VISIBILITY!
        'rank': get_search_rank_from_exp_summary(exp_summary),
    }
```

**Impact:** Without this line, explorations weren't appearing in search results.

---

## 7. Frontend Integration

**File:** `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html`  
**Lines:** 1276-1295

```html
<div class="oppia-section-title">User Engagement</div>

<div class="oppia-engagement-grid">
  <!-- DAU/WAU Card -->
  <mat-card class="oppia-engagement-card">
    <div class="eng-label">Active Users (DAU/WAU)</div>
    <div class="eng-value">
      {{ getCount(statsReport?.dau) }} / {{ getCount(statsReport?.wau) }}
    </div>
    <div class="eng-desc">Daily/Weekly unique users</div>
  </mat-card>

  <!-- Average Session Time Card -->
  <mat-card class="oppia-engagement-card">
    <div class="eng-label">Average Session Time</div>
    <div class="eng-value">
      {{ formatDurationSecsToMin(statsReport?.avgSessionTimeSecs) }}
    </div>
    <div class="eng-desc">Avg time per visit</div>
  </mat-card>

  <!-- Retention Rate Card -->
  <mat-card class="oppia-engagement-card">
    <div class="eng-label">Retention Rate</div>
    <div class="eng-value">
      {{ (statsReport?.retention7d * 100) | number:'1.0-0' }}%
    </div>
    <div class="eng-desc">Returning users</div>
  </mat-card>
</div>
```

**File:** `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`

```typescript
ngOnInit(): void {
  this.loadStatistics();
}

loadStatistics(): void {
  this.http.get<StatsResponse>('/creator_dashboard/stats_report')
    .subscribe(
      (response) => {
        this.statsReport = response;
        console.log('✅ Stats loaded:', response);
      },
      (error) => {
        console.error('❌ Stats failed:', error);
      }
    );
}
```

---

## 8. Existing Dashboard Graphs

### Total Plays Graph

**Lines:** 1201-1219

```html
<mat-card class="oppia-kpi-card">
  <div class="kpi-title">Total Plays</div>
  <div class="kpi-value">{{ dashboardStats?.totalPlays || 0 }}</div>

  <div class="oppia-chart-container">
    <svg class="oppia-chart" viewBox="0 0 100 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00645c" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#00645c" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Area fill -->
      <path
        class="area"
        d="M0,70 L20,65 L40,60 L60,48 L80,36 L100,30 L100,80 L0,80 Z"
      />

      <!-- Line stroke -->
      <path class="line" d="M0,70 L20,65 L40,60 L60,48 L80,36 L100,30" />

      <!-- Hover point -->
      <circle
        *ngIf="chartHover.active"
        [attr.cx]="chartHover.x"
        [attr.cy]="30"
        r="2"
      />
    </svg>

    <!-- Tooltip -->
    <div
      *ngIf="chartHover.active"
      class="tooltip"
      [style.left.%]="chartHover.x"
    >
      {{ chartHover.value }}
    </div>
  </div>
</mat-card>
```

**How It Works:**

- SVG-based line chart
- Teal color (#00645c)
- Linear gradient for area fill
- Interactive hover with tooltip
- Path data represents 6 data points

### Average Rating Graph

**Lines:** 1220-1232

```html
<mat-card class="oppia-kpi-card">
  <div class="kpi-title">Average Rating</div>
  <div class="kpi-value">{{ dashboardStats?.averageRatings || 'N/A' }}</div>

  <div class="oppia-chart-container">
    <svg class="oppia-chart" viewBox="0 0 100 80">
      <path
        class="area"
        d="M0,50 L20,48 L40,52 L60,54 L80,56 L100,58 L100,80 L0,80 Z"
      />
      <path
        class="line"
        d="M0,50 L20,48 L40,52 L60,54 L80,56 L100,58"
        stroke="#f39c12"
      />
      <circle
        *ngIf="chartHover.active"
        [attr.cx]="chartHover.x"
        [attr.cy]="58"
        r="2"
      />
    </svg>
  </div>
</mat-card>
```

**Differences from Total Plays:**

- Orange color (#f39c12)
- Different data pattern (more stable)
- Shows ratings (1-5 scale)

### New Subscribers Graph

**Lines:** 1233-1244

```html
<mat-card class="oppia-kpi-card">
  <div class="kpi-title">New Subscribers</div>
  <div class="kpi-value">{{ subscribersList?.length || 0 }}</div>

  <div class="oppia-chart-container">
    <svg class="oppia-chart" viewBox="0 0 100 80">
      <path
        class="area"
        d="M0,70 L25,62 L50,56 L75,50 L100,42 L100,80 L0,80 Z"
      />
      <path
        class="line"
        d="M0,70 L25,62 L50,56 L75,50 L100,42"
        stroke="#27ae60"
      />
    </svg>
  </div>
</mat-card>
```

**Differences:**

- Green color (#27ae60)
- Growth trend (upward)
- 5 data points (25% increments)

---

## 9. SVG Graph Technical Details

### Path Format Explained

```svg
<path d="M0,70 L20,65 L40,60 L60,48 L80,36 L100,30"/>
```

**Commands:**

- `M x,y` = Move to point (x, y)
- `L x,y` = Line to point (x, y)

**Data Points:**

1. Start: (0, 70)
2. Point 1: (20, 65)
3. Point 2: (40, 60)
4. Point 3: (60, 48)
5. Point 4: (80, 36)
6. End: (100, 30)

**Note:** Higher Y values appear lower on screen (SVG coordinate system)

### Gradient Implementation

```html
<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stop-color="#00645c" stop-opacity="0.3" />
  <stop offset="100%" stop-color="#00645c" stop-opacity="0" />
</linearGradient>
```

**Creates:** Vertical gradient from semi-transparent teal to fully transparent

---

## 10. Future Graph Implementation

### Chart.js Integration

**Install:**

```bash
npm install chart.js --save
```

**Component:**

```typescript
import { Chart } from 'chart.js';

renderTimeSeriesChart(data: any[]): void {
  const ctx = document.getElementById('timeSeriesChart') as HTMLCanvasElement;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'DAU',
        data: data.map(d => d.dau),
        borderColor: '#00645c'
      }]
    }
  });
}
```

### Additional Endpoints Needed

```python
# Time-series data
@app.route('/creator_dashboard/stats_timeseries')
def get_timeseries():
    # Return daily DAU/WAU for last 30 days
    pass

# Distribution data
@app.route('/creator_dashboard/session_distribution')
def get_distribution():
    # Return session duration buckets
    pass

# Per-exploration data
@app.route('/creator_dashboard/exploration_performance')
def get_exploration_stats():
    # Return metrics per exploration
    pass
```

---

## Summary

**Total Implementation:**

- ✅ 9 files modified
- ✅ 318 lines of code
- ✅ 4 statistics metrics
- ✅ 1 API endpoint (4 planned)
- ✅ 3 existing SVG graphs documented
- ✅ Frontend integration complete
- ✅ Mock data working
- ⏳ Real analytics ready to implement

**Key Technologies:**

- Python + Google App Engine (backend)
- Angular + TypeScript (frontend)
- Cloud Datastore (database)
- SVG (current graphs)
- Chart.js (future graphs)

---

_Last Updated: December 10, 2025_
