# Mock API Setup for Creator Statistics

## Quick Start

### 1. Start the Mock API Server

```bash
# In a new terminal window
cd /Users/vanshika/opensource/oppia
python mock_api_server.py
```

You'll see:

```
🚀 Mock API Server Started!
Server running on: http://localhost:8888
```

### 2. Test the API

**Option A: Using Browser**

- Visit: http://localhost:8888/creator_dashboard/stats_report

**Option B: Using curl**

```bash
curl http://localhost:8888/creator_dashboard/stats_report
```

**Option C: Using Frontend**

- Update your frontend to call `http://localhost:8888` instead of `http://localhost:8181`

---

## Available Mock Endpoints

### 1. Stats Report (Main Statistics)

**URL:** `GET /creator_dashboard/stats_report`

**Response:**

```json
{
  "dau": 42,
  "wau": 156,
  "retention_7d": 0.32,
  "avg_session_time_secs": 285.5
}
```

**What it shows:** Current snapshot of all metrics

---

### 2. Time Series Data (For Graphs)

**URL:** `GET /creator_dashboard/stats_timeseries?days=30`

**Response:**

```json
{
  "data": [
    {"date": "2025-11-10", "dau": 42, "wau": 156},
    {"date": "2025-11-11", "dau": 45, "wau": 160},
    ...
  ]
}
```

**What it shows:** Daily DAU/WAU for last 30 days (for line charts)

---

### 3. Session Distribution (For Pie Chart)

**URL:** `GET /creator_dashboard/session_distribution`

**Response:**

```json
{
  "0-5min": 120,
  "5-15min": 85,
  "15-30min": 43,
  "30-60min": 12,
  "60+min": 5
}
```

**What it shows:** How sessions are distributed across time buckets

---

### 4. Exploration Performance (For Bar Chart)

**URL:** `GET /creator_dashboard/exploration_performance`

**Response:**

```json
{
  "explorations": [
    {
      "explorationId": "exp_001",
      "title": "Introduction to Algebra",
      "views": 452,
      "uniqueUsers": 89,
      "avgSessionTime": 245.5
    }
  ]
}
```

**What it shows:** Per-exploration statistics for comparison

---

## Frontend Integration

### Update API Base URL

**File:** `creator-dashboard-page.component.ts`

```typescript
// BEFORE (real backend):
const API_BASE = 'http://localhost:8181';

// AFTER (mock API):
const API_BASE = 'http://localhost:8888';

// Then use:
this.http.get(`${API_BASE}/creator_dashboard/stats_report`);
```

**Or use environment variable:**

```typescript
// In environment.ts:
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8888', // Mock API for testing
};

// In component:
import {environment} from 'src/environments/environment';
this.http.get(`${environment.apiUrl}/creator_dashboard/stats_report`);
```

---

## Features of Mock API

✅ **Random Data** - Generates realistic random values each time  
✅ **CORS Enabled** - Works with frontend on different port  
✅ **Logging** - Shows requests in terminal  
✅ **Multiple Endpoints** - All 4 endpoints implemented  
✅ **Realistic Variation** - Data has natural fluctuations

---

## Testing Workflow

### Scenario 1: Test Basic Stats Display

1. Start mock server: `python mock_api_server.py`
2. Start Oppia dev server: `python -m scripts.start`
3. Open creator dashboard
4. Click "Stats Report" tab
5. Should see: DAU, WAU, retention, avg time

### Scenario 2: Test Graph Rendering

1. Start mock server
2. Update frontend to call timeseries endpoint
3. Render Chart.js line graph
4. Should see: 30 days of DAU/WAU data

### Scenario 3: Test Multiple Refreshes

1. Start mock server
2. Refresh stats multiple times
3. Numbers should change (random data)
4. Verify UI updates correctly

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Error: Address already in use
# Solution: Change port in mock_api_server.py
run_mock_server(port=9999)  # Use different port
```

### Issue: CORS Errors

```
Access to fetch at ... has been blocked by CORS policy
```

**Solution:** Mock server already has CORS headers enabled. Check browser console.

### Issue: Connection Refused

```
Failed to connect to localhost:8888
```

**Solution:** Ensure mock server is running in a separate terminal.

---

## Switching Between Real and Mock API

### Development Mode (Mock API)

```typescript
// environment.ts
apiUrl: 'http://localhost:8888';
```

### Testing Mode (Real Backend)

```typescript
// environment.ts
apiUrl: 'http://localhost:8181';
```

### Production Mode

```typescript
// environment.prod.ts
apiUrl: 'https://oppia.org';
```

---

## Stop the Mock Server

Press `Ctrl+C` in the terminal where it's running:

```
^C
👋 Mock server stopped
```

---

## Files Created

- `mock_api_server.py` - Mock API server (added to .gitignore)
- `MOCK_API_SETUP.md` - This documentation (added to .gitignore)

**Note:** These files won't be pushed to GitHub (they're in .gitignore)

---

## Next Steps

1. ✅ Start mock server
2. ✅ Test endpoints with curl
3. ✅ Update frontend to use mock API
4. ✅ Test graphs with mock data
5. ✅ Switch back to real backend when ready

**Happy Testing!** 🚀
