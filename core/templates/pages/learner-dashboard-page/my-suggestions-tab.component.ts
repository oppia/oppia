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

import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  FeedbackStatus,
  LessonFeedbackDetailResponse,
  LessonFeedbackSummary,
} from 'domain/feedback/feedback.model';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UrlService} from 'services/contextual/url.service';

interface LearnerFeedbackStatusDetails {
  label: string;
  className: string;
  tooltip: string | null;
}

@Component({
  selector: 'oppia-my-suggestions-tab',
  templateUrl: './my-suggestions-tab.component.html',
  styleUrls: ['./my-suggestions-tab.component.css'],
})
export class MySuggestionsTabComponent implements OnInit {
  @Output() unreadCountChanged = new EventEmitter<number>();
  @ViewChild('followUpModal') followUpModal!: TemplateRef<unknown>;

  feedbackSummaries: LessonFeedbackSummary[] = [];
  selectedFeedback: LessonFeedbackDetailResponse | null = null;
  selectedFeedbackId: string | null = null;
  nextCursor: string | null = null;
  moreFeedbackAvailable: boolean = false;
  isLoadingList: boolean = false;
  isLoadingDetail: boolean = false;
  isSubmittingFollowUp: boolean = false;
  followUpText: string = '';
  errorMessage: string | null = null;
  followUpModalRef: NgbModalRef | null = null;

  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private ngbModal: NgbModal,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    const urlParams = this.urlService.getUrlParams();
    const feedbackId = urlParams.feedback_id || urlParams.feedbackId || null;
    this.fetchFeedbackSummaries(feedbackId);
  }

  fetchFeedbackSummaries(feedbackIdToOpen: string | null = null): void {
    this.isLoadingList = true;
    this.errorMessage = null;
    this.feedbackBackendApiService
      .fetchMyFeedbackListAsync(this.nextCursor)
      .then(response => {
        this.feedbackSummaries = [
          ...this.feedbackSummaries,
          ...response.summaries,
        ];
        this.nextCursor = response.next_cursor;
        this.moreFeedbackAvailable = response.more;
        this.isLoadingList = false;
        this.emitUnreadCount();
        if (feedbackIdToOpen) {
          this.openFeedback(feedbackIdToOpen);
        }
      })
      .catch(() => {
        this.errorMessage = 'Failed to load your suggestions.';
        this.isLoadingList = false;
      });
  }

  openFeedback(feedbackId: string): void {
    this.selectedFeedbackId = feedbackId;
    this.selectedFeedback = null;
    this.isLoadingDetail = true;
    this.errorMessage = null;
    this.feedbackBackendApiService
      .fetchMyFeedbackDetailAsync(feedbackId)
      .then(response => {
        this.selectedFeedback = response;
        this.markFeedbackSummaryAsRead(feedbackId);
        this.isLoadingDetail = false;
        setTimeout(() => {
          this.focusSelectedFeedback();
        });
      })
      .catch(() => {
        this.errorMessage = 'Failed to load this suggestion.';
        this.isLoadingDetail = false;
      });
  }

  showAllFeedback(): void {
    this.selectedFeedbackId = null;
    this.selectedFeedback = null;
    this.followUpText = '';
  }

  canAddFollowUpNote(): boolean {
    return this.selectedFeedback?.status === FeedbackStatus.FIXED;
  }

  openFollowUpModal(): void {
    if (!this.canAddFollowUpNote()) {
      return;
    }
    this.followUpModalRef = this.ngbModal.open(this.followUpModal, {
      backdrop: 'static',
    });
  }

  submitFollowUp(): void {
    if (!this.selectedFeedbackId || !this.followUpText.trim()) {
      return;
    }
    const feedbackText = this.followUpText.trim();
    this.isSubmittingFollowUp = true;
    this.errorMessage = null;
    this.feedbackBackendApiService
      .submitMyFeedbackFollowUpAsync(this.selectedFeedbackId, feedbackText)
      .then(() => {
        this.followUpText = '';
        this.isSubmittingFollowUp = false;
        this.followUpModalRef?.close();
        this.followUpModalRef = null;
        this.feedbackSummaries = [];
        this.nextCursor = null;
        this.fetchFeedbackSummaries(this.selectedFeedbackId);
      })
      .catch(() => {
        this.errorMessage = 'Failed to submit your follow-up note.';
        this.isSubmittingFollowUp = false;
      });
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

  formatDate(timestampMsecs: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      timestampMsecs
    );
  }

  getNotificationSummary(summary: LessonFeedbackSummary): string {
    if (summary.status === FeedbackStatus.FIXED) {
      return (
        'A creator fixed an error you reported. Thank you for helping make ' +
        'Oppia better for everyone!'
      );
    }
    if (summary.unread_response_count > 0) {
      return 'A creator responded to your feedback!';
    }
    return summary.feedback_text_preview;
  }

  private focusSelectedFeedback(): void {
    if (!this.selectedFeedbackId) {
      return;
    }
    const selectedFeedbackElement = document.querySelector<HTMLElement>(
      '.e2e-test-my-suggestions-detail'
    );
    if (selectedFeedbackElement) {
      selectedFeedbackElement.focus();
      selectedFeedbackElement.scrollIntoView({
        block: 'center',
      });
    }
  }

  private markFeedbackSummaryAsRead(feedbackId: string): void {
    this.feedbackSummaries = this.feedbackSummaries.map(summary => {
      if (summary.id !== feedbackId) {
        return summary;
      }
      return {
        ...summary,
        unread_response_count: 0,
      };
    });
    this.emitUnreadCount();
  }

  private emitUnreadCount(): void {
    this.unreadCountChanged.emit(
      this.feedbackSummaries.reduce(
        (count, summary) => count + summary.unread_response_count,
        0
      )
    );
  }
}
