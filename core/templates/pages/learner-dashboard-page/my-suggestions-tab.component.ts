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
 * @fileoverview Component for the My Suggestions tab in learner dashboard.
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  CreatorFeedbackType,
  FeedbackCardConfig,
  FeedbackFilterState,
  FeedbackStatus,
  LessonFeedbackBackendResponse,
  LessonFeedbackDetailResponse,
  LessonFeedbackSummary,
  TechnicalTeamType,
} from 'domain/feedback/feedback.model';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {AlertsService} from 'services/alerts.service';
import {LoaderService} from 'services/loader.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MY_SUGGESTIONS_FILTER_CONFIG} from '../../domain/feedback/feedback.model';
import {AddAFollowUpNoteModalComponent} from './add-a-follow-up-note-modal/add-a-follow-up-note-modal.component';

import './my-suggestions-tab.component.css';

interface LearnerFeedbackStatusDetails {
  label: string;
  className: string;
  tooltip: string | null;
}

interface LearnerFeedbackListState<TSummary> {
  summaries: TSummary[];
  displayedSummaries: TSummary[];
  currentPage: number;
  nextCursor: string | null;
  cursorHistory: (string | null)[];
  moreAvailable: boolean;
}

@Component({
  selector: 'oppia-my-suggestions-tab',
  templateUrl: './my-suggestions-tab.component.html',
  styleUrls: ['./my-suggestions-tab.component.css'],
})
export class MySuggestionsTabComponent implements OnInit {
  @Output() unreadCountChanged = new EventEmitter<number>();
  readonly learnerFeedbackFilterConfig = MY_SUGGESTIONS_FILTER_CONFIG;
  readonly learnerLessonFeedbackCardConfig: FeedbackCardConfig = {
    showCategory: false,
    showLesson: true,
    showResponse: false,
    showScreenshot: false,
    showLessonMetadata: false,
    showSessionInfo: false,
    showNotificationSummary: true,
  };

  currentLearnerFeedbackFilterState: FeedbackFilterState = {
    searchText: '',
    status: FeedbackStatus.ALL,
    technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
    creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
    dateRange: {
      start: null,
      end: null,
    },
  };
  selectedFeedbackId: string | null = null;
  selectedFeedback: LessonFeedbackDetailResponse | null = null;
  isLoading = true;
  learnerLessonFeedbackListState: LearnerFeedbackListState<LessonFeedbackSummary> =
    {
      summaries: [],
      displayedSummaries: [],
      currentPage: 1,
      nextCursor: null,
      cursorHistory: [null],
      moreAvailable: false,
    };

  constructor(
    private loaderService: LoaderService,
    private dateTimeFormatService: DateTimeFormatService,
    private urlService: UrlService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private ngbModal: NgbModal,
    private alertService: AlertsService,
    private windowRef: WindowRef,
    private bottomSheet: MatBottomSheet,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  async ngOnInit(): Promise<void> {
    const urlParams = this.urlService.getUrlParams();
    const feedbackId = urlParams.feedback_id;
    try {
      if (feedbackId) {
        await this.openFeedbackDetail(feedbackId);
      } else {
        await this.fetchLearnerFeedbackPage();
      }
    } finally {
      this.isLoading = false;
    }
  }
  getDisplayedLearnerFeedbackSummaries(): LessonFeedbackSummary[] {
    return this.learnerLessonFeedbackListState.displayedSummaries;
  }

  getLearnerFeedbackListCurrentPage(): number {
    return this.learnerLessonFeedbackListState.currentPage;
  }

  getLearnerFeedbackListMoreAvailable(): boolean {
    return this.learnerLessonFeedbackListState.moreAvailable;
  }

  onLearnerFeedbackRowClick(feedbackId: string): void {
    this.selectedFeedbackId = feedbackId;
    this.openFeedbackDetail(feedbackId);
  }

  formatDate(timestampMsecs: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      timestampMsecs
    );
  }

  getStatusDetails(status: FeedbackStatus): LearnerFeedbackStatusDetails {
    if (status === FeedbackStatus.FIXED) {
      return {
        label: 'Lesson Updated!',
        className: 'oppia-my-suggestions-status-fixed',
        tooltip:
          'A creator fixed this error! Thank you for helping make Oppia better for everyone.',
      };
    }
    if (
      status === FeedbackStatus.NOT_ACTIONABLE ||
      status === FeedbackStatus.COMPLIMENT
    ) {
      return {
        label: 'Reviewed by Team',
        className: 'oppia-my-suggestions-status-reviewed',
        tooltip: null,
      };
    }
    return {
      label: 'Submitted',
      className: 'oppia-my-suggestions-status-submitted',
      tooltip: null,
    };
  }

  getLessonStepDescription(stateName: string): string {
    return `around the "${stateName}" part of the lesson`;
  }

  private fetchLearnerFeedbackPage(
    cursor: string | null = null
  ): Promise<void> {
    this.loaderService.showLoadingScreen('Loading');
    return this.feedbackBackendApiService
      .fetchLearnerLessonFeedbackListAsync(
        this.currentLearnerFeedbackFilterState,
        cursor
      )
      .then(response => {
        this.updateLearnerLessonFeedbackPage(response);
      })
      .finally(() => this.loaderService.hideLoadingScreen());
  }

