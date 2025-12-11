import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CreatorDashboardBackendApiService} from 'domain/creator_dashboard/creator-dashboard-backend-api.service';

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

@Component({
  selector: 'oppia-creator-stats-page',
  templateUrl: './creator-stats-page.component.html',
})
export class CreatorStatsPageComponent implements OnInit {
  constructor(
    private backendApi: CreatorDashboardBackendApiService,
    private http: HttpClient
  ) {}

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

  reportExplorations: ReportExploration[] = [];

  tab: 'analytics' | 'posts' | 'financials' = 'analytics';

  sortKey:
    | 'title'
    | 'plays'
    | 'average_rating'
    | 'num_open_threads'
    | 'completion_rate'
    | 'last_updated_msec' = 'plays';
  sortDir: 'asc' | 'desc' = 'desc';
  filterKey:
    | 'all'
    | 'high_rating'
    | 'low_rating'
    | 'has_open_threads'
    | 'recently_updated'
    | 'high_plays' = 'all';
  filterText = '';
  pageSize = 10;
  pageNumber = 1;

  topExplorationBars: Array<{label: string; value: number; widthPct: number}> =
    [];
  histogram: Array<{label: string; count: number; heightPct: number}> = [];
  selectedExplorationId: string = 'all';
  outcomesDistribution: Array<{
    label: string;
    count: number;
    heightPct: number;
  }> = [];
  trendPoints: Array<{x: number; y: number; label: string; value: number}> = [];
  trendPolylinePoints = '';
  weeklyWindow = 12;

  totalStarts: number = 0;
  totalCompletions: number = 0;
  successRate?: number;
  activeLearners: number = 0;
  avgTimeSpentHours?: number;

  ratingsBreakdown: Array<{stars: number; count: number}> = [];
  recentComments: Array<{author: string; text: string; ago: string}> = [];
  contentEffectiveness: Array<{
    type: string;
    engagement: number;
    completion: number;
    avgScore?: number;
    delta?: number;
  }> = [];

  loading = false;
  error?: string;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.backendApi.fetchCreatorStatsReportAsync();
      this.reportSummary = data.summary as this['reportSummary'];
      this.reportExplorations = (data.explorations ||
        []) as ReportExploration[];
      this.totalStarts = this.reportExplorations.reduce(
        (s, e) => s + (e.num_starts ?? 0),
        0
      );
      this.totalCompletions = this.reportExplorations.reduce(
        (s, e) => s + (e.num_completions ?? 0),
        0
      );
      this.successRate =
        this.totalStarts > 0
          ? (this.totalCompletions / this.totalStarts) * 100
          : undefined;
      this.activeLearners = this.totalStarts;
      this.applySort();
      this.computeVisuals();

