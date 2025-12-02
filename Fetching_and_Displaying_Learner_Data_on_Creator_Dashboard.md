# Fetching & Showing Learner Data on Creator Dashboard (Oppia)

## Objective

Describe how to fetch learner engagement data for explorations authored by a specific creator, and detail methods to display this data (e.g., average engagement time) on the Creator Dashboard. Includes recommendations for fetching, aggregating, and integrating learner usage statistics for enhanced reporting features.

---

## 1. What Learner Data is Useful for Creators?

- **Engagement Time:** Average/min/max time spent by learners on each exploration.
- **Number of Attempts:** Total attempts made by learners per exploration.
- **Completion Rate:** % of learners who finish the activity.
- **Learner Demographics:** (If available) Age, location, etc.
- **Interaction Patterns:** Hints viewed, solutions revealed, feedback given.

---

## 2. Where Is Learner Data Stored in Oppia?

- **Exploration Statistics:**

  - **File:** `core/storage/statistics/stats_models.py`
  - **Model:** `StateStatsModel`, `ExplorationStatsModel`
    - Tracks per-exploration & per-state stats (including completion, time).

- **Session and Time Tracking:**

  - **File:** May be found in analytics/tracking logic. Check:
    - `core/controllers/exploration_stats.py`
    - `core/domain/stats_services.py`
  - **Note:** Engagement time may need to be calculated from logs or session events.

- **Backend Data Access:**
  - Use models and service functions in the above directories to fetch learner data.

---

## 3. How to Fetch Learner Engagement Data

### Step-by-Step Guide

1. **Get Creator's Explorations:**

   - Query: All `ExplorationModel` instances where `creator_id` matches the logged-in creator.
   - **Code:**
     ```python
     ExplorationModel.query(ExplorationModel.creator_id == creator_id).fetch()
     ```

2. **For Each Exploration, Fetch Stats:**

   - Use `ExplorationStatsModel` and `StateStatsModel`.
   - Engagement-related fields: `num_actual_starts`, `num_completions`, possibly session logs for time.

3. **Calculate Engagement Time (if Supported):**

   - **Note:** Oppia generally tracks state transitions and events. You may need to aggregate timestamps from learner sessions:
     - Check for time tracking in `core/domain/stats_services.py` or equivalent services.
     - May require new logic to sum or average time per session.
   - **Code Example:**
     ```python
     stats = ExplorationStatsModel.get_by_id(exploration_id)
     avg_time = stats.get_average_engagement_time()
     ```

4. **Aggregate Data per Creator:**
   - Summarize for dashboard: average engagement time per exploration, per creator.
   - Extra: Count learner feedback, hints/solutions usage.

---

## 4. Displaying Data on Creator Dashboard

### A. Backend

- **Extend/Create API Endpoint:**

  - Add endpoint (e.g., `/creatorengagementstats/<creator_id>`) in `creator_stats_report.py` or extend existing dashboard handler.
  - Aggregate stats before sending to frontend.

- **Sample API Response Structure:**
  ```json
  {
    "explorations": [
      {
        "id": "exp123",
        "title": "Fractions Intro",
        "average_engagement_time": 157,   // seconds
        "completion_rate": 0.85,
        "num_learners": 120,
        "hint_views": 26,
        "solution_views": 7
      },
      ...
    ]
  }
  ```

### B. Frontend

- **Location:** `assets/pages/creator_dashboard/`
- **How to Show:**
  - Add "Learner Engagement" section per exploration:
    - Average time spent
    - Number of learners
    - Completion rate
    - (Graph or chart: e.g., bar chart of engagement time)
  - Option for filtering/sorting by engagement metrics.
  - Option to export learner stats for offline use.

---

## 5. New Features & Recommendations

- **Detailed Session Analytics:** If not present, add tracking of session start/end times for more accurate engagement measurement.
- **Feedback Integration:** Link learner feedback to engagement stats for context.
- **Comparison & Insights:** Show trends (e.g., which explorations retain learners, which need improvement).
- **Privacy:** When showing individual learner info, anonymize or aggregate to protect privacy.

---

## 6. Example Code Snippet for Backend Aggregation

```python
def get_exploration_engagement_stats(creator_id):
    # Fetch all explorations by creator
    exps = ExplorationModel.query(ExplorationModel.creator_id == creator_id).fetch()
    stats_report = []
    for exp in exps:
        stats = ExplorationStatsModel.get_by_id(exp.id)
        avg_time = stats.get_average_engagement_time()  # or custom calculation
        stats_report.append({
            "id": exp.id,
            "title": exp.title,
            "average_engagement_time": avg_time,
            "completion_rate": stats.num_completions / stats.num_actual_starts if stats.num_actual_starts else 0,
        })
    return stats_report
```

---

## 7. References

- [core/storage/statistics/stats_models.py](https://github.com/padhmashikhap25-hub/oppia/tree/main/core/storage/statistics/)
- [core/controllers/exploration_stats.py](https://github.com/padhmashikhap25-hub/oppia/tree/main/core/controllers/)
- [core/domain/stats_services.py](https://github.com/padhmashikhap25-hub/oppia/tree/main/core/domain/)

---

## 8. Next Steps

- Identify if session time analytics exist; if not, propose additions.
- Implement or update backend API to serve per-exploration learner stats.
- Build/extend frontend dashboard widgets for engagement analytics.
- Test and validate display with live data.

---

> If you want the actual code or deeper technical instructions for a specific step, request details for that function, file, or API.
