# Creator Stats Report — Oppia

## Introduction

This project extends the Oppia platform to provide creators with a detailed Stats Report, surfacing metrics about their explorations, engagement, and feedback, all accessible on the Creator Dashboard. This feature aids creators in tracking the impact of their content and improving learner outcomes.

## Project Objectives

- Aggregate and present per-creator and per-exploration statistics (views, ratings, feedback, completion rates, etc).
- Display engagement analytics (e.g., average time, attempts, hint usage) in dashboard UI.
- Enable data export (CSV/PDF) for offline analysis.

## Reference Specifications

- Core specification: `Stats_Report_Specification.md`
- Learner data flow: `Fetching_and_Displaying_Learner_Data_on_Creator_Dashboard.md`

## Implementation Roadmap

1. **Requirements & Design**
   - Study both specs, finalize data fields and UI features.
2. **Backend Phase**
   - Update/add models in `core/storage/` (`exploration_models.py`, `stats_models.py`, etc).
   - Add/extend handlers in `core/controllers/` (e.g., new `creator_stats_report.py`).
   - Write backend tests.
3. **Frontend Phase**
   - Extend components/services in `assets/pages/creator_dashboard/`.
   - Implement stats widgets and export options.
   - Write frontend tests.
4. **Integration & Docs**
   - Test & polish workflow end-to-end; update docs.

## Key Folders & Files

- **Backend:**
  - `core/storage/` — models: `exploration`, `statistics`, `feedback`, `user`
  - `core/controllers/` — handlers: dashboard, exploration, stats
- **Frontend:**
  - `assets/pages/creator_dashboard/` — dashboard UI, TypeScript/Angular code
- **Specifications:**
  - `Stats_Report_Specification.md`, `Fetching_and_Displaying_Learner_Data_on_Creator_Dashboard.md`

## Contributor Workflow

- Work in stepwise phases as described in the roadmap and full specification.
- After each major step, make a clear, focused commit (see example commit messages in the main spec).
- Reference MD files in PRs for reviewers.
- Coordinate backend/frontend progress for clean integration.

---

See `Stats_Report_Specification.md` for technical details, data flows, and example file structure.
