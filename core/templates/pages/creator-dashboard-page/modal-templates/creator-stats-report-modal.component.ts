import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {CreatorDashboardStats} from 'domain/creator_dashboard/creator-dashboard-stats.model';
import {CreatorExplorationSummary} from 'domain/summary/creator-exploration-summary.model';
import {CreatorDashboardBackendApiService} from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';

@Component({
  selector: 'oppia-creator-stats-report-modal',
  templateUrl: './creator-stats-report-modal.component.html',
})
export class CreatorStatsReportModalComponent implements OnInit {
  dashboardStats!: CreatorDashboardStats;
  creatorCompletionRate!: number | null;
  subscribersCount!: number;
  explorationsList!: CreatorExplorationSummary[];
  reportSummary?: {
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
  reportExplorations: Array<{
    id: string;
    title: string;
    num_open_threads: number;
    average_rating: number | null;
    plays: number;
    num_starts?: number;
    num_completions?: number;
    completion_rate?: number | null;
    avg_time_minutes?: number;
    last_updated_msec: number;
  }> = [];
  sortKey: 'plays' | 'average_rating' | 'num_open_threads' = 'plays';
  sortDir: 'asc' | 'desc' = 'desc';
  filterText: string = '';
  filterKey:
    | 'all'
    | 'high_rating'
    | 'low_rating'
    | 'has_open_threads'
    | 'recently_updated'
    | 'high_plays' = 'all';
  pageIndex: number = 0;
  pageSize: number = 10;

  topExplorationBars: Array<{label: string; value: number; widthPct: number}> =
    [];
  histogram: Array<{label: string; count: number; heightPct: number}> = [];
  trendPoints: Array<{x: number; y: number; label: string; value: number}> = [];
  trendPolylinePoints: string = '';

  outcomesDistribution: Array<{
    label: string;
    count: number;
    heightPct: number;
  }> = [];
  ratingsBreakdown: Array<{stars: number; count: number}> = [];
  contentEffectiveness: Array<{
    type: string;
    engagement: number;
    completion: number;
    avgScore?: number;
    delta?: number;
  }> = [];
  recentComments: Array<{author: string; text: string; ago: string}> = [];
  peakActivityTime: string = '';
  avgTimeSpentMinutes?: number;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private backendApi: CreatorDashboardBackendApiService,
    private ratingComputationService: RatingComputationService
  ) {}

  close(): void {
    this.ngbActiveModal.close();
  }

  async ngOnInit(): Promise<void> {
    const forceMock = true;
    try {
      const report = await this.backendApi.fetchCreatorStatsReportAsync();
      this.reportSummary = report.summary;
      this.reportExplorations = report.explorations;
      this.applySorting();
      const weeklySeries = this.reportSummary?.weekly_series ?? [];
      this.computeChartsFromWeekly(weeklySeries);
    } catch (e) {
      this.reportSummary = {
        num_ratings: this.dashboardStats?.numRatings || 0,
        average_ratings: this.dashboardStats?.averageRatings || null,
        total_plays: this.dashboardStats?.totalPlays || 0,
        total_open_feedback: this.dashboardStats?.totalOpenFeedback || 0,
        total_subscribers: this.subscribersCount || 0,
        creator_completion_rate: this.creatorCompletionRate || null,
      };
      this.reportExplorations = (this.explorationsList || []).map(exp => ({
        id: exp.id,
        title: exp.title,
        num_open_threads: exp.numOpenThreads,
        average_rating: this.ratingComputationService.computeAverageRating(
          exp.ratings
        ),
        plays: exp.numViews,
        last_updated_msec: exp.lastUpdatedMsec,
      }));
      this.applySorting();
      this.computeChartsFromWeekly([]);
    }

    if (forceMock) {
      this.populateMockDataForDemo();
    }
  }

