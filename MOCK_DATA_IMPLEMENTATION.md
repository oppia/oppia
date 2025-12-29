# Mock Data Implementation - Quick Reference

## ✅ What Changed (Just Now)

**File:** `core/controllers/creator_dashboard.py`  
**Lines:** 497-524  
**Change:** Handler now returns **mock data** instead of querying empty database

### Before (Returned 0s):

```python
stats = {
    'dau': analytics_services.get_daily_active_users(self.user_id),  # Returns 0
    'wau': analytics_services.get_weekly_active_users(self.user_id),  # Returns 0
    ...
}
```

### After (Returns Random Mock Data):

```python
import random

stats = {
    'dau': random.randint(35, 50),           # Random 35-50
    'wau': random.randint(140, 170),         # Random 140-170
    'retention_7d': round(random.uniform(0.25, 0.40), 2),  # Random 25-40%
    'avg_session_time_secs': round(random.uniform(200, 400), 1)  # Random 3-6 min
}
```

---

## 🎯 How to See Mock Data in Oppia Dashboard

### Step 1: Ensure Server is Running

```bash
python -m scripts.start
```

### Step 2: Log In to Oppia

1. Open browser: http://localhost:8181
2. Log in with your account
3. Navigate to Creator Dashboard

### Step 3: Access Stats Endpoint

**Option A: Direct API Call (Must be logged in)**

```bash
# Won't work - need authentication:
curl http://localhost:8181/creator_dashboard/stats_report
# Returns: 401 Unauthorized

# To test, you need to:
# 1. Log in via browser at http://localhost:8181
# 2. Use browser console or Postman with session cookie
```

**Option B: Frontend Integration (When Stats Tab is Added)**

- Click "Stats Report" tab in Creator Dashboard
- See random mock values
- Refresh to see different random values

**Option C: Test Page (No Login Required)**

```bash
# Open the test page we created:
open test_stats_page.html
# This uses mock API server (port 8888), no auth needed
```

---

## 📊 Mock Data Values

Each time you call the endpoint, you'll get **different random values**:

- **DAU:** Between 35-50 users
- **WAU:** Between 140-170 users
- **7-Day Retention:** Between 25-40%
- **Avg Session Time:** Between 200-400 seconds (3-6 minutes)

---

## 🔄 Switching Between Mock and Real Data

### Current: Mock Data (For Testing)

```python
# In creator_dashboard.py, line ~502:
import random
stats = {
    'dau': random.randint(35, 50),
    'wau': random.randint(140, 170),
    ...
}
```

### Future: Real Data (When Session Tracking is Ready)

```python
# Uncomment these lines in creator_dashboard.py:
from core.domain import analytics_services
stats = {
    'dau': analytics_services.get_daily_active_users(self.user_id),
    'wau': analytics_services.get_weekly_active_users(self.user_id),
    ...
}
```

---

## 📝 Files Modified

1. **Backend Handler** ✅ Modified

   - File: `core/controllers/creator_dashboard.py`
   - Lines: 497-524
   - Change: Mock data instead of analytics calls

2. **Documentation** ✅ In .gitignore
   - All `.md` files won't be pushed
   - You can update them locally as needed

---

## ✅ Summary

**What Works Now:**

- ✅ Backend endpoint returns mock data
- ✅ Mock API server (port 8888) works independently
- ✅ Test page shows beautiful visualization
- ✅ Real Oppia endpoint (port 8181) also returns mock data (requires login)

**What Shows 0s:**

- The screenshot you showed earlier was **before** this change
- Now it will show random values (38, 167, 32%, 4m 45s, etc.)

**To See It:**

1. Log in to http://localhost:8181
2. Navigate to Creator Dashboard
3. When Stats Report tab is integrated, it will show mock data
4. Or use test_stats_page.html for immediate visualization

---

**Next Steps:**

- Frontend integration to display stats in Creator Dashboard UI
- Add Stats Report tab to show the data visually
- Eventually switch to real analytics when session tracking is implemented
