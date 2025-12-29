# View Stats Report — Change Map

## Overview

This document lists all files and the specific changes made to implement the “View Stats Report” popup dashboard, including triggers, modal logic, UI, charts, mock data, and template fixes.

## Dashboard Trigger

- `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`
  - Injects `NgbModal` and imports `CreatorStatsReportModalComponent`.
  - Updates `openStatsReportModal()` to open the modal with `size: 'xl'` and `windowClass: 'creator-stats-modal'`.
  - Passes data into the modal: `dashboardStats`, `creatorCompletionRate`, `subscribersCount`, `explorationsList`.
- `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html`
  - Button bound to `(click)="openStatsReportModal()"` to open the popup instead of routing.

## Modal Component (Logic)

- `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.ts`
  - Adds component state for dashboard features:
    - Charts: `topExplorationBars`, `histogram`, `trendPoints`, `trendPolylinePoints`.
    - Sections: `outcomesDistribution`, `ratingsBreakdown`, `contentEffectiveness`, `recentComments`.
    - Enhanced metrics: `avgTimeSpentMinutes`, `peakActivityTime`.
    - Exploration item shape extended with `avg_time_minutes`.
  - Initialization:
    - Attempts live fetch via `CreatorDashboardBackendApiService.fetchCreatorStatsReportAsync()`.
    - Enables demo mode to populate comprehensive mock data via `populateMockDataForDemo()`.
  - Computation helpers:
    - Sorting/filtering/paging: `applySorting()`, `filteredExplorations()`, `pageExplorations()`.
    - Charts:
      - Top plays bars normalized by max plays.
      - Plays histogram buckets with normalized heights.
      - Outcomes distribution buckets (completion-rate ranges) with normalized heights.
      - Weekly trend points and polyline mapping.
  - Error and type fixes:
    - Removes duplicate property declarations that caused TypeScript errors.
    - Uses safe null checks in logic (avoiding nullish coalescing in templates).

## Modal Component (Template + Styles)

- `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.html`
  - Summary cards:
    - Average Rating, Total Plays, Open Feedback, Subscribers, Completion Rate, Avg Time Spent.
  - Performance table:
    - Exploration metrics with sorting, filtering, paging, and export controls (JSON/CSV).
  - Charts:
    - Top Explorations by Plays (bar width visualization).
    - Exploration Engagement Trends (SVG polyline).
    - Learning Outcomes Distribution (interactive bars with labels, count badges, axis).
    - Histogram: Plays Distribution (interactive bars with labels, count badges, axis).
  - Sections:
    - Exploration Performance Overview cards (Views, Enrollments, Completion, Avg Time, Feedback).
    - Content Effectiveness (Engagement %, Completion %, Avg Score placeholder).
    - Ratings & Feedback (star distribution + recent comments).
    - Key Insights (Top module, Gaps, Peak Activity Time).
  - Styling:
    - Modal (~80% viewport sizing) via `.creator-stats-modal`.
    - Attractive cards via `.oppia-mat-card` and `.section-card`.
    - Charts made visible and interactive:
      - `.chart-bar-container { height: 100% }`
      - `.chart-bar { min-height: 6px; gradients; hover shadow }`
      - `.badge-count` pill styling for counts
      - Axis baseline (`.chart-axis`)
    - Table polish: bordered, gradient header, zebra stripes, row hover.
  - Template fixes:
    - Replaces `??` with ternaries in bindings for Angular compatibility.
    - Balances tags and removes stray characters to eliminate parse errors.

## Creator Stats Page (Route Page — supporting improvements)

- `core/templates/pages/creator-stats-page/creator-stats-page.component.ts`
  - Injects `HttpClient`.
  - Aggregates totals: `totalStarts`, `totalCompletions`, `successRate`, `activeLearners`.
  - Computes `outcomesDistribution` and prepares `ratingsBreakdown`, `contentEffectiveness`, `recentComments`.
  - Resolves TypeScript errors by removing duplicates and adding missing properties referenced in the template.
- `core/templates/pages/creator-stats-page/creator-stats-page.component.html`
  - Adds dashboard-like UI sections similar to the modal.
  - Replaces nullish coalescing with safe ternaries in bindings.

## Key Identifiers (for quick navigation)

- Modal open trigger: `openStatsReportModal()` in `creator-dashboard-page.component.ts`
- Modal styling hook: `creator-stats-modal` (applied via `NgbModal.open()` options)
- Mock data builder: `populateMockDataForDemo()` in the modal TS
- Chart mapping: `computeChartsFromWeekly()` and in-function histogram/outcomes computations
- Safe template bindings: ternary checks like `{{ value != null ? value : 'N/A' }}`

## Notes

- Live data fetch is attempted first; demo mode ensures the modal stays fully functional even without backend.
- Formulas used for charts and metrics are documented in `/Users/piyushrathod/oppia/docs/view-stats-report-code-explained.md` and `/Users/piyushrathod/oppia/docs/view-stats-report-dataflow.md`.
