# View Stats Report — Code Walkthrough and Formulas

## Trigger and Modal

- Open function: `openStatsReportModal()` in `creator-dashboard-page.component.ts`
  - Opens `CreatorStatsReportModalComponent` via `NgbModal`
  - Passes: `dashboardStats`, `creatorCompletionRate`, `subscribersCount`, `explorationsList`
  - Sets `windowClass: 'creator-stats-modal'`, `size: 'xl'` (≈ 80% viewport)

## Component: CreatorStatsReportModalComponent (TypeScript)

- File: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.ts`
- Properties (key):

  - `reportSummary`: totals and weekly series
  - `reportExplorations`: per-exploration metrics; includes `avg_time_minutes`
  - Sorting/filtering/paging: `sortKey`, `sortDir`, `filterKey`, `filterText`, `pageIndex`, `pageSize`
  - Charts: `topExplorationBars`, `histogram`, `trendPoints`, `trendPolylinePoints`
  - Mock sections: `outcomesDistribution`, `ratingsBreakdown`, `contentEffectiveness`, `recentComments`
  - Enhanced metrics: `avgTimeSpentMinutes`, `peakActivityTime`

- Initialization flow: `ngOnInit()` (modal TS:72–105)

  - Tries live fetch: sets `reportSummary` and `reportExplorations`, then `applySorting()` and `computeChartsFromWeekly(weekly)`
  - Demo mode: `populateMockDataForDemo()` always runs to ensure chart and section completeness

- Sorting: `applySorting()` (modal TS:117–124)

  - Given `sortKey ∈ {plays, average_rating, num_open_threads}`
  - Direction `sortDir ∈ {asc, desc}`
  - Comparator: return sign based on `(a[sortKey] ?? 0)` vs `(b[sortKey] ?? 0)`

- Filtering: `filteredExplorations()` (modal TS:153–186)

  - Text filter on `title`
  - Key filter cases:
    - `high_rating`: average_rating ≥ 4.0
    - `low_rating`: 0 < average_rating ≤ 2.0
    - `has_open_threads`: num_open_threads > 0
    - `recently_updated`: last_updated_msec within 30 days
    - `high_plays`: plays ≥ 1000

- Pagination: `pageExplorations()` (modal TS:188–203)

  - Slices `filteredExplorations()` using `pageIndex × pageSize`

- Export: `exportJson()` (modal TS:205–214)

  - Creates a data URI with JSON and prompts download

- Chart computations:

  - Weekly trend and top bars: `computeChartsFromWeekly(weekly)` (modal TS:333–373)

    - Trend mapping formulas:
      - maxY = max(series values)
      - stepX = (w − 2×pad) / (N − 1)
      - x_i = pad + i×stepX
      - y_i = h − pad − round((v_i / maxY) × (h − 2×pad))
    - Top bars normalization:
      - widthPct = (plays / max_plays) × 100
    - Plays histogram buckets:
      - [0–10], [11–50], [51–100], [101–500], [501–1K], [1K–5K], [5K+]
      - heightPct = (bucket_count / max_bucket_count) × 100

  - Mock population: `populateMockDataForDemo()` (modal TS:261–331)
    - Summary values and weekly series
    - Exploration metrics list (`avg_time_minutes` included)
    - Outcomes distribution (completion buckets 0–20%, 21–40%, 41–60%, 61–80%, 81–100%)
      - heightPct = (bucket_count / max_bucket_count) × 100
      - completion_rate if present, else derive via (num_completions / num_starts) × 100
    - Ratings breakdown (synthetic distribution of `num_ratings`)
    - Content effectiveness (grouped types with engagement and completion)
      - engagement% = (group plays / total plays) × 100
      - completion% = average completion_rate across group
    - Recent comments: three mock comments
    - Avg time spent: `avgTimeSpentMinutes`
    - Peak activity time: `peakActivityTime`

## Template: CreatorStatsReportModalComponent (HTML)

- File: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.html`
- Sections and bindings (selected lines):

  - Trend chart (HTML:120–127): polyline points and labels via `trendPolylinePoints` and `trendPoints`
  - Outcomes Distribution (HTML:129–141): bar heights via `h.heightPct`, labels and `badge-count` for counts
  - Plays Histogram (HTML:142–154): similar bar chart with primary gradient styling
  - Performance overview cards (HTML:158–173): shows `avg_time_minutes`, completion, plays, threads
  - Content Effectiveness (HTML:175–191): engagement%, completion%, avg score placeholder
  - Ratings & Feedback (HTML:192–215): star distribution bars, recent comments
  - Key Insights (HTML:218–234): top module, gaps, peak activity time
  - Paging controls (HTML:236–249): page size and prev/next
  - Styles (HTML:254–278): gradients, borders, hover effects, count badges, table styling

- Template null safety
  - Example: `{{ exp.num_starts != null ? exp.num_starts : 'N/A' }}`
  - Avoids `??` to be compatible with Angular template parser

## Formulas Summary Reference

- completion_rate = (num_completions / num_starts) × 100
- creator_completion_rate ≈ (Σ completions / Σ starts) × 100
- average_rating = Σ(star × count) / Σ(count)
- top_bar.widthPct = (plays / max_plays_top10) × 100
- histogram.heightPct = (bucket_count / max_bucket_count) × 100
- outcomes.heightPct = (bucket_count / max_bucket_count) × 100
- engagement% (content) = (group_plays / total_plays) × 100
- completion% (content) = avg of completion_rate across group
- trend x_i, y_i as per `computeChartsFromWeekly` mapping

## Extending the Dashboard

- Add Avg Score and precise Avg Time Spent:
  - Extend backend API to return per-exploration and creator-level metrics.
  - Bind new fields into summary cards and overview.
- Drilldowns:
  - Add per-exploration ratings histogram, click-to-expand comments.

## Quick Navigation

- TS: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.ts`
- HTML: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.html`
- Trigger: `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`
