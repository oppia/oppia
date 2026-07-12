// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for Technical feedback dashboard.
 */
import {Component} from '@angular/core';
import {
  TECHNICAL_DASHBOARD_FILTER_CONFIG,
  TECHNICAL_DASHBOARD_CARD_CONFIG,
  FeedbackStatus,
  TechnicalTeamType,
} from '../../domain/feedback/feedback.model';
import type {
  FeedbackFilterConfig,
  FeedbackCardConfig,
  FeedbackFilterState,
  PlatformFeedbackSummary,
  PlatformFeedbackBackendResponse,
  PlatformFeedbackDetailResponse,
} from '../../domain/feedback/feedback.model';
import {ActivatedRoute, Router} from '@angular/router';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-technical-feedback-dashboard-page',
  templateUrl: './technical-feedback-dashboard-page.component.html',
  styleUrls: ['./technical-feedback-dashboard-page.component.css'],
})
export class TechnicalFeedbackDashboardPageComponent {
  constructor(
    private feedbackBackendApiService: FeedbackBackendApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  readonly filterConfig: FeedbackFilterConfig =
    TECHNICAL_DASHBOARD_FILTER_CONFIG;
  readonly feedbackCardConfig: FeedbackCardConfig =
    TECHNICAL_DASHBOARD_CARD_CONFIG;

  currentPage: number = 1;
  selectedTeam: TechnicalTeamType | null = null;
  selectedReportId: string | null = null;
  feedbackSummaries: PlatformFeedbackSummary[] = [];
  displayedFeedbackSummaries: PlatformFeedbackSummary[] = [];
  nextCursor: string | null = null;
  cursorHistory: (string | null)[] = [null];
  moreFeedbackAvailable: boolean = false;
  feedbackDetailResponse: PlatformFeedbackDetailResponse | null = null;
  currentFilterState: FeedbackFilterState = {
    searchText: '',
    status: FeedbackStatus.OPEN,
    technicalTeam: TechnicalTeamType.LEAP,
    dateRange: {
      start: null,
      end: null,
    },
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      const team = paramMap.get('team');
      const reportId = paramMap.get('reportId');
      this.selectedTeam = team as TechnicalTeamType | null;
      this.selectedReportId = reportId;

      if (team === null || reportId === null) {
        this.onFilterChange(this.currentFilterState);
      } else {
        this.loadFeedbackDetails(team as TechnicalTeamType, reportId);
        console.log('Open report2:', team, reportId);
      }
    });
  }

  private updateFeedbackPage(response: PlatformFeedbackBackendResponse): void {
    this.feedbackSummaries = response.summaries;
    this.nextCursor = response.next_cursor;
    this.moreFeedbackAvailable = response.more;
    this.applySearch();
  }

  private applySearch(): void {
    const search = (this.currentFilterState.searchText ?? '')
      .trim()
      .toLowerCase();
    if (!search) {
      this.displayedFeedbackSummaries = [...this.feedbackSummaries];
      return;
    }
    this.displayedFeedbackSummaries = this.feedbackSummaries.filter(feedback =>
      feedback.report_message_preview.toLowerCase().includes(search)
    );
  }

  private loadFeedbackDetails(
    team: TechnicalTeamType,
    feedbackId: string
  ): void {
    this.feedbackBackendApiService
      .fetchPlatformFeedbackDetailAsync('technical', team, feedbackId)
      .then(response => {
        this.feedbackDetailResponse = response;
      });
  }
  navigateToDashboard(): void {
    void this.router.navigateByUrl(
      '/' +
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TECHNICAL_FEEDBACK_DASHBOARD
          .ROUTE
    );
  }

  onFilterChange(_filterState: FeedbackFilterState): void {
    this.currentFilterState = _filterState;
    this.currentPage = 1;
    this.cursorHistory = [null];
    this.nextCursor = null;
    const response =
      this.feedbackBackendApiService.fetchTechnicalDashboardFeedbackListAsync(
        _filterState,
        this.nextCursor
      );
    response.then(response => {
      this.updateFeedbackPage(response);
    });
  }

  onRowClick(feedbackId: string): void {
    const route =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TECHNICAL_FEEDBACK_DETAIL.ROUTE.replace(
        ':team',
        this.currentFilterState.technicalTeam
      ).replace(':reportId', encodeURIComponent(feedbackId));

    void this.router.navigateByUrl('/' + route);
  }

  onNextPage(): void {
    if (!this.moreFeedbackAvailable || !this.nextCursor) {
      return;
    }
    const nextPageIndex = this.currentPage;
    if (this.cursorHistory.length === nextPageIndex) {
      this.cursorHistory.push(this.nextCursor);
    }
    this.feedbackBackendApiService
      .fetchTechnicalDashboardFeedbackListAsync(
        this.currentFilterState,
        this.nextCursor
      )
      .then(response => {
        this.updateFeedbackPage(response);
        this.currentPage++;
      });
  }

  onPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    const previousPageCursor = this.cursorHistory[this.currentPage - 2];
    this.feedbackBackendApiService
      .fetchTechnicalDashboardFeedbackListAsync(
        this.currentFilterState,
        previousPageCursor
      )
      .then(response => {
        this.updateFeedbackPage(response);
        this.currentPage--;
      });
  }
}
