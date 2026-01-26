// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the creator dashboard.
 */

import {Component, Renderer2} from '@angular/core';
import {AppConstants} from 'app.constants';
import {CreatorDashboardBackendApiService} from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import {CreatorDashboardConstants} from './creator-dashboard-page.constants';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {ThreadStatusDisplayService} from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import {ExplorationCreationService} from 'components/entity-creation-services/exploration-creation.service';
import {forkJoin} from 'rxjs';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CreatorDashboardData} from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import {ProfileSummary} from 'domain/user/profile-summary.model';
import {CreatorExplorationSummary} from 'domain/summary/creator-exploration-summary.model';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {ExplorationRatings} from 'domain/summary/learner-exploration-summary.model';
import {CreatorDashboardStats} from 'domain/creator_dashboard/creator-dashboard-stats.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

@Component({
  selector: 'oppia-creator-dashboard-page',
  templateUrl: './creator-dashboard-page.component.html',
})
export class CreatorDashboardPageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTab!: string;
  myExplorationsView!: string;
  publishText!: string;
  currentSortType!: string;
  currentSubscribersSortType!: string;
  EXPLORATION_DROPDOWN_STATS!: string[];
  explorationsList!: CreatorExplorationSummary[];
  collectionsList!: CollectionSummary[];
  subscribersList!: ProfileSummary[];
  // 'lastWeekStats' is null for a new creator.
  lastWeekStats!: CreatorDashboardStats | null;
  dashboardStats!: CreatorDashboardStats;
  relativeChangeInTotalPlays!: number;
  getLocaleAbbreviatedDatetimeString!: (millisSinceEpoch: number) => string;
  getHumanReadableStatus!: (status: string) => string;
  emptyDashboardImgUrl!: string;
  getAverageRating!: (ratingFrequencies: ExplorationRatings) => number | null;
  creatorCompletionRate: number | null = null;
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
  Math = Math;

  isCurrentSortDescending: boolean = false;
  isCurrentSubscriptionSortDescending: boolean = false;
  canReviewActiveThread: boolean = false;
  canCreateCollections: boolean = false;

  SUBSCRIPTION_SORT_BY_KEYS =
    CreatorDashboardConstants.SUBSCRIPTION_SORT_BY_KEYS;

  EXPLORATIONS_SORT_BY_KEYS =
    CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS;

  DEFAULT_EMPTY_TITLE = 'Untitled';
  HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS =
    CreatorDashboardConstants.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS;

  HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS =
    CreatorDashboardConstants.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS;

  DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD =
    AppConstants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR;

  constructor(
    private creatorDashboardBackendApiService: CreatorDashboardBackendApiService,
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService,
    private userService: UserService,
    private renderer: Renderer2,
    private windowDimensionsService: WindowDimensionsService,
    private dateTimeFormatService: DateTimeFormatService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private explorationCreationService: ExplorationCreationService,
    private windowRef: WindowRef
  ) {}

  EXP_PUBLISH_TEXTS = {
    defaultText:
      'This exploration is private. Publish it to receive statistics.',
    smText: 'Publish the exploration to receive statistics.',
  };

  userDashboardDisplayPreference =
    AppConstants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD;

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(username);
    return webpImageUrl;
  }

  setActiveTab(newActiveTabName: string): void {
    this.activeTab = newActiveTabName;
  }

  getExplorationUrl(explorationId: string): string {
    return '/create/' + explorationId;
  }

  getCollectionUrl(collectionId: string): string {
    return '/collection_editor/create/' + collectionId;
  }

  setMyExplorationsView(newViewType: string): void {
    this.myExplorationsView = newViewType;
    this.creatorDashboardBackendApiService
      .postExplorationViewAsync(newViewType)
      .then(() => {});
  }

  checkMobileView(): boolean {
    return this.windowRef.nativeWindow.innerWidth < 500;
  }

  showUsernamePopover(subscriberUsername: string | string[]): string {
    // The popover on the subscription card is only shown if the length
    // of the subscriber username is greater than 10 and the user hovers
    // over the truncated username.
    if (subscriberUsername.length > 10) {
      return 'mouseenter';
    } else {
      return 'none';
    }
  }

  getTrustedResourceUrl(imageFileName: string): string {
    return decodeURIComponent(imageFileName);
  }

  checkTabletView(): boolean {
    return this.windowDimensionsService.getWidth() < 768;
  }

  updatesGivenScreenWidth(): void {
    if (this.checkMobileView()) {
      // For mobile users, the view of the creators
      // exploration list is shown only in
      // the card view and can't be switched to list view.
      this.myExplorationsView =
        AppConstants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD;
      this.publishText = this.EXP_PUBLISH_TEXTS.smText;
    } else {
      // For computer users or users operating in larger screen size
      // the creator exploration list will come back to its previously
      // selected view (card or list) when resized from mobile view.
      this.myExplorationsView = this.userDashboardDisplayPreference;
      this.publishText = this.EXP_PUBLISH_TEXTS.defaultText;
    }
  }

  setExplorationsSortingOptions(sortType: string): void {
    if (sortType === this.currentSortType) {
      this.isCurrentSortDescending = !this.isCurrentSortDescending;
    } else {
      this.currentSortType = sortType;
    }
  }

  setSubscriptionSortingOptions(sortType: string): void {
    if (sortType === this.currentSubscribersSortType) {
      this.isCurrentSubscriptionSortDescending =
        !this.isCurrentSubscriptionSortDescending;
    } else {
      this.currentSubscribersSortType = sortType;
    }
  }

  sortSubscriptionFunction(): string {
    return this.currentSubscribersSortType;
  }

  sortByFunction(): string {
    if (
      this.currentSortType ===
      CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.RATING
    ) {
      // TODO(sll): Find a better way to sort explorations according to
      // average ratings. Currently there is no parameter as such
      // average ratings in entities received by SortByPipe.
      return 'default';
    } else {
      return this.currentSortType;
    }
  }

  getCompleteThumbnailIconUrl(iconUrl: string): string {
    return this.urlInterpolationService.getStaticImageUrl(iconUrl);
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then(userInfo => {
      this.canCreateCollections = userInfo.canCreateCollections();
    });

    let dashboardDataPromise =
      this.creatorDashboardBackendApiService.fetchDashboardDataAsync();
    dashboardDataPromise.then((response: CreatorDashboardData) => {
      let responseData = response;
      this.currentSortType =
        CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK;
      this.currentSubscribersSortType =
        CreatorDashboardConstants.SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
      this.isCurrentSortDescending = true;
      this.isCurrentSubscriptionSortDescending = true;
      this.explorationsList = responseData.explorationsList;
      this.collectionsList = responseData.collectionsList;
      this.subscribersList = responseData.subscribersList;
      this.dashboardStats = responseData.dashboardStats;
      this.lastWeekStats = responseData.lastWeekStats;
      this.myExplorationsView = responseData.displayPreference;

      this.initStatsReport();

      if (this.dashboardStats && this.lastWeekStats) {
        this.relativeChangeInTotalPlays =
          this.dashboardStats.totalPlays - this.lastWeekStats.totalPlays;
      }

      if (
        this.explorationsList.length === 0 &&
        this.collectionsList.length > 0
      ) {
        this.activeTab = 'myCollections';
      } else {
        this.activeTab = 'myExplorations';
      }
    });

    forkJoin([userInfoPromise, dashboardDataPromise]).subscribe(() => {
      this.loaderService.hideLoadingScreen();
    });

    this.getAverageRating = this.ratingComputationService.computeAverageRating;
    this.getLocaleAbbreviatedDatetimeString =
      this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString;
    this.getHumanReadableStatus =
      this.threadStatusDisplayService.getHumanReadableStatus;

    this.emptyDashboardImgUrl =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/general/empty_dashboard.svg'
      );
    this.canReviewActiveThread = false;
    this.updatesGivenScreenWidth();

    this.renderer.listen('window', 'resize', () => {
      this.updatesGivenScreenWidth();
    });
  }

  createNewExploration(): void {
    this.explorationCreationService.createNewExploration();
  }

  returnZero(): number {
    // This function is used as a custom function to
    // sort heading in the list view. Directly assigning
    // keyvalue : 0 gives error "TypeError: The comparison function
    // must be either a function or undefined".
    return 0;
  }

  async initStatsReport(): Promise<void> {
    const forceMock = false;
    try {
      const report =
        await this.creatorDashboardBackendApiService.fetchCreatorStatsReportAsync();
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
        total_subscribers: this.subscribersList?.length || 0,
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
    this.pageSize = parseInt(size, 10);
    this.pageIndex = 0;
  }

  prevPage(): void {
    if (this.pageIndex > 0) this.pageIndex--;
  }

  nextPage(): void {
    if ((this.pageIndex + 1) * this.pageSize < this.filteredExplorations.length)
      this.pageIndex++;
  }

  get filteredExplorations() {
    const now = Date.now();
    return this.reportExplorations.filter(e => {
      if (
        this.filterText &&
        !e.title.toLowerCase().includes(this.filterText.toLowerCase())
      )
        return false;
      if (this.filterKey === 'high_rating') return (e.average_rating ?? 0) >= 4;
      if (this.filterKey === 'low_rating')
        return e.average_rating !== null && e.average_rating <= 2;
      if (this.filterKey === 'has_open_threads') return e.num_open_threads > 0;
      if (this.filterKey === 'recently_updated')
        return now - e.last_updated_msec < 30 * 86400000;
      if (this.filterKey === 'high_plays') return e.plays >= 1000;
      return true;
    });
  }

  pageExplorations() {
    const start = this.pageIndex * this.pageSize;
    return this.filteredExplorations.slice(start, start + this.pageSize);
  }

  exportJson(): void {
    const data = JSON.stringify(
      {
        summary: this.reportSummary,
        explorations: this.reportExplorations,
      },
      null,
      2
    );
    const blob = new Blob([data], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creator_stats_report.json';
    a.click();
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
