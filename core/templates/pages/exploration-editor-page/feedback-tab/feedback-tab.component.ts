// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration editor feedback tab.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {CreateFeedbackThreadModalComponent} from 'pages/exploration-editor-page/feedback-tab/templates/create-feedback-thread-modal.component';
import {AlertsService} from 'services/alerts.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {EditabilityService} from 'services/editability.service';
import {LoaderService} from 'services/loader.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {UserService} from 'services/user.service';
import {ChangeListService} from '../services/change-list.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';
import {ThreadDataBackendApiService} from './services/thread-data-backend-api.service';
import {ThreadStatusDisplayService} from './services/thread-status-display.service';
import {FeedbackThread} from 'domain/feedback_thread/feedback-thread.model';
import {SuggestionThread} from 'domain/suggestion/suggestion-thread-object.model';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  ALL_FEEDBACK_STATUS_OPTIONS,
  CREATOR_LESSON_FEEDBACK_STATUS_OPTIONS,
  CreatorFeedbackType,
  FeedbackCardConfig,
  FeedbackFilterConfig,
  FeedbackFilterState,
  FeedbackStatus,
  LessonFeedbackBackendResponse,
  LessonFeedbackDetailResponse,
  LessonFeedbackSummary,
  PlatformFeedbackBackendResponse,
  PlatformFeedbackDetailResponse,
  PlatformFeedbackSummary,
  TechnicalTeamType,
} from 'domain/feedback/feedback.model';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageContextService} from 'services/page-context.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

