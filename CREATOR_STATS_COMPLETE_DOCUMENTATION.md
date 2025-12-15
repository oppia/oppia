# Creator Stats Dashboard - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Complete Flow Diagrams](#complete-flow-diagrams)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [User Interaction Flows](#user-interaction-flows)
6. [API Endpoints](#api-endpoints)
7. [Data Models](#data-models)

---

## Project Overview

The Creator Stats Dashboard is a comprehensive analytics system for content creators in Oppia. It provides detailed insights into exploration performance, learner engagement, completion rates, and feedback metrics.

### Key Features
- **Real-time Analytics**: View total plays, ratings, feedback, and subscribers
- **Detailed Stats Report**: Modal with comprehensive metrics and visualizations
- **CSV Export**: Download complete stats for offline analysis
- **Engagement Trends**: Weekly trend analysis with interactive charts
- **Performance Metrics**: Exploration-level performance tracking

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  (Angular Components - Frontend)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ANGULAR SERVICES                            │
│  (API Services, Data Models)                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP REQUESTS                               │
│  (REST API Calls)                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND                                │
│  (Controllers, Services, Data Processing)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  (Datastore, Stats Storage)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Flow Diagrams

### Flow 1: Viewing Creator Dashboard (Initial Load)

```
USER NAVIGATES TO /creator-dashboard
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: main.py (Line ~450)                                      │
│ ROUTE: /creator-dashboard → CreatorDashboardPage              │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page-root.component.ts                │
│ ACTION: Angular router loads root component                    │
│ CODE: Initializes the creator dashboard page                   │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page.component.ts                     │
│ METHOD: ngOnInit() (Line 229)                                  │
│ ACTION:                                                         │
│   1. Shows loading screen                                       │
│   2. Calls userService.getUserInfoAsync()                       │
│   3. Calls creatorDashboardBackendApiService                    │
│      .fetchDashboardDataAsync()                                 │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-backend-api.service.ts                │
│ METHOD: fetchDashboardDataAsync() (Line 202)                   │
│ ACTION: Makes HTTP GET to /creatordashboardhandler/data        │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: core/controllers/creator_dashboard.py                   │
│ CLASS: CreatorDashboardHandler                                 │
│ METHOD: get() (Line 133)                                        │
│ ACTION:                                                         │
│   1. Gets user_id from session                                  │
│   2. Fetches exploration summaries                              │
│   3. Fetches collection summaries                               │
│   4. Calculates dashboard stats (plays, ratings, feedback)      │
│   5. Calculates completion rate                                 │
│   6. Gets subscriber list                                        │
│   7. Returns JSON response                                       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSES DATA:                                        │
│                                                                 │
│ 1. user_services.get_dashboard_stats(user_id)                  │
│    - Aggregates num_ratings, average_ratings, total_plays      │
│                                                                 │
│ 2. feedback_services.get_thread_analytics_multi()              │
│    - Counts open feedback threads                              │
│                                                                 │
│ 3. stats_services.get_exploration_stats()                      │
│    - Gets num_starts, num_completions for each exploration     │
│                                                                 │
│ 4. Calculates: completion_rate = (completions/starts) * 100    │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ RESPONSE RETURNS TO FRONTEND                                   │
│ DATA STRUCTURE:                                                 │
│ {                                                               │
│   explorations_list: [...],                                     │
│   dashboard_stats: {                                            │
│     num_ratings: 150,                                           │
│     average_ratings: 4.5,                                       │
│     total_plays: 5000,                                          │
│     total_open_feedback: 12                                     │
│   },                                                            │
│   creator_completion_rate: 68.5,                                │
│   subscribers_list: [...]                                       │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page.component.ts                     │
│ METHOD: ngOnInit() callback (Line 239)                         │
│ ACTION:                                                         │
│   1. Stores data in component properties                        │
│   2. Sets activeTab = 'myExplorations'                          │
│   3. Hides loading screen                                       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page.component.html                   │
│ RENDERS UI:                                                     │
│   - Stats cards (Lines 12-77): Shows aggregated metrics        │
│   - View Stats Report button (Line 79)                         │
│   - Download CSV button (Line 82)                              │
│   - Exploration list (Lines 137-367)                           │
└────────────────────────────────────────────────────────────────┘
```

### Flow 2: Clicking "View Stats Report" Button

```
USER CLICKS "View Stats Report" BUTTON
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page.component.html (Line 79)         │
│ ELEMENT: <button (click)="openStatsReportModal()">            │
│ EVENT: Click event triggered                                   │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-page.component.ts                     │
│ METHOD: openStatsReportModal() (Line 357)                      │
│ ACTION:                                                         │
│   1. Calls ngbModal.open(CreatorStatsReportModalComponent)     │
│   2. Sets modal configuration:                                  │
│      - backdrop: true (click outside to close)                 │
│      - windowClass: 'creator-stats-modal'                      │
│      - size: 'xl' (extra large)                                │
│   3. Passes data to modal:                                      │
│      - dashboardStats                                           │
│      - creatorCompletionRate                                    │
│      - subscribersCount                                         │
│      - explorationsList                                         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-report-modal.component.ts                 │
│ METHOD: ngOnInit() (Initializes modal)                         │
│ ACTION:                                                         │
│   1. Receives input data from parent component                  │
│   2. Initializes component properties                           │
│   3. Sets up any required subscriptions                         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-report-modal.component.html               │
│ RENDERS MODAL:                                                  │
│   - Modal header with title                                     │
│   - Stats summary section                                       │
│   - Exploration list with metrics                              │
│   - Close button                                                │
└────────────────────────────────────────────────────────────────┘
         ↓
MODAL DISPLAYED TO USER
```

### Flow 3: Navigating to Creator Stats Page (/creator-stats)

```
USER CLICKS LINK OR NAVIGATES TO /creator-stats
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: main.py                                                  │
│ ROUTE: /creator-stats → CreatorStatsPage                      │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page-root.component.ts                    │
│ ACTION: Angular router loads root component                    │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: ngOnInit() (Line 97)                                   │
│ ACTION:                                                         │
│   1. Sets loading = true                                        │
│   2. Calls backendApi.fetchCreatorStatsReportAsync()           │
│   3. Calls backendApi.fetchDashboardDataAsync()                │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-dashboard-backend-api.service.ts                │
│ METHOD: fetchCreatorStatsReportAsync() (Line 206)              │
│ ACTION: Makes HTTP GET to /creatorstatsreport                  │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: core/controllers/creator_dashboard.py                   │
│ CLASS: CreatorStatsReportHandler (Line 395)                   │
│ METHOD: get() (Line 405)                                        │
│ ACTION:                                                         │
│   1. Gets user_id from session                                  │
│   2. Fetches exploration summaries                              │
│   3. Gets dashboard stats                                       │
│   4. Gets weekly_stats (last 12 weeks)                         │
│   5. Calculates completion rates per exploration               │
│   6. Returns comprehensive JSON with:                           │
│      - summary (aggregated stats + weekly_series)              │
│      - explorations (detailed per-exploration metrics)         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ BACKEND DETAILED PROCESSING:                                   │
│                                                                 │
│ 1. user_services.get_weekly_dashboard_stats(user_id)           │
│    - Returns array of weekly data for last 12 weeks            │
│    - Each week contains: date, num_ratings, avg_ratings,       │
│      total_plays                                                │
│                                                                 │
│ 2. For each exploration:                                        │
│    a. exp_fetchers.get_exploration_by_id(exp_id)               │
│    b. stats_services.get_exploration_stats(exp_id, version)    │
│    c. Calculate: completion_rate = (completions/starts)*100    │
│    d. Get average_rating from ratings dict                     │
│                                                                 │
│ 3. subscription_services.get_all_subscribers_of_creator()      │
│    - Counts total subscribers                                   │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ RESPONSE DATA STRUCTURE:                                       │
│ {                                                               │
│   summary: {                                                    │
│     num_ratings: 150,                                           │
│     average_ratings: 4.5,                                       │
│     total_plays: 5000,                                          │
│     total_open_feedback: 12,                                    │
│     total_subscribers: 45,                                      │
│     creator_completion_rate: 68.5,                              │
│     weekly_series: [                                            │
│       {date: "2024-W01", num_ratings: 12, total_plays: 450},   │
│       {date: "2024-W02", num_ratings: 15, total_plays: 520},   │
│       ... (12 weeks total)                                      │
│     ]                                                           │
│   },                                                            │
│   explorations: [                                               │
│     {                                                           │
│       id: "exp123",                                             │
│       title: "Introduction to Fractions",                       │
│       plays: 1200,                                              │
│       num_starts: 800,                                          │
│       num_completions: 576,                                     │
│       completion_rate: 72.0,                                    │
│       average_rating: 4.8,                                      │
│       num_open_threads: 3,                                      │
│       last_updated_msec: 1702345678000                          │
│     },                                                          │
│     ...                                                         │
│   ]                                                             │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: ngOnInit() callback (Line 100-118)                     │
│ ACTION:                                                         │
│   1. Stores reportSummary and reportExplorations               │
│   2. Calculates totalStarts and totalCompletions               │
│   3. Calculates successRate                                     │
│   4. Calls applySort() to sort explorations                    │
│   5. Calls computeVisuals() to generate charts                 │
│   6. Fetches ratings breakdown                                  │
│   7. Fetches recent comments                                    │
│   8. Sets loading = false                                       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: computeVisuals() (Line 202)                            │
│ ACTION:                                                         │
│   1. Extracts weekly data based on weeklyWindow (4/8/12)       │
│   2. Calls computeChartsFromWeekly()                           │
│   3. Calculates outcomes distribution (completion buckets)     │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: computeChartsFromWeekly() (Line 358)                   │
│ ACTION:                                                         │
│   1. Generates topExplorationBars (top 10 by plays)            │
│   2. Creates histogram buckets for play distribution           │
│   3. Calculates trendPoints for line chart:                    │
│      - Maps weekly data to SVG coordinates                     │
│      - Formats labels (W1, W2 for 12-week view)                │
│      - Generates polyline points string                        │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.html                       │
│ RENDERS COMPLETE UI:                                           │
│                                                                 │
│ 1. SIDEBAR (Lines 3-34):                                       │
│    - Sections navigation (Analytics, Posts, Financials)        │
│    - Search input                                               │
│    - Filter dropdown                                            │
│    - Trend window selector                                      │
│                                                                 │
│ 2. MAIN CONTENT AREA (Lines 36-290):                           │
│                                                                 │
│    a. FILTER CONTROLS (Lines 38-56):                           │
│       - Date Range dropdown (4/8/12 weeks)                     │
│       - Exploration selector                                    │
│                                                                 │
│    b. METRIC CARDS (Lines 57-95):                              │
│       - Total Views                                             │
│       - Total Enrollments                                       │
│       - Completion Rate                                         │
│       - Average Rating                                          │
│       - Avg Time Spent                                          │
│       - Active Learners                                         │
│                                                                 │
│    c. EXPLORATIONS TABLE (Lines 98-157):                       │
│       - Sort controls (by plays, rating, threads, etc.)        │
│       - Paginated table with exploration details               │
│       - Pagination controls                                     │
│                                                                 │
│    d. VISUALIZATIONS (Lines 159-197):                          │
│       - Top Explorations by Plays (bar chart)                  │
│       - Exploration Engagement Trends (line chart with         │
│         rotated labels)                                         │
│       - Success Rate and Avg Score cards                       │
│                                                                 │
│    e. LEARNING OUTCOMES (Lines 198-208):                       │
│       - Distribution histogram (0-20%, 21-40%, etc.)           │
│                                                                 │
│    f. EXPLORATION PERFORMANCE (Lines 210-225):                 │
│       - Detailed cards for each exploration                    │
│       - Views, Enrollments, Completion, Feedback               │
│                                                                 │
│    g. ADDITIONAL INSIGHTS (Lines 227-288):                     │
│       - Content Effectiveness breakdown                         │
│       - Ratings & Feedback section                             │
│       - Key Insights summary                                    │
└────────────────────────────────────────────────────────────────┘
         ↓
PAGE FULLY RENDERED AND INTERACTIVE
```

### Flow 4: Changing Weekly Window (User Interaction)

```
USER SELECTS "Last 12 weeks" FROM DROPDOWN
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.html (Line 42)             │
│ ELEMENT: <select [(ngModel)]="weeklyWindow"                   │
│          (ngModelChange)="computeVisuals()">                   │
│ EVENT: ngModelChange triggered                                 │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ PROPERTY: weeklyWindow = 12 (updated by ngModel)              │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: computeVisuals() (Line 202)                            │
│ ACTION:                                                         │
│   1. Gets weekly data: weekly_series.slice(-12)                │
│   2. Calls computeChartsFromWeekly() with 12 weeks of data     │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: computeChartsFromWeekly() (Line 358)                   │
│ ACTION:                                                         │
│   1. Creates series array with 12 data points                  │
│   2. Since weeklyWindow > 8, formats labels as "W1"-"W12"      │
│   3. Calculates SVG coordinates for 12 points                  │
│   4. Updates trendPoints and trendPolylinePoints               │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ ANGULAR CHANGE DETECTION                                       │
│ ACTION:                                                         │
│   1. Detects trendPoints array changed                         │
│   2. Re-renders SVG chart                                       │
│   3. Updates text labels with rotation                         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.html (Lines 177-181)       │
│ SVG RENDERING:                                                  │
│   <svg viewBox="0 0 320 180" height="180">                     │
│     <polyline [attr.points]="trendPolylinePoints" ... />       │
│     <circle *ngFor="let p of trendPoints"                      │
│             [attr.cx]="p.x" [attr.cy]="p.y" ... />             │
│     <text *ngFor="let p of trendPoints"                        │
│           [attr.x]="p.x" [attr.y]="155"                        │
│           [attr.transform]="'rotate(-45 ' + p.x + ' 155)'">    │
│       {{ p.label }}  <!-- Shows "W1", "W2", etc. -->           │
│     </text>                                                     │
│   </svg>                                                        │
└────────────────────────────────────────────────────────────────┘
         ↓
CHART UPDATED WITH 12 WEEKS, LABELS ROTATED 45°
```

### Flow 5: Sorting Explorations Table

```
USER CLICKS "Sort by Plays" DROPDOWN
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.html (Line 103)            │
│ ELEMENT: <select [(ngModel)]="sortKey"                        │
│          (ngModelChange)="applySort()">                        │
│ EVENT: User selects "plays" option                             │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ PROPERTY: sortKey = 'plays' (updated by ngModel)              │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.ts                         │
│ METHOD: applySort() (Line 184)                                 │
│ ACTION:                                                         │
│   1. Gets sortDir ('asc' or 'desc')                            │
│   2. Gets sortKey ('plays')                                    │
│   3. Sorts reportExplorations array:                           │
│      reportExplorations.sort((a, b) => {                       │
│        const av = a['plays'] ?? 0;                             │
│        const bv = b['plays'] ?? 0;                             │
│        return (av - bv) * dir;  // dir = 1 for asc, -1 desc   │
│      })                                                         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ ANGULAR CHANGE DETECTION                                       │
│ ACTION: Detects reportExplorations array order changed         │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ FILE: creator-stats-page.component.html (Lines 132-143)       │
│ TABLE RE-RENDERS:                                               │
│   <tr *ngFor="let exp of pagedExplorations()">                 │
│     <td>{{ exp.title }}</td>                                   │
│     <td>{{ exp.plays }}</td>                                   │
│     ...                                                         │
│   </tr>                                                         │
│                                                                 │
│ pagedExplorations() returns sorted, filtered, paginated data   │
└────────────────────────────────────────────────────────────────┘
         ↓
TABLE DISPLAYS EXPLORATIONS SORTED BY PLAYS
```

---

## File-by-File Breakdown

### Frontend Files

#### 1. `/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html`
**Purpose**: Main dashboard UI template  
**Lines**: 971 total

**Key Sections**:
- **Lines 1-7**: Page header with title
- **Lines 12-77**: Stats cards (4 metrics displayed)
  - Average Rating (Lines 13-34)
  - Total Plays (Lines 35-50)
  - Open Feedback (Lines 51-63)
  - Total Subscribers (Lines 64-76)
- **Lines 78-85**: Action buttons
  - Line 79: "View Stats Report" button → calls `openStatsReportModal()`
  - Line 82: "Download Stats (CSV)" button → calls `downloadStatsCsv()`
- **Lines 89-134**: Tab navigation (Explorations, Collections, Subscribers)
- **Lines 137-367**: Explorations list (card/list view)
- **Lines 370-421**: Subscribers tab content

**User Interactions**:
1. Click "View Stats Report" → Opens modal with detailed stats
2. Click "Download Stats (CSV)" → Downloads CSV file
3. Click exploration card → Navigates to exploration editor
4. Switch tabs → Changes active view

---

#### 2. `/core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`
**Purpose**: Main dashboard component logic  
**Lines**: 378 total

**Key Methods**:

**ngOnInit() (Line 229)**:
```typescript
// What happens:
1. Shows loading screen
2. Fetches user info
3. Fetches dashboard data via API
4. Processes and stores data
5. Hides loading screen
```

**openStatsReportModal() (Line 357)**:
```typescript
// What happens:
1. Opens NgbModal with CreatorStatsReportModalComponent
2. Passes data: dashboardStats, creatorCompletionRate, 
   subscribersCount, explorationsList
3. Configures modal: size='xl', backdrop=true
```

**downloadStatsCsv() (Line 304)**:
```typescript
// What happens:
1. Creates CSV header row
2. Adds summary row with user stats
3. Adds exploration rows
4. Creates blob and triggers download
```

**Key Properties**:
- `explorationsList`: Array of exploration summaries
- `dashboardStats`: Aggregated statistics
- `subscribersList`: List of subscribers
- `activeTab`: Current tab ('myExplorations', 'myCollections', 'mySubscribers')

---

#### 3. `/core/templates/pages/creator-stats-page/creator-stats-page.component.html`
**Purpose**: Detailed stats page UI  
**Lines**: 313 total

**Key Sections**:

**Lines 3-34: Sidebar**
- Navigation links (Analytics, Posts, Financials)
- Search input
- Filter dropdown
- Trend window selector (4/8/12 weeks)

**Lines 38-56: Filter Controls** (IMPROVED)
```html
<div class="row g-2">  <!-- Responsive grid -->
  <div class="col-md-6">
    <label class="form-label mb-1 small">Date Range</label>
    <select class="form-select form-select-sm" 
            [(ngModel)]="weeklyWindow" 
            (ngModelChange)="computeVisuals()">
      <option [ngValue]="4">Last 4 weeks</option>
      <option [ngValue]="8">Last 8 weeks</option>
      <option [ngValue]="12">Last 12 weeks</option>
    </select>
  </div>
  <div class="col-md-6">
    <label class="form-label mb-1 small">Exploration</label>
    <select class="form-select form-select-sm" 
            [(ngModel)]="selectedExplorationId">
      <option value="all">All Explorations</option>
      <option *ngFor="let exp of reportExplorations" 
              [value]="exp.id">{{ exp.title }}</option>
    </select>
  </div>
</div>
```

**Lines 57-95: Metric Cards**
- 6 cards showing key metrics
- Each card displays: label, value, and trend

**Lines 98-157: Explorations Table** (IMPROVED)
```html
<div class="d-flex align-items-center mb-2 flex-wrap" style="gap:8px;">
  <div class="h6 mb-0 me-auto">Explorations</div>
  <label class="form-label mb-0 small">Sort</label>
  <select class="form-select form-select-sm" style="width:auto;" 
          [(ngModel)]="sortKey" (ngModelChange)="applySort()">
    <!-- Sort options -->
  </select>
  <select class="form-select form-select-sm" style="width:auto;" 
          [(ngModel)]="sortDir" (ngModelChange)="applySort()">
    <option value="desc">Desc</option>
    <option value="asc">Asc</option>
  </select>
</div>
```

**Lines 174-197: Exploration Engagement Trends** (IMPROVED)
```html
<svg viewBox="0 0 320 180" width="100%" height="180" 
     style="overflow: visible;">
  <polyline [attr.points]="trendPolylinePoints" 
            fill="none" stroke="#3f51b5" stroke-width="2"></polyline>
  <circle *ngFor="let p of trendPoints" 
          [attr.cx]="p.x" [attr.cy]="p.y" r="3" 
          fill="#3f51b5"></circle>
  <text *ngFor="let p of trendPoints" 
        [attr.x]="p.x" [attr.y]="155" 
        font-size="9" text-anchor="end" 
        [attr.transform]="'rotate(-45 ' + p.x + ' 155)'">
    {{ p.label }}  <!-- "W1", "W2", etc. for 12-week view -->
  </text>
</svg>
```

---

#### 4. `/core/templates/pages/creator-stats-page/creator-stats-page.component.ts`
**Purpose**: Stats page component logic  
**Lines**: 423 total

**Key Methods**:

**ngOnInit() (Line 97)**:
```typescript
async ngOnInit(): Promise<void> {
  this.loading = true;
  try {
    // 1. Fetch stats report
    const data = await this.backendApi.fetchCreatorStatsReportAsync();
    this.reportSummary = data.summary;
    this.reportExplorations = data.explorations;
    
    // 2. Calculate aggregates
    this.totalStarts = this.reportExplorations.reduce(
      (s, e) => s + (e.num_starts ?? 0), 0
    );
    this.totalCompletions = this.reportExplorations.reduce(
      (s, e) => s + (e.num_completions ?? 0), 0
    );
    this.successRate = (this.totalCompletions / this.totalStarts) * 100;
    
    // 3. Sort and visualize
    this.applySort();
    this.computeVisuals();
    
    // 4. Fetch additional data
    const dash = await this.backendApi.fetchDashboardDataAsync();
    this.computeContentEffectiveness(dash.explorationsList);
    await this.fetchRecentComments();
  } catch (e) {
    this.error = String(e);
  } finally {
    this.loading = false;
  }
}
```

**computeVisuals() (Line 202)**:
```typescript
computeVisuals(): void {
  // 1. Get weekly data based on selected window
  const weekly = (this.reportSummary?.weekly_series || [])
    .slice(-this.weeklyWindow);
  
  // 2. Generate charts
  this.computeChartsFromWeekly(
    weekly.map(wi => ({date: wi.date, total_plays: wi.total_plays || 0}))
  );
  
  // 3. Calculate outcomes distribution (completion buckets)
  const buckets = [
    {min: 0, max: 20, label: '0–20%', count: 0},
    {min: 21, max: 40, label: '21–40%', count: 0},
    // ... more buckets
  ];
  
  for (const e of this.reportExplorations) {
    const cr = e.completion_rate;
    // Assign to appropriate bucket
  }
  
  this.outcomesDistribution = buckets.map(b => ({
    label: b.label,
    count: b.count,
    heightPct: Math.round((b.count / maxCount) * 100)
  }));
}
```

**computeChartsFromWeekly() (Line 358)** (IMPROVED):
```typescript
private computeChartsFromWeekly(
  weekly: Array<{date: string; total_plays: number}>
): void {
  // 1. Top explorations bar chart
  const top = playsList.sort((a, b) => b.value - a.value).slice(0, 10);
  this.topExplorationBars = top.map(t => ({
    label: t.label,
    value: t.value,
    widthPct: Math.round((t.value / maxVal) * 100)
  }));
  
  // 2. Trend line chart
  const w = 320, h = 140, pad = 20;
  
  // IMPROVED: Smart label formatting
  const series = weekly.map((wi, idx) => ({
    label: this.weeklyWindow > 8 ? `W${idx + 1}` : wi.date,
    value: wi.total_plays
  }));
  
  // Calculate SVG coordinates
  const stepX = (w - pad * 2) / Math.max(1, series.length - 1);
  this.trendPoints = series.map((s, i) => {
    const x = pad + i * stepX;
    const y = h - pad - Math.round((s.value / maxY) * (h - pad * 2));
    return {x, y, label: s.label, value: s.value};
  });
  
  this.trendPolylinePoints = this.trendPoints
    .map(p => `${p.x},${p.y}`)
    .join(' ');
}
```

**applySort() (Line 184)**:
```typescript
applySort(): void {
  const dir = this.sortDir === 'asc' ? 1 : -1;
  const key = this.sortKey;
  
  this.reportExplorations.sort((a, b) => {
    const av = (a[key] ?? 0) as number;
    const bv = (b[key] ?? 0) as number;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}
```

---

#### 5. `/core/templates/domain/creator_dashboard/creator-dashboard-backend-api.service.ts`
**Purpose**: API service for backend communication  
**Lines**: 272 total

**Key Methods**:

**fetchDashboardDataAsync() (Line 202)**:
```typescript
async fetchDashboardDataAsync(): Promise<CreatorDashboardData> {
  return this._fetchDashboardDataAsync();
}

private async _fetchDashboardDataAsync(): Promise<CreatorDashboardData> {
  return new Promise((resolve, reject) => {
    this.http.get<CreatorDashboardDataBackendDict>(
      '/creatordashboardhandler/data'
    )
    .toPromise()
    .then(dashboardData => {
      resolve({
        dashboardStats: CreatorDashboardStats.createFromBackendDict(
          dashboardData.dashboard_stats
        ),
        lastWeekStats: dashboardData.last_week_stats 
          ? CreatorDashboardStats.createFromBackendDict(
              dashboardData.last_week_stats
            )
          : null,
        explorationsList: dashboardData.explorations_list.map(
          expSummary => CreatorExplorationSummary.createFromBackendDict(expSummary)
        ),
        // ... more data transformations
      });
    });
  });
}
```

**fetchCreatorStatsReportAsync() (Line 206)**:
```typescript
async fetchCreatorStatsReportAsync(): Promise<{
  summary: {
    num_ratings: number;
    average_ratings: number | null;
    total_plays: number;
    total_open_feedback: number;
    total_subscribers: number;
    creator_completion_rate: number | null;
    weekly_series?: Array<{
      date: string;
      num_ratings: number;
      average_ratings: number | null;
      total_plays: number;
    }>;
  };
  explorations: Array<{
    id: string;
    title: string;
    num_open_threads: number;
    average_rating: number | null;
    plays: number;
    num_starts?: number;
    num_completions?: number;
    completion_rate?: number | null;
    last_updated_msec: number;
  }>;
}> {
  return this.http.get<...>('/creatorstatsreport').toPromise();
}
```

---

### Backend Files

#### 6. `/core/controllers/creator_dashboard.py`
**Purpose**: Backend HTTP handlers  
**Lines**: 733 total

**CreatorDashboardHandler (Line 109)**:

**get() method (Line 133)**:
```python
@acl_decorators.can_access_creator_dashboard
def get(self) -> None:
    """Handles GET requests for /creatordashboardhandler/data"""
    assert self.user_id is not None
    
    # 1. Fetch exploration summaries
    subscribed_exploration_summaries = (
        exp_fetchers.get_exploration_summaries_subscribed_to(self.user_id)
    )
    exploration_ids = [s.id for s in subscribed_exploration_summaries]
    
    # 2. Get displayable summaries
    exp_summary_dicts = summary_services.get_displayable_exp_summary_dicts(
        subscribed_exploration_summaries
    )
    
    # 3. Get feedback analytics
    feedback_thread_analytics = (
        feedback_services.get_thread_analytics_multi(exploration_ids)
    )
    
    # 4. Calculate dashboard stats
    dashboard_stats = user_services.get_dashboard_stats(self.user_id)
    dashboard_stats_dict = {
        'num_ratings': dashboard_stats['num_ratings'],
        'average_ratings': dashboard_stats['average_ratings'],
        'total_plays': dashboard_stats['total_plays'],
        'total_open_feedback': feedback_services.get_total_open_threads(
            feedback_thread_analytics
        ),
    }
    
    # 5. Calculate completion rate
    total_starts = 0
    total_completions = 0
    for exp_id in exploration_ids:
        exp_obj = exp_fetchers.get_exploration_by_id(exp_id)
        exp_stats = stats_services.get_exploration_stats(
            exp_id, exp_obj.version
        )
        total_starts += exp_stats.num_starts
        total_completions += exp_stats.num_completions
    
    creator_completion_rate = (
        round((total_completions / total_starts) * 100, 2)
        if total_starts > 0 else None
    )
    
    # 6. Get subscribers
    subscriber_ids = subscription_services.get_all_subscribers_of_creator(
        self.user_id
    )
    subscribers_settings = user_services.get_users_settings(
        subscriber_ids, strict=True
    )
    subscribers_list = [...]
    
    # 7. Return JSON
    self.values.update({
        'explorations_list': displayable_exploration_summary_dicts,
        'dashboard_stats': dashboard_stats_dict,
        'creator_completion_rate': creator_completion_rate,
        'subscribers_list': subscribers_list,
        # ... more data
    })
    self.render_json(self.values)
```

**CreatorStatsReportHandler (Line 395)**:

**get() method (Line 405)**:
```python
@acl_decorators.can_access_creator_dashboard
def get(self) -> None:
    """Handles GET requests for /creatorstatsreport"""
    assert self.user_id is not None
    
    # 1. Fetch exploration data (same as above)
    subscribed_exploration_summaries = (
        exp_fetchers.get_exploration_summaries_subscribed_to(self.user_id)
    )
    exploration_ids = [s.id for s in subscribed_exploration_summaries]
    
    # 2. Get dashboard stats
    dashboard_stats = user_services.get_dashboard_stats(self.user_id)
    summary = {
        'num_ratings': dashboard_stats['num_ratings'],
        'average_ratings': dashboard_stats['average_ratings'],
        'total_plays': dashboard_stats['total_plays'],
        'total_open_feedback': feedback_services.get_total_open_threads(...),
    }
    
    # 3. Get weekly stats (IMPORTANT FOR CHARTS)
    weekly_stats = user_services.get_weekly_dashboard_stats(self.user_id)
    weekly_series = []
    for item in weekly_stats:
        for dt, stats in item.items():
            weekly_series.append({
                'date': dt,
                'num_ratings': stats.get('num_ratings', 0),
                'average_ratings': stats.get('average_ratings'),
                'total_plays': stats.get('total_plays', 0),
            })
    summary['weekly_series'] = weekly_series
    
    # 4. Calculate per-exploration metrics
    explorations = []
    for ind, exploration in enumerate(exp_summary_dicts):
        exp_obj = exp_fetchers.get_exploration_by_id(exploration['id'])
        exp_stats = stats_services.get_exploration_stats(
            exploration['id'], exp_obj.version
        )
        exp_starts = exp_stats.num_starts
        exp_completions = exp_stats.num_completions
        exp_completion_rate = (
            round((exp_completions / exp_starts) * 100, 2)
            if exp_starts > 0 else None
        )
        
        explorations.append({
            'id': exploration['id'],
            'title': exploration['title'],
            'num_open_threads': feedback_analytics_dict['num_open_threads'],
            'average_rating': avg_rounded,
            'plays': exploration['num_views'],
            'num_starts': exp_starts,
            'num_completions': exp_completions,
            'completion_rate': exp_completion_rate,
            'last_updated_msec': exploration['last_updated_msec'],
        })
    
    # 5. Return comprehensive JSON
    self.render_json({'summary': summary, 'explorations': explorations})
```

---

## User Interaction Flows

### Complete User Journey: From Dashboard to Detailed Stats

```
STEP 1: User logs in and navigates to /creator-dashboard
  ↓
  Browser loads creator-dashboard-page.component
  ↓
  Component calls fetchDashboardDataAsync()
  ↓
  Backend returns aggregated stats
  ↓
  UI displays 4 metric cards + exploration list

STEP 2: User clicks "View Stats Report" button
  ↓
  openStatsReportModal() is called
  ↓
  NgbModal opens CreatorStatsReportModalComponent
  ↓
  Modal displays detailed stats in popup

STEP 3: User closes modal and wants more details
  ↓
  User navigates to /creator-stats (or clicks link)
  ↓
  Browser loads creator-stats-page.component
  ↓
  Component calls fetchCreatorStatsReportAsync()
  ↓
  Backend returns comprehensive data with weekly_series
  ↓
  Component processes data:
    - Calculates aggregates
    - Generates chart data
    - Sorts explorations
  ↓
  UI renders complete stats page with:
    - 6 metric cards
    - Explorations table
    - Engagement trends chart (with rotated labels)
    - Learning outcomes distribution
    - Performance overview

STEP 4: User changes weekly window to 12 weeks
  ↓
  ngModelChange triggers computeVisuals()
  ↓
  computeVisuals() extracts last 12 weeks from weekly_series
  ↓
  computeChartsFromWeekly() generates chart data:
    - Labels formatted as "W1", "W2", ..., "W12"
    - SVG coordinates calculated
  ↓
  Angular re-renders SVG chart
  ↓
  Chart displays 12 weeks with rotated labels (no overlap)

STEP 5: User sorts explorations by completion rate
  ↓
  ngModelChange triggers applySort()
  ↓
  applySort() sorts reportExplorations array
  ↓
  Angular re-renders table
  ↓
  Table displays explorations sorted by completion rate

STEP 6: User downloads CSV
  ↓
  User clicks "Download Stats (CSV)" button
  ↓
  downloadStatsCsv() is called
  ↓
  Method creates CSV string with all data
  ↓
  Browser downloads creator_stats.csv file
```

---

## API Endpoints

### 1. `/creatordashboardhandler/data`
**Method**: GET  
**Handler**: `CreatorDashboardHandler.get()`  
**File**: `core/controllers/creator_dashboard.py:133`

**Request**: No parameters (uses session user_id)

**Response**:
```json
{
  "explorations_list": [
    {
      "id": "exp123",
      "title": "Introduction to Fractions",
      "num_views": 1200,
      "num_open_threads": 3,
      "ratings": {"1": 2, "2": 5, "3": 10, "4": 30, "5": 53},
      "last_updated_msec": 1702345678000,
      ...
    }
  ],
  "dashboard_stats": {
    "num_ratings": 150,
    "average_ratings": 4.5,
    "total_plays": 5000,
    "total_open_feedback": 12
  },
  "creator_completion_rate": 68.5,
  "subscribers_list": [
    {"subscriber_username": "user1", "subscriber_impact": 42},
    ...
  ],
  "last_week_stats": {...},
  "display_preference": "card"
}
```

### 2. `/creatorstatsreport`
**Method**: GET  
**Handler**: `CreatorStatsReportHandler.get()`  
**File**: `core/controllers/creator_dashboard.py:405`

**Request**: No parameters (uses session user_id)

**Response**:
```json
{
  "summary": {
    "num_ratings": 150,
    "average_ratings": 4.5,
    "total_plays": 5000,
    "total_open_feedback": 12,
    "total_subscribers": 45,
    "creator_completion_rate": 68.5,
    "weekly_series": [
      {
        "date": "2024-W01",
        "num_ratings": 12,
        "average_ratings": 4.3,
        "total_plays": 450
      },
      {
        "date": "2024-W02",
        "num_ratings": 15,
        "average_ratings": 4.4,
        "total_plays": 520
      },
      ... (up to 12 weeks)
    ]
  },
  "explorations": [
    {
      "id": "exp123",
      "title": "Introduction to Fractions",
      "num_open_threads": 3,
      "average_rating": 4.8,
      "plays": 1200,
      "num_starts": 800,
      "num_completions": 576,
      "completion_rate": 72.0,
      "last_updated_msec": 1702345678000
    },
    ...
  ]
}
```

---

## Data Models

### CreatorDashboardStats
**File**: `core/templates/domain/creator_dashboard/creator-dashboard-stats.model.ts`

```typescript
export class CreatorDashboardStats {
  constructor(
    public numRatings: number,
    public averageRatings: number | null,
    public totalPlays: number,
    public totalOpenFeedback: number
  ) {}

  static createFromBackendDict(
    backendDict: CreatorDashboardStatsBackendDict
  ): CreatorDashboardStats {
    return new CreatorDashboardStats(
      backendDict.num_ratings,
      backendDict.average_ratings,
      backendDict.total_plays,
      backendDict.total_open_feedback
    );
  }
}
```

### ReportExploration (TypeScript Interface)
**File**: `core/templates/pages/creator-stats-page/creator-stats-page.component.ts:5`

```typescript
type ReportExploration = {
  id: string;
  title: string;
  num_open_threads: number;
  average_rating: number | null;
  plays: number;
  num_starts?: number;
  num_completions?: number;
  completion_rate?: number | null;
  last_updated_msec: number;
};
```

---

## Summary of UI Improvements Made

### 1. Exploration Engagement Trends Chart
**Problem**: Week labels overlapping when displaying 12 weeks  
**Solution**:
- Increased SVG height from 140 to 180 pixels
- Rotated labels 45 degrees using SVG transform
- Smart label formatting: "W1", "W2" for 12-week view, full dates for 4/8 weeks
- Adjusted text positioning and anchor

**Files Modified**:
- `creator-stats-page.component.html:177` (SVG markup)
- `creator-stats-page.component.ts:408` (label formatting logic)

### 2. Exploration Performance Filter Controls
**Problem**: Crowded horizontal layout with poor spacing  
**Solution**:
- Changed from flex layout to Bootstrap responsive grid
- Used `row g-2` for consistent spacing
- Made labels smaller with `small` class
- Used `form-select-sm` for compact controls
- Improved mobile responsiveness with `col-md-6`

**Files Modified**:
- `creator-stats-page.component.html:38-56` (filter controls)
- `creator-stats-page.component.html:98-116` (table sort controls)

### 3. Table Sort Controls
**Problem**: Nested flex containers causing crowding  
**Solution**:
- Flattened structure with `flex-wrap`
- Used `me-auto` for proper spacing
- Made controls auto-width
- Added responsive wrapping

**Files Modified**:
- `creator-stats-page.component.html:98-116`

---

## Testing Checklist

✅ **Dashboard loads correctly**
- Stats cards display data
- Exploration list renders
- Buttons are clickable

✅ **Stats Report Modal**
- Opens when button clicked
- Displays correct data
- Closes properly

✅ **Creator Stats Page**
- All sections load
- Charts render correctly
- No overlapping text

✅ **Weekly Window Selection**
- 4 weeks: Shows full dates
- 8 weeks: Shows full dates
- 12 weeks: Shows "W1"-"W12" labels
- Labels are rotated and readable

✅ **Sorting and Filtering**
- Sort by plays, rating, completion rate works
- Filter by exploration works
- Pagination works

✅ **CSV Export**
- Downloads file
- Contains correct data
- Properly formatted

---

## Conclusion

This documentation provides a complete understanding of the Creator Stats Dashboard system, from user clicks to backend processing. Every file, method, and data flow has been documented with precise line numbers and code examples.

The UI improvements ensure a professional, readable interface with no overlapping text and proper spacing throughout all sections.