  setSort(key: 'plays' | 'average_rating' | 'num_open_threads'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'desc';
    }
    this.applySorting();
  }

  applySorting(): void {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.reportExplorations.sort((a, b) => {
      const av = a[this.sortKey] ?? 0;
      const bv = b[this.sortKey] ?? 0;
      return av === bv ? 0 : av > bv ? dir : -dir;
    });
  }

  setFilter(
    key:
      | 'all'
      | 'high_rating'
      | 'low_rating'
      | 'has_open_threads'
      | 'recently_updated'
      | 'high_plays'
  ): void {
    this.filterKey = key;
    this.pageIndex = 0;
  }

  setPageSize(size: string): void {
    const n = parseInt(size, 10);
    if (!isNaN(n) && n > 0) {
      this.pageSize = n;
      this.pageIndex = 0;
    }
  }

  nextPage(): void {
    const total = this.filteredExplorations().length;
    const maxIndex = Math.max(0, Math.ceil(total / this.pageSize) - 1);
    if (this.pageIndex < maxIndex) {
      this.pageIndex += 1;
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
    }
  }

  filteredExplorations(): Array<{
    id: string;
    title: string;
    num_open_threads: number;
    average_rating: number | null;
    plays: number;
    num_starts?: number;
    num_completions?: number;
    completion_rate?: number | null;
    last_updated_msec: number;
  }> {
    const text = this.filterText.trim().toLowerCase();
    return this.reportExplorations.filter(exp => {
      let ok = true;
      if (text) {
        ok = (exp.title || '').toLowerCase().includes(text);
      }
      if (!ok) return false;
      switch (this.filterKey) {
        case 'high_rating':
          return (exp.average_rating ?? 0) >= 4.0;
        case 'low_rating':
          return (
            (exp.average_rating ?? 0) > 0 && (exp.average_rating ?? 0) <= 2.0
          );
        case 'has_open_threads':
          return exp.num_open_threads > 0;
        case 'recently_updated':
          return Date.now() - exp.last_updated_msec < 1000 * 60 * 60 * 24 * 30;
        case 'high_plays':
          return exp.plays >= 1000;
        default:
          return true;
      }
    });
  }

  pageExplorations(): Array<{
    id: string;
    title: string;
    num_open_threads: number;
    average_rating: number | null;
    plays: number;
    num_starts?: number;
    num_completions?: number;
    completion_rate?: number | null;
    avg_time_minutes?: number;
    last_updated_msec: number;
  }> {
    const start = this.pageIndex * this.pageSize;
    const items = this.filteredExplorations();
    return items.slice(start, start + this.pageSize);
  }

  exportJson(): void {
    const data = {
      summary: this.reportSummary,
      explorations: this.reportExplorations,
    };
    const a = window.document.createElement('a');
    a.href =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(data));
    a.download = 'creator_stats.json';
    a.click();
  }

  private computeCharts(
    currentPlays: number,
    lastWeekPlays: number | null
  ): void {
    const playsList = (this.reportExplorations || []).map(e => ({
      label: e.title || 'Untitled',
      value: e.plays || 0,
    }));
    const top = playsList.sort((a, b) => b.value - a.value).slice(0, 10);
    const maxVal = Math.max(1, ...top.map(t => t.value));
    this.topExplorationBars = top.map(t => ({
      label: t.label,
      value: t.value,
      widthPct: Math.round((t.value / maxVal) * 100),
    }));

    const buckets: Array<{
      min: number;
      max: number | null;
      label: string;
      count: number;
    }> = [
      {min: 0, max: 10, label: '0–10', count: 0},
      {min: 11, max: 50, label: '11–50', count: 0},
      {min: 51, max: 100, label: '51–100', count: 0},
      {min: 101, max: 500, label: '101–500', count: 0},
      {min: 501, max: 1000, label: '501–1K', count: 0},
      {min: 1001, max: 5000, label: '1K–5K', count: 0},
      {min: 5001, max: null, label: '5K+', count: 0},
    ];
    for (const e of playsList) {
      for (const b of buckets) {
        if (
          (b.max === null && e.value >= b.min) ||
          (e.value >= b.min && e.value <= (b.max as number))
        ) {
          b.count += 1;
          break;
        }
      }
    }
    const maxCount = Math.max(1, ...buckets.map(b => b.count));
    this.histogram = buckets.map(b => ({
      label: b.label,
      count: b.count,
      heightPct: Math.round((b.count / maxCount) * 100),
    }));

    const w = 320;
    const h = 120;
    const pad = 20;
    const series: Array<{label: string; value: number | null}> = [
      {label: 'Last Week', value: lastWeekPlays},
      {label: 'Current', value: currentPlays},
    ];
    const vals = series
      .filter(s => s.value !== null)
      .map(s => s.value as number);
    const maxY = Math.max(1, ...vals);
    const stepX = (w - pad * 2) / Math.max(1, series.length - 1);
    this.trendPoints = series.map((s, i) => {
      const x = pad + i * stepX;
      const v = s.value ?? 0;
      const y = h - pad - Math.round((v / maxY) * (h - pad * 2));
      return {x, y, label: s.label, value: v};
    });
    this.trendPolylinePoints = this.trendPoints
      .map(p => p.x + ',' + p.y)
      .join(' ');
  }

  private populateMockDataForDemo(): void {
    this.reportSummary = {
      num_ratings: 120,
      average_ratings: 4.2,
      total_plays: 18450,
      total_open_feedback: 7,
      total_subscribers: 1234,
      creator_completion_rate: 62,
      weekly_series: Array.from({length: 12}, (_, i) => ({
        date: `Week ${i + 1}`,
        num_ratings: 0,
        average_ratings: null,
        total_plays: 1200 + i * 80,
      })),
    };
    this.avgTimeSpentMinutes = 42;
    this.peakActivityTime = 'Wed 5–6 PM';
    this.reportExplorations = [
      {
        id: 'e1',
        title: 'Algebra Basics',
        num_open_threads: 2,
        average_rating: 4.6,
        plays: 4200,
        num_starts: 3600,
        num_completions: 2400,
        completion_rate: 67,
        avg_time_minutes: 48,
        last_updated_msec: Date.now() - 3 * 86400000,
      },
      {
        id: 'e2',
        title: 'Fractions 101',
        num_open_threads: 1,
        average_rating: 4.1,
        plays: 3100,
        num_starts: 2500,
        num_completions: 1500,
        completion_rate: 60,
        avg_time_minutes: 37,
        last_updated_msec: Date.now() - 10 * 86400000,
      },
      {
        id: 'e3',
        title: 'Negative Numbers',
        num_open_threads: 0,
        average_rating: 3.8,
        plays: 2600,
        num_starts: 2200,
        num_completions: 1100,
        completion_rate: 50,
        avg_time_minutes: 33,
        last_updated_msec: Date.now() - 20 * 86400000,
      },
      {
        id: 'e4',
        title: 'Ratios & Proportions',
        num_open_threads: 3,
        average_rating: 4.5,
        plays: 3600,
        num_starts: 3000,
        num_completions: 2100,
        completion_rate: 70,
        avg_time_minutes: 52,
        last_updated_msec: Date.now() - 5 * 86400000,
      },
      {
        id: 'e5',
        title: 'Decimals Practice',
        num_open_threads: 1,
        average_rating: 3.9,
        plays: 1950,
        num_starts: 1500,
        num_completions: 900,
        completion_rate: 60,
        avg_time_minutes: 29,
        last_updated_msec: Date.now() - 15 * 86400000,
      },
    ];
    this.applySorting();
    this.computeChartsFromWeekly(this.reportSummary.weekly_series!);

    const buckets: Array<{
      min: number;
      max: number;
      label: string;
      count: number;
    }> = [
      {min: 0, max: 20, label: '0–20%', count: 0},
      {min: 21, max: 40, label: '21–40%', count: 0},
      {min: 41, max: 60, label: '41–60%', count: 0},
      {min: 61, max: 80, label: '61–80%', count: 0},
      {min: 81, max: 100, label: '81–100%', count: 0},
    ];
    for (const e of this.reportExplorations) {
      const cr =
        e.completion_rate != null
          ? e.completion_rate
          : e.num_starts && e.num_completions
            ? Math.round((e.num_completions / e.num_starts) * 100)
            : null;
      if (cr == null) continue;
      for (const b of buckets) {
        if (cr >= b.min && cr <= b.max) {
          b.count += 1;
          break;
        }
      }
    }
    const maxCount = Math.max(1, ...buckets.map(b => b.count));
    this.outcomesDistribution = buckets.map(b => ({
      label: b.label,
      count: b.count,
      heightPct: Math.round((b.count / maxCount) * 100),
    }));

    const totalRatings = this.reportSummary.num_ratings || 1;
    this.ratingsBreakdown = [
      {stars: 5, count: Math.round(totalRatings * 0.35)},
      {stars: 4, count: Math.round(totalRatings * 0.3)},
      {stars: 3, count: Math.round(totalRatings * 0.2)},
      {stars: 2, count: Math.round(totalRatings * 0.1)},
      {stars: 1, count: Math.round(totalRatings * 0.05)},
    ];

    const totalPlays = this.reportExplorations.reduce(
      (s, e) => s + (e.plays || 0),
      0
    );
    const groups: {[k: string]: string[]} = {
      'Video Lessons': ['e1', 'e4'],
      'Interactive Quiz': ['e2'],
      'Audio Content': ['e3'],
      'Visual Diagrams': ['e5'],
    };
    this.contentEffectiveness = Object.keys(groups).map(type => {
      const ids = groups[type];
      const arr = this.reportExplorations.filter(e => ids.includes(e.id));
      const plays = arr.reduce((s, e) => s + e.plays, 0);
      const engagement =
        totalPlays > 0 ? Math.round((plays / totalPlays) * 100) : 0;
      const compRates = arr.map(e => e.completion_rate || 0);
      const completion = compRates.length
        ? Math.round(compRates.reduce((s, v) => s + v, 0) / compRates.length)
        : 0;
      return {
        type,
        engagement,
        completion,
        avgScore: undefined,
        delta: undefined,
      };
    });

    this.recentComments = [
      {
        author: 'LearnerA',
        text: 'Great explanation, helped a lot!',
        ago: '1 day ago',
      },
      {
        author: 'LearnerB',
        text: 'Quiz was engaging and fun.',
        ago: '3 days ago',
      },
      {author: 'LearnerC', text: 'Could use more examples.', ago: '5 days ago'},
    ];
  }

  private computeChartsFromWeekly(
    weekly: Array<{date: string; total_plays: number}>
  ): void {
    const playsList = (this.reportExplorations || []).map(e => ({
      label: e.title || 'Untitled',
      value: e.plays || 0,
    }));
    const top = playsList.sort((a, b) => b.value - a.value).slice(0, 10);
    const maxVal = Math.max(1, ...top.map(t => t.value));
    this.topExplorationBars = top.map(t => ({
      label: t.label,
      value: t.value,
      widthPct: Math.round((t.value / maxVal) * 100),
    }));

    const buckets: Array<{
      min: number;
      max: number | null;
      label: string;
      count: number;
    }> = [
      {min: 0, max: 10, label: '0–10', count: 0},
      {min: 11, max: 50, label: '11–50', count: 0},
      {min: 51, max: 100, label: '51–100', count: 0},
      {min: 101, max: 500, label: '101–500', count: 0},
      {min: 501, max: 1000, label: '501–1K', count: 0},
      {min: 1001, max: 5000, label: '1K–5K', count: 0},
      {min: 5001, max: null, label: '5K+', count: 0},
    ];
    for (const e of playsList) {
      for (const b of buckets) {
        if (
          (b.max === null && e.value >= b.min) ||
          (e.value >= b.min && e.value <= (b.max as number))
        ) {
          b.count += 1;
          break;
        }
      }
    }
    const maxCount = Math.max(1, ...buckets.map(b => b.count));
    this.histogram = buckets.map(b => ({
      label: b.label,
      count: b.count,
      heightPct: Math.round((b.count / maxCount) * 100),
    }));

    const w = 320;
    const h = 120;
    const pad = 20;
    const series = weekly
      .slice(-12)
      .map(wi => ({label: wi.date, value: wi.total_plays}));
    const vals = series.map(s => s.value);
    const maxY = Math.max(1, ...vals);
    const stepX = (w - pad * 2) / Math.max(1, series.length - 1);
    this.trendPoints = series.map((s, i) => {
      const x = pad + i * stepX;
      const v = s.value ?? 0;
      const y = h - pad - Math.round((v / maxY) * (h - pad * 2));
      return {x, y, label: s.label, value: v};
    });
    this.trendPolylinePoints = this.trendPoints
      .map(p => p.x + ',' + p.y)
      .join(' ');
  }
}
