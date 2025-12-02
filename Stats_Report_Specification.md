# Stats Report for Creators – Oppia Learning Portal

## Objective

Create a comprehensive Stats Report for Creators on the Oppia platform. This report aggregates and presents statistics related to creator activities, exploration quality, learner engagement, and feedback. The report should be accessible via dashboard (web UI), and support CSV/PDF export for offline analysis.

---

## 1. Stakeholders

- **Creators:** Users who author or contribute to explorations (learning activities).
- **Admins:** Platform administrators reviewing creator impact.
- **Learners:** Indirect beneficiaries (not report targets).

---

## 2. Report Contents

### A. Creator Summary

| Field                      | Description                                    |
| -------------------------- | ---------------------------------------------- |
| Creator Name/ID            | Unique identifier of the creator               |
| Email/User Profile         | Creator's registered email/username            |
| Joined Date                | Date when the creator registered               |
| Number of Explorations     | Count of explorations authored                 |
| Total Learner Views        | Aggregate views of all authored explorations   |
| Average Exploration Rating | Mean user rating across all explorations       |
| Feedback Threads Received  | Total feedback threads/comments received       |
| Average Completion Rate    | Mean completion rate of creator's explorations |

### B. Per-Exploration Stats

| Field                   | Description                         |
| ----------------------- | ----------------------------------- |
| Exploration ID          | Unique ID                           |
| Exploration Title       | Name/title                          |
| Creation Date           | Date published                      |
| Number of Learner Views | How many learners interacted        |
| Ratings                 | Distribution of ratings (1-5 stars) |
| Completion Rate         | Percentage of learners who finished |
| Feedback Threads        | Number of feedback threads          |
| Solutions Viewed        | Count of learners viewing solutions |
| Hints Used              | Count of learners using hints       |

---

## 3. Data Sources & Location in Oppia Codebase

### A. Backend Data Models

| Data Type         | Location (Folder/File)                           | Model Name              |
| ----------------- | ------------------------------------------------ | ----------------------- |
| Explorations      | `core/storage/exploration/exploration_models.py` | `ExplorationModel`      |
| Creator/User Info | `core/storage/user/user_models.py`               | `UserSettingsModel`     |
| Stats/Analytics   | `core/storage/statistics/stats_models.py`        | `ExplorationStatsModel` |
| Feedback/Comments | `core/storage/feedback/feedback_models.py`       | `FeedbackThreadModel`   |

### B. API Endpoints — Backend Handlers

| Feature/Action         | Python Controller File                  | API/Endpoint URL                            |
| ---------------------- | --------------------------------------- | ------------------------------------------- |
| Creator Dashboard Data | `core/controllers/creator_dashboard.py` | `/dashboardhandler/data`                    |
| Exploration Data       | `core/controllers/exploration.py`       | `/explorationdatahandler/<exploration_id>`  |
| Exploration Stats      | `core/controllers/exploration_stats.py` | `/explorationstatshandler/<exploration_id>` |
| Feedback/Comments      | `core/controllers/feedback.py`          | `/feedbackthreadlist/<exploration_id>`      |
| User Profiles          | `core/controllers/profile.py`           | `/profilehandler/<username>`                |

---

## 4. Data Flow – Step-by-Step

1. **Identify Creator:**

   - Query `UserSettingsModel` in `user_models.py` via username or user_id.
   - Use `/profilehandler/<username>` to fetch profile.

2. **Fetch Creator's Explorations:**

   - Query `ExplorationModel` filtering by `creator_id`.
   - Use `/dashboardhandler/data` for author-specific explorations.

3. **Aggregate Exploration Stats:**

   - For each exploration:
     - Query `ExplorationStatsModel` in `stats_models.py`.
     - Use `/explorationstatshandler/<exploration_id>` API.

4. **Collect Feedback Data:**

   - For each exploration:
     - Query `FeedbackThreadModel` in `feedback_models.py`.
     - Use `/feedbackthreadlist/<exploration_id>` API.

5. **Compile Metrics in Desired Format:**
   - Join data per creator.
   - Present via dashboard (`creator_dashboard.py`).
   - Support backend functions for CSV/PDF export.

---

## 5. Proposed Extension Points

- **Backend:**

  - New handler: `core/controllers/creator_stats_report.py` for customized stats aggregation APIs.
  - Utilities: CSV/PDF export functions.

- **Frontend:**
  - UI dashboard code in `assets/pages/creator_dashboard/`.
  - Button for CSV/PDF export.

---

## 6. Sample File/Folder Structure

```plaintext
core/
  controllers/
    creator_dashboard.py           # Dashboard web handler
    creator_stats_report.py        # (Proposed) Custom stats handler
    exploration.py                 # Exploration data APIs
    exploration_stats.py           # Exploration stats APIs
    feedback.py                    # Feedback and comments
    profile.py                     # User profile APIs
  storage/
    exploration/
      exploration_models.py        # Exploration data definitions
    statistics/
      stats_models.py              # Statistics data definitions
    user/
      user_models.py               # User data definitions
    feedback/
      feedback_models.py           # Feedback thread definitions
assets/
  pages/
    creator_dashboard/             # Dashboard frontend logic
```

---

## 7. Example: API Usage Patterns

```python
# 1. Get explorations for creator
ExplorationModel.query(ExplorationModel.creator_id == user_id).fetch()

# 2. Get stats for exploration
ExplorationStatsModel.get_by_id(exploration_id)

# 3. Get feedback threads for exploration
FeedbackThreadModel.query(FeedbackThreadModel.entity_id == exploration_id).fetch()
```

---

## 8. Integration Recommendations

- **APIs to use/integrate:**

  - Use `dashboardhandler/data` for basic stats aggregation.
  - Use `explorationstatshandler` and `feedbackthreadlist` for granular analysis.

- **Extend:**

  - Add or extend endpoints in `creator_stats_report.py` if custom aggregation needed.

- **Frontend:**
  - Consume these APIs in dashboard UI (`assets/pages/creator_dashboard/`).
  - Implement CSV/PDF export as download options.

---

## 9. References

- [Oppia Core Data Models](https://github.com/padhmashikhap25-hub/oppia/tree/main/core/storage)
- [Oppia Backend Controllers](https://github.com/padhmashikhap25-hub/oppia/tree/main/core/controllers)
- [Oppia Frontend Dashboard](https://github.com/padhmashikhap25-hub/oppia/tree/main/assets/pages/creator_dashboard)

---

## 10. Next Steps

- Explore existing APIs or create custom aggregation API
- Design UI wireframe for stats report
- Implement backend aggregation and frontend dashboard
- Add export functionality

```
This document provides a full structure — feel free to modify details according to your specific requirements or actual repo code!
```
