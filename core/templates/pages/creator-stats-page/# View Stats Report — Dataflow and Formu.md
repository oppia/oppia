# View Stats Report — Dataflow and Formulas

## Overview

- Opens a popup analytics dashboard (~80% viewport) from the Creator Dashboard.
- Shows summary metrics, tables, charts, feedback, and insights using live or mock data.
- Triggered via the “View Stats Report” button; modal uses `NgbModal` with `windowClass: 'creator-stats-modal'`.

## Trigger and Routing

- Trigger button: `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.html`
- Click handler: `openStatsReportModal()` injects `NgbModal` and opens `CreatorStatsReportModalComponent`.
- Modal styling target: `creator-stats-modal` class applied via `windowClass`.

## Data Sources

- Live fetch (when available):
  - `CreatorDashboardBackendApiService.fetchCreatorStatsReportAsync()`
  - `RatingComputationService.computeAverageRating(ratings)`
- Mock data (always available in demo mode):
  - `reportSummary`: totals and weekly series
  - `reportExplorations`: per-exploration metrics (plays, rating, threads, starts, completions, completion rate, avg time)

## Core Formulas

- Per-exploration completion rate:
  - completion_rate = (num_completions / num_starts) × 100
  - If `completion_rate` is precomputed, use it; else derive from `num_starts` and `num_completions`.
- Creator-level completion rate (summary):
  - creator_completion_rate ≈ (sum of completions across explorations / sum of starts across explorations) × 100
  - In demo, set as a synthetic value in `reportSummary`.
- Average rating:
  - average_rating = Σ(star_value × count) / Σ(count)
  - Computed via `RatingComputationService` when ratings dicts are present.
- Top Explorations by Plays (bar width normalization):
  - widthPct = (plays_of_item / max_plays_among_top_items) × 100
- Histogram: Plays Distribution
  - Buckets: [0–10], [11–50], [51–100], [101–500], [501–1K], [1K–5K], [5K+]
  - heightPct for each bucket = (bucket_count / max_bucket_count) × 100
- Learning Outcomes Distribution (completion buckets)
  - Buckets: [0–20%], [21–40%], [41–60%], [61–80%], [81–100%]
  - heightPct = (bucket_count / max_bucket_count) × 100
- Content Effectiveness (mock grouping by type)
  - engagement% = (sum plays in group / total plays across all explorations) × 100
  - completion% = average of completion_rate across explorations in group
- Weekly trend points (polyline)
  - Given chart width `w`, height `h`, padding `pad`, series values `v`:
  - x_i = pad + i × ((w − 2×pad) / (N − 1))
  - y_i = h − pad − round((v_i / maxY) × (h − 2×pad))

## Visualization Bindings

- Trend line: polyline points from `trendPolylinePoints`; dots and labels bound from `trendPoints`.
- Bar charts (Outcomes and Histogram):
  - `h.heightPct` drives bar height; label and count are visible; axis baseline included.
  - Containers have explicit height; bars have a minimum height for visibility.

## Template Decisions

- Avoid `??` in Angular templates; use `(value != null ? value : 'N/A')` for null safety.
- Use structured cards (`section-card`) and consistent spacing to reduce visual noise.
- Table supports sorting, filtering, and paging; exports JSON and links to CSV.

## Error Handling

- If live fetch fails, mock population ensures the dashboard renders fully.
- Template parser errors are prevented by:
  - Balanced tags
  - No nullish coalescing
  - Explicit container heights for percentage-based charts

## Styling

- Modal header/body: soft gradients and borders.
- Cards: rounded corners, borders, subtle shadows.
- Charts: gradient bars, hover highlights, axis baseline, count badges.
- Table: border, gradient header, zebra stripes, hover rows.

## Files

- Trigger: `core/templates/pages/creator-dashboard-page/creator-dashboard-page.component.ts`
- Modal TS: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.ts`
- Modal HTML: `core/templates/pages/creator-dashboard-page/modal-templates/creator-stats-report-modal.component.html`