@Component({
  selector: 'oppia-feedback-tab',
  templateUrl: './feedback-tab.component.html',
})
export class FeedbackTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  STATUS_CHOICES = this.threadStatusDisplayService.STATUS_CHOICES;
  readonly creatorFeedbackFilterConfig: FeedbackFilterConfig = {
    showTeamFilter: false,
    showCreatorFeedbackTypeFilter: true,
    showDateRangeFilter: true,
    showSearchBar: true,
    statusOptions: ALL_FEEDBACK_STATUS_OPTIONS,
  };
  readonly creatorFeedbackCardConfig: FeedbackCardConfig = {
    showCategory: true,
    showResponse: false,
    showScreenshot: true,
    showLessonMetadata: true,
    showSessionInfo: false,
  };
  readonly creatorLessonFeedbackCardConfig: FeedbackCardConfig = {
    showCategory: false,
    showResponse: true,
    showScreenshot: false,
    showLessonMetadata: true,
    showSessionInfo: false,
  };
  readonly creatorReportStatusOptions = ALL_FEEDBACK_STATUS_OPTIONS;
  readonly creatorLessonFeedbackStatusOptions =
    CREATOR_LESSON_FEEDBACK_STATUS_OPTIONS;
  activeThread: SuggestionThread | null = null;
  userIsLoggedIn = false;
  userCanEditExploration = false;
  newCreatorFeedbackTabIsEnabled = false;
  threadIsStale = false;
  threadData: FeedbackThread[] = [];
  messageSendingInProgress = false;
  currentCreatorFeedbackPage = 1;
  creatorFeedbackSummaries: PlatformFeedbackSummary[] = [];
  displayedCreatorFeedbackSummaries: PlatformFeedbackSummary[] = [];
  creatorFeedbackNextCursor: string | null = null;
  creatorFeedbackCursorHistory: (string | null)[] = [null];
  moreCreatorFeedbackAvailable = false;
  currentCreatorLessonFeedbackPage = 1;
  creatorLessonFeedbackSummaries: LessonFeedbackSummary[] = [];
  displayedCreatorLessonFeedbackSummaries: LessonFeedbackSummary[] = [];
  creatorLessonFeedbackNextCursor: string | null = null;
  creatorLessonFeedbackCursorHistory: (string | null)[] = [null];
  moreCreatorLessonFeedbackAvailable = false;
  selectedCreatorFeedbackReportId: string | null = null;
  selectedCreatorFeedbackType: CreatorFeedbackType | null = null;
  creatorFeedbackDetailResponse:
    | PlatformFeedbackDetailResponse
    | LessonFeedbackDetailResponse
    | null = null;
  creatorFeedbackScreenshotDataUrl: string | null = null;
  currentCreatorFeedbackFilterState: FeedbackFilterState = {
    searchText: '',
    status: FeedbackStatus.OPEN,
    technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
    creatorFeedbackType: CreatorFeedbackType.REPORT,
    dateRange: {
      start: null,
      end: null,
    },
  };

  feedbackMessage: {
    status: string | null;
    text: string;
  } = {
    status: null,
    text: '',
  };

  constructor(
    private alertsService: AlertsService,
    private changeListService: ChangeListService,
    private dateTimeFormatService: DateTimeFormatService,
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private assetsBackendApiService: AssetsBackendApiService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private focusManagerService: FocusManagerService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private pageContextService: PageContextService,
    private platformFeatureService: PlatformFeatureService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  _resetFeedbackMessageFields(): void {
    this.feedbackMessage.status = this.activeThread && this.activeThread.status;
    this.feedbackMessage.text = '';
  }

  clearActiveThread(): void {
    this.activeThread = null;
    this._resetFeedbackMessageFields();
  }

  // Fetches the threads again if any thread is updated.
  fetchUpdatedThreads(): Promise<void> {
    let activeThreadId = this.activeThread && this.activeThread.threadId;
    return this.threadDataBackendApiService
      .getFeedbackThreadsAsync()
      .then(data => {
        this.threadData = data;
        this.threadIsStale = false;
        if (activeThreadId !== null) {
          // Fetching threads invalidates old thread domain objects, so we
          // need to update our reference to the active thread afterwards.
          this.activeThread = this.threadDataBackendApiService.getThread(
            activeThreadId
          ) as SuggestionThread;
        }
        this.loaderService.hideLoadingScreen();
      });
  }

  onBackButtonClicked(): void {
    this.clearActiveThread();
    if (this.threadIsStale) {
      this.fetchUpdatedThreads();
    }
  }

  _isSuggestionHandled(): boolean {
    return !!(this.activeThread && this.activeThread.isSuggestionHandled());
  }

  _isSuggestionValid(): boolean {
    const stateName = this.activeThread?.getSuggestionStateName();

    return !!(stateName && this.explorationStatesService.hasState(stateName));
  }

  _hasUnsavedChanges(): boolean {
    return this.changeListService.getChangeList().length > 0;
  }

  showCreateThreadModal(): void {
    this.ngbModal
      .open(CreateFeedbackThreadModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        result =>
          this.threadDataBackendApiService
            .createNewThreadAsync(result.newThreadSubject, result.newThreadText)
            .then(
              () => {
                this.clearActiveThread();
                this.alertsService.addSuccessMessage(
                  'Feedback thread created.'
                );
              },
              () => {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              }
            ),
        () => {}
      );
  }

  getSuggestionButtonType(): string {
    return !this._isSuggestionHandled() &&
      this._isSuggestionValid() &&
      !this._hasUnsavedChanges()
      ? 'primary'
      : 'default';
  }

  addNewMessage(threadId: string, tmpText: string, tmpStatus: string): void {
    if (threadId === null) {
      this.alertsService.addWarning(
        'Cannot add message to thread with ID: null.'
      );
      return;
    }

    if (!tmpStatus) {
      this.alertsService.addWarning('Invalid message status: ' + tmpStatus);
      return;
    }

    this.threadIsStale = true;
    this.messageSendingInProgress = true;

    let thread = this.threadDataBackendApiService.getThread(threadId);

    if (thread === null) {
      throw new Error('Trying to add message to a non-existent thread.');
    }

    this.threadDataBackendApiService
      .addNewMessageAsync(thread, tmpText, tmpStatus)
      .then(
        messages => {
          this._resetFeedbackMessageFields();
          if (this.activeThread) {
            this.activeThread.messages = messages;
          }
          this.messageSendingInProgress = false;
        },
        () => {
          this.messageSendingInProgress = false;
        }
      );
  }

  setActiveThread(threadId: string): void {
    let thread = this.threadDataBackendApiService.getThread(threadId);
    if (thread === null) {
      throw new Error('Trying to display a non-existent thread');
    }

    this.threadDataBackendApiService.getMessagesAsync(thread).then(() => {
      this.activeThread = thread as SuggestionThread;
      this.threadDataBackendApiService.markThreadAsSeenAsync(this.activeThread);
      this.feedbackMessage.status = this.activeThread.status;
      this.focusManagerService.setFocus('feedbackMessage');
    });
  }

  getLabelClass(status: string): string {
    return this.threadStatusDisplayService.getLabelClass(status);
  }

  getHumanReadableStatus(status: string): string {
    return this.threadStatusDisplayService.getHumanReadableStatus(status);
  }

  getLocaleAbbreviatedDatetimeString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch
    );
  }

  isExplorationEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  private updateCreatorFeedbackPage(
    response: PlatformFeedbackBackendResponse
  ): void {
    this.creatorFeedbackSummaries = response.summaries;
    this.creatorFeedbackNextCursor = response.next_cursor;
    this.moreCreatorFeedbackAvailable = response.more;
    this.applyCreatorFeedbackSearch();
  }

  private applyCreatorFeedbackSearch(): void {
    const search = (this.currentCreatorFeedbackFilterState.searchText ?? '')
      .trim()
      .toLowerCase();
    if (!search) {
      this.displayedCreatorFeedbackSummaries = [
        ...this.creatorFeedbackSummaries,
      ];
      return;
    }

    this.displayedCreatorFeedbackSummaries =
      this.creatorFeedbackSummaries.filter(feedback =>
        feedback.report_message_preview.toLowerCase().includes(search)
      );
  }

  private hasSameCreatorFeedbackServerFilters(
    filterState: FeedbackFilterState
  ): boolean {
    return (
      this.currentCreatorFeedbackFilterState.status === filterState.status &&
      this.currentCreatorFeedbackFilterState.dateRange.start?.getTime() ===
        filterState.dateRange.start?.getTime() &&
      this.currentCreatorFeedbackFilterState.dateRange.end?.getTime() ===
        filterState.dateRange.end?.getTime()
    );
  }

  private loadCreatorFeedbackDetails(feedbackId: string): void {
    this.selectedCreatorFeedbackType = CreatorFeedbackType.REPORT;
    this.creatorFeedbackDetailResponse = null;
    this.creatorFeedbackScreenshotDataUrl = null;
    this.feedbackBackendApiService
      .fetchPlatformFeedbackDetailAsync(
        'curriculum',
        this.pageContextService.getExplorationId(),
        feedbackId
      )
      .then(response => {
        this.creatorFeedbackDetailResponse = response;
        if (response.screenshot_entity_id && response.screenshot_filename) {
          this.creatorFeedbackScreenshotDataUrl =
            this.assetsBackendApiService.getImageUrlForPreview(
              AppConstants.ENTITY_TYPE.FEEDBACK,
              response.screenshot_entity_id,
              response.screenshot_filename
            );
        }
      });
  }

  shouldShowNewCreatorFeedbackTab(): boolean {
    return this.newCreatorFeedbackTabIsEnabled && this.userCanEditExploration;
  }

  onCreatorFeedbackFilterChange(filterState: FeedbackFilterState): void {
    if (
      this.hasSameCreatorFeedbackServerFilters(filterState) &&
      (this.creatorFeedbackSummaries.length > 0 ||
        this.creatorFeedbackNextCursor !== null ||
        this.currentCreatorFeedbackPage > 1)
    ) {
      this.currentCreatorFeedbackFilterState = filterState;
      this.applyCreatorFeedbackSearch();
      return;
    }

    this.currentCreatorFeedbackFilterState = filterState;
    this.currentCreatorFeedbackPage = 1;
    this.creatorFeedbackCursorHistory = [null];
    this.creatorFeedbackNextCursor = null;
    this.feedbackBackendApiService
      .fetchCreatorDashboardFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        filterState,
        this.creatorFeedbackNextCursor
      )
      .then(response => {
        this.updateCreatorFeedbackPage(response);
      });
  }

  onCreatorFeedbackRowClick(feedbackId: string): void {
    this.selectedCreatorFeedbackReportId = feedbackId;
    this.loadCreatorFeedbackDetails(feedbackId);
  }

  onCreatorFeedbackNextPage(): void {
    if (!this.moreCreatorFeedbackAvailable || !this.creatorFeedbackNextCursor) {
      return;
    }

    const nextPageIndex = this.currentCreatorFeedbackPage;
    if (this.creatorFeedbackCursorHistory.length === nextPageIndex) {
      this.creatorFeedbackCursorHistory.push(this.creatorFeedbackNextCursor);
    }
    this.feedbackBackendApiService
      .fetchCreatorDashboardFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        this.currentCreatorFeedbackFilterState,
        this.creatorFeedbackNextCursor
      )
      .then(response => {
        this.updateCreatorFeedbackPage(response);
        this.currentCreatorFeedbackPage++;
      });
  }

  onCreatorFeedbackPreviousPage(): void {
    if (this.currentCreatorFeedbackPage <= 1) {
      return;
    }

    const previousPageCursor =
      this.creatorFeedbackCursorHistory[this.currentCreatorFeedbackPage - 2];
    this.feedbackBackendApiService
      .fetchCreatorDashboardFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        this.currentCreatorFeedbackFilterState,
        previousPageCursor
      )
      .then(response => {
        this.updateCreatorFeedbackPage(response);
        this.currentCreatorFeedbackPage--;
      });
  }

  navigateBackToCreatorFeedbackList(): void {
    this.selectedCreatorFeedbackReportId = null;
    this.creatorFeedbackDetailResponse = null;
    this.creatorFeedbackScreenshotDataUrl = null;
  }

  onCreatorFeedbackStatusChange(status: FeedbackStatus): void {
    if (this.selectedCreatorFeedbackReportId === null) {
      return;
    }

    this.feedbackBackendApiService
      .updatePlatformFeedbackStatusAsync(
        'curriculum',
        this.pageContextService.getExplorationId(),
        this.selectedCreatorFeedbackReportId,
        status
      )
      .then(() => {
        if (this.creatorFeedbackDetailResponse) {
          this.creatorFeedbackDetailResponse = {
            ...this.creatorFeedbackDetailResponse,
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

  onCreatorFeedbackGithubTransfer(_githubIssueUrl: string): void {
    this.onCreatorFeedbackStatusChange(FeedbackStatus.TRANSFERRED_TO_GITHUB);
  }

  ngOnInit(): void {
    this.activeThread = null;
    this.userIsLoggedIn = false;
    this.userCanEditExploration = false;
    this.newCreatorFeedbackTabIsEnabled =
      this.platformFeatureService.status.ExplorationEditorNewCreatorFeedbackTab.isEnabled;
    this.threadIsStale = false;
    this.loaderService.showLoadingScreen('Loading');

    // Initial load of the thread list on page load.
    this.feedbackMessage = {
      status: null,
      text: '',
    };

    this.clearActiveThread();
    this.directiveSubscriptions.add(
      this.threadDataBackendApiService.onFeedbackThreadsInitialized.subscribe(
        () => {
          this.fetchUpdatedThreads();
        }
      )
    );

    Promise.all([
      this.userService
        .getUserInfoAsync()
        .then(userInfo => (this.userIsLoggedIn = userInfo.isLoggedIn())),
      this.userExplorationPermissionsService
        .getPermissionsAsync()
        .then(permissions => {
          this.userCanEditExploration = permissions.canEdit;
        }),
    ]).then(() => {
      if (this.shouldShowNewCreatorFeedbackTab()) {
        this.onCreatorFeedbackFilterChange(
          this.currentCreatorFeedbackFilterState
        );
      }
      this.loaderService.hideLoadingScreen();
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