      const dash = await this.backendApi.fetchDashboardDataAsync();
      const exps = (dash.explorationsList || []) as any[];
      const counts = [0, 0, 0, 0, 0];
      for (const exp of exps) {
        const r = exp.ratings || {};
        counts[0] += r['1'] || 0;
        counts[1] += r['2'] || 0;
        counts[2] += r['3'] || 0;
        counts[3] += r['4'] || 0;
        counts[4] += r['5'] || 0;
      }
      this.ratingsBreakdown = [
        {stars: 5, count: counts[4]},
        {stars: 4, count: counts[3]},
        {stars: 3, count: counts[2]},
        {stars: 2, count: counts[1]},
        {stars: 1, count: counts[0]},
      ];
      this.computeContentEffectiveness(exps);
      await this.fetchRecentComments();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }

  setTab(t: 'analytics' | 'posts' | 'financials'): void {
    this.tab = t;
  }

  filteredExplorations(): ReportExploration[] {
    const text = this.filterText.trim().toLowerCase();
    return this.reportExplorations.filter(exp => {
      if (
        this.selectedExplorationId !== 'all' &&
        exp.id !== this.selectedExplorationId
      ) {
        return false;
      }
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

  pagedExplorations(): ReportExploration[] {
    const data = this.filteredExplorations();
    const start = (this.pageNumber - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  computeVisuals(): void {
    const weekly = (this.reportSummary?.weekly_series || []).slice(
      -this.weeklyWindow
    );
    this.computeChartsFromWeekly(
      weekly.map(wi => ({date: wi.date, total_plays: wi.total_plays || 0}))
    );

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
            : undefined;
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
  }

  private computeContentEffectiveness(exps: any[]): void {
    const groups: {[k: string]: any[]} = {
      Video: [],
      Quiz: [],
      Audio: [],
      Visual: [],
    };
    for (const e of exps) {
      const tags = (e.tags || []).map((t: string) => t.toLowerCase());
      if (tags.some((t: string) => t.includes('video'))) groups.Video.push(e);
      else if (tags.some((t: string) => t.includes('quiz')))
        groups.Quiz.push(e);
      else if (tags.some((t: string) => t.includes('audio')))
        groups.Audio.push(e);
      else if (tags.some((t: string) => t.includes('visual')))
        groups.Visual.push(e);
    }
    const totalPlays = exps.reduce(
      (s, e) => s + (e.numViews || e.num_views || 0),
      0
    );
    const mk = (
      label: string,
      arr: any[]
    ): {
      type: string;
      engagement: number;
      completion: number;
      avgScore?: number;
      delta?: number;
    } => {
      const plays = arr.reduce(
        (s, e) => s + (e.numViews || e.num_views || 0),
        0
      );
      const engagement =
        totalPlays > 0 ? Math.round((plays / totalPlays) * 100) : 0;
      const compRates: number[] = [];
      for (const e of this.reportExplorations) {
        const match = arr.find(a => (a.id || a.id) === e.id);
        if (!match) continue;
        const cr =
          e.completion_rate != null
            ? e.completion_rate
            : e.num_starts && e.num_completions
              ? Math.round((e.num_completions / e.num_starts) * 100)
              : undefined;
        if (cr != null) compRates.push(cr);
      }
      const completion = compRates.length
        ? Math.round(compRates.reduce((s, v) => s + v, 0) / compRates.length)
        : 0;
      return {
        type: label,
        engagement,
        completion,
        avgScore: undefined,
        delta: undefined,
      };
    };
    this.contentEffectiveness = [
      mk('Video Lessons', groups.Video),
      mk('Interactive Quiz', groups.Quiz),
      mk('Audio Content', groups.Audio),
      mk('Visual Diagrams', groups.Visual),
    ];
  }

  private async fetchRecentComments(): Promise<void> {
    try {
      const ids = [...this.reportExplorations]
        .sort((a, b) => (b.plays || 0) - (a.plays || 0))
        .slice(0, 3)
        .map(e => e.id);
      const reqs = ids.map(id =>
        this.http
          .get<{
            feedback_thread_dicts: Array<{
              original_author_username: string;
              last_nonempty_message_text: string;
              last_updated_msecs: number;
            }>;
          }>(`/threadlisthandler/${id}`)
          .toPromise()
      );
      const results = await Promise.allSettled(reqs);
      const comments: Array<{author: string; text: string; ago: string}> = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const arr = (r.value.feedback_thread_dicts || []).filter(
            t => !!t.last_nonempty_message_text
          );
          arr.sort((a, b) => b.last_updated_msecs - a.last_updated_msecs);
          const t = arr[0];
          if (t) {
            const days = Math.max(
              0,
              Math.round(
                (Date.now() - t.last_updated_msecs) / (1000 * 60 * 60 * 24)
              )
            );
            comments.push({
              author: t.original_author_username || 'Learner',
              text: t.last_nonempty_message_text,
              ago: days ? `${days} days ago` : 'today',
            });
          }
        }
      }
      this.recentComments = comments;
    } catch {}
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
    const series = weekly.map(wi => ({label: wi.date, value: wi.total_plays}));
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
