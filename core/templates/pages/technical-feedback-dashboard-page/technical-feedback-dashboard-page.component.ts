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
import {ActivatedRoute, Router} from '@angular/router';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {
  FeedbackCardConfig,
  FeedbackFilterConfig,
  FeedbackFilterState,
  FeedbackStatus,
  PlatformFeedbackBackendResponse,
  PlatformFeedbackDetailResponse,
  PlatformFeedbackSummary,
  TECHNICAL_DASHBOARD_CARD_CONFIG,
  TECHNICAL_DASHBOARD_FILTER_CONFIG,
  TechnicalTeamType,
} from 'domain/feedback/feedback.model';
import './technical-feedback-dashboard-page.component.css';

@Component({
  selector: 'oppia-technical-feedback-dashboard-page',
  templateUrl: './technical-feedback-dashboard-page.component.html',
  styleUrls: ['./technical-feedback-dashboard-page.component.css'],
})
export class TechnicalFeedbackDashboardPageComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private windowRef: WindowRef
  ) {}
  readonly filterConfig: FeedbackFilterConfig =
    TECHNICAL_DASHBOARD_FILTER_CONFIG;
  readonly cardConfig: FeedbackCardConfig = TECHNICAL_DASHBOARD_CARD_CONFIG;

  currentPage: number = 1;
  selectedTeam: TechnicalTeamType | null = null;
  selectedReportId: string | null = null;
  feedbackSummaries: PlatformFeedbackSummary[] = [];
  displayedFeedbackSummaries: PlatformFeedbackSummary[] = [];
  nextCursor: string | null = null;
  cursorHistory: (string | null)[] = [null];
  moreFeedbackAvailable: boolean = false;
  feedbackDetailResponse: PlatformFeedbackDetailResponse | null = null;
  screenshotDataUrl: string | null = null;

  currentFilterState: FeedbackFilterState = {
    searchText: '',
    status: FeedbackStatus.OPEN,
    technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
    dateRange: {
      start: null,
      end: null,
    },
  };

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

  private loadScreenshot(): void {
    const response = this.feedbackDetailResponse;
    if (!response?.screenshot_entity_id || !response?.screenshot_filename) {
      return;
    }

    this.screenshotDataUrl = this.assetsBackendApiService.getImageUrlForPreview(
      AppConstants.ENTITY_TYPE.FEEDBACK,
      response.screenshot_entity_id,
      response.screenshot_filename
    );
  }

  private hasSameServerFilters(filterState: FeedbackFilterState): boolean {
    return (
      this.currentFilterState.status === filterState.status &&
      this.currentFilterState.technicalTeam === filterState.technicalTeam &&
      this.currentFilterState.dateRange.start?.getTime() ===
        filterState.dateRange.start?.getTime() &&
      this.currentFilterState.dateRange.end?.getTime() ===
        filterState.dateRange.end?.getTime()
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
        this.loadScreenshot();
      });
  }

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
      }
    });
  }

  onFilterChange(_filterState: FeedbackFilterState): void {
    if (
      this.hasSameServerFilters(_filterState) &&
      (this.feedbackSummaries.length > 0 ||
        this.nextCursor !== null ||
        this.currentPage > 1)
    ) {
      this.currentFilterState = _filterState;
      this.applySearch();
      return;
    }
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

  navigateBackToDashboard(): void {
    void this.router.navigateByUrl(
      '/' +
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TECHNICAL_FEEDBACK_DASHBOARD
          .ROUTE
    );
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

  private updateFeedbackStatusAsync(status: FeedbackStatus): Promise<void> {
    if (!this.selectedTeam || !this.selectedReportId) {
      return Promise.resolve();
    }

    return this.feedbackBackendApiService
      .updatePlatformFeedbackStatusAsync(
        'technical',
        this.selectedTeam,
        this.selectedReportId,
        status
      )
      .then(() => {
        if (this.feedbackDetailResponse) {
          this.feedbackDetailResponse = {
            ...this.feedbackDetailResponse,
            status,
          };
        }
        this.alertsService.addSuccessMessage(
          `Feedback status updated to ${status}.`,
          7000,
          true
        );
      });
  }

  onStatusChange(status: FeedbackStatus): void {
    void this.updateFeedbackStatusAsync(status);
  }

  onGithubTransfer(githubIssueUrl: string): void {
    void this.updateFeedbackStatusAsync(
      FeedbackStatus.TRANSFERRED_TO_GITHUB
    ).then(() => {
      this.windowRef.nativeWindow.open(githubIssueUrl, '_blank', 'noopener');
    });
  }
}