  private updateLearnerLessonFeedbackPage(
    response: LessonFeedbackBackendResponse
  ): void {
    this.learnerLessonFeedbackListState.summaries = response.summaries;

    this.learnerLessonFeedbackListState.summaries.forEach(summary => {
      if (
        summary.status === FeedbackStatus.OPEN ||
        summary.status === FeedbackStatus.FIXED
      ) {
        summary.status =
          summary.status === FeedbackStatus.OPEN
            ? FeedbackStatus.SUBMITTED
            : FeedbackStatus.LESSON_UPDATED;
      } else {
        summary.status = FeedbackStatus.REVIEWED_BY_TEAM;
      }
    });

    this.learnerLessonFeedbackListState.nextCursor = response.next_cursor;
    this.learnerLessonFeedbackListState.moreAvailable = response.more;

    this.applyLearnerFeedbackSearch(this.learnerLessonFeedbackListState);
  }

  private applyLearnerFeedbackSearch(
    state: LearnerFeedbackListState<LessonFeedbackSummary>
  ): void {
    const searchText = this.currentLearnerFeedbackFilterState.searchText
      ?.toLocaleLowerCase()
      .trim();

    if (!searchText) {
      state.displayedSummaries = [...state.summaries];
      return;
    }

    state.displayedSummaries = state.summaries.filter(summary =>
      summary.feedback_text_preview.toLocaleLowerCase().includes(searchText)
    );
  }

  onLearnerFeedbackNextPage(): void {
    const state = this.learnerLessonFeedbackListState;
    if (!state.moreAvailable || !state.nextCursor) {
      return;
    }
    const nextPage = state.currentPage;
    if (state.cursorHistory.length === nextPage) {
      state.cursorHistory.push(state.nextCursor);
    }

    this.fetchLearnerFeedbackPage(state.nextCursor).then(() => {
      state.currentPage++;
    });
  }

  onLearnerFeedbackPreviousPage(): void {
    const state = this.learnerLessonFeedbackListState;
    if (state.currentPage <= 1) {
      return;
    }

    const previousCursor = state.cursorHistory[state.currentPage - 2];
    this.fetchLearnerFeedbackPage(previousCursor).then(() => {
      state.currentPage--;
    });
  }

  private async markFeedbackSummaryAsRead(feedbackId: string): Promise<void> {
    const markSummaryRead = (
      summary: LessonFeedbackSummary
    ): LessonFeedbackSummary =>
      summary.id === feedbackId
        ? {...summary, unread_response_count: 0}
        : summary;
    const state = this.learnerLessonFeedbackListState;
    state.summaries = state.summaries.map(markSummaryRead);
    state.displayedSummaries = state.displayedSummaries.map(markSummaryRead);

    // Re-fetch the authoritative global unread total so the shared count
    // stays correct even when unread feedback exists beyond the pages that
    // are currently loaded.
    try {
      const unreadCount =
        await this.feedbackBackendApiService.fetchMyFeedbackUnreadCountAsync();
      this.unreadCountChanged.emit(unreadCount);
    } catch {
      // Leave the shared unread count unchanged when the refresh fails.
    }
  }

  async openFeedbackDetail(feedbackId: string): Promise<void> {
    this.selectedFeedbackId = feedbackId;
    this.selectedFeedback = null;
    this.loaderService.showLoadingScreen('Loading');

    try {
      const response =
        await this.feedbackBackendApiService.fetchMyFeedbackDetailAsync(
          feedbackId
        );
      if (this.selectedFeedbackId !== feedbackId) {
        return;
      }
      this.selectedFeedback = response;
      await this.markFeedbackSummaryAsRead(feedbackId);
    } catch (error) {
      this.alertService.addWarning('Failed to load this suggestion.');
    } finally {
      this.loaderService.hideLoadingScreen();
    }
  }

  canAddFollowUpNote(): boolean {
    return this.selectedFeedback?.status === FeedbackStatus.FIXED;
  }

  openFollowUpModal(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.bottomSheet.open(AddAFollowUpNoteModalComponent, {
        data: {detailFeedback: this.selectedFeedback},
      });
      return;
    }

    const modalRef = this.ngbModal.open(AddAFollowUpNoteModalComponent, {
      backdrop: 'static',
    });

    modalRef.componentInstance.detailFeedback = this.selectedFeedback;
  }

  private hasSameCreatorFeedbackServerFilters(
    filterState: FeedbackFilterState
  ): boolean {
    return (
      this.currentLearnerFeedbackFilterState.status === filterState.status &&
      this.currentLearnerFeedbackFilterState.dateRange.start?.getTime() ===
        filterState.dateRange.start?.getTime() &&
      this.currentLearnerFeedbackFilterState.dateRange.end?.getTime() ===
        filterState.dateRange.end?.getTime()
    );
  }

  onLearnerFeedbackFilterChange(filterState: FeedbackFilterState): void {
    const hasSameServerFilters =
      this.hasSameCreatorFeedbackServerFilters(filterState);

    this.currentLearnerFeedbackFilterState = filterState;

    const state = this.learnerLessonFeedbackListState;

    if (
      hasSameServerFilters &&
      (state.summaries.length > 0 ||
        state.nextCursor !== null ||
        state.currentPage > 1)
    ) {
      this.applyLearnerFeedbackSearch(this.learnerLessonFeedbackListState);
      return;
    }

    state.currentPage = 1;
    state.nextCursor = null;
    state.cursorHistory = [null];

    this.fetchLearnerFeedbackPage();
  }

  goBackToListView(): void {
    this.selectedFeedbackId = null;
    this.selectedFeedback = null;
    this.windowRef.nativeWindow.history.replaceState(
      {},
      '',
      '/learner-dashboard'
    );
    this.fetchLearnerFeedbackPage();
  }
}
