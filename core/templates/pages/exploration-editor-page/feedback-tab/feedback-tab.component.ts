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
    statusOptions: CREATOR_LESSON_FEEDBACK_STATUS_OPTIONS,
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

  private updateCreatorLessonFeedbackPage(
    response: LessonFeedbackBackendResponse
  ): void {
    this.creatorLessonFeedbackSummaries = response.summaries;
    this.creatorLessonFeedbackNextCursor = response.next_cursor;
    this.moreCreatorLessonFeedbackAvailable = response.more;
    this.applyCreatorLessonFeedbackSearch();
  }

  private applyCreatorLessonFeedbackSearch(): void {
    const search = (this.currentCreatorFeedbackFilterState.searchText ?? '')
      .trim()
      .toLowerCase();
    if (!search) {
      this.displayedCreatorLessonFeedbackSummaries = [
        ...this.creatorLessonFeedbackSummaries,
      ];
      return;
    }

    this.displayedCreatorLessonFeedbackSummaries =
      this.creatorLessonFeedbackSummaries.filter(feedback =>
        feedback.feedback_text_preview.toLowerCase().includes(search)
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

  private loadCreatorLessonFeedbackDetails(feedbackId: string): void {
    this.selectedCreatorFeedbackType = CreatorFeedbackType.FEEDBACK;
    this.creatorFeedbackDetailResponse = null;
    this.creatorFeedbackScreenshotDataUrl = null;
    this.feedbackBackendApiService
      .fetchLessonFeedbackDetailAsync(
        this.pageContextService.getExplorationId(),
        feedbackId
      )
      .then(response => {
        this.creatorFeedbackDetailResponse = response;
      });
  }

  private getCreatorFeedbackDetailFromUrl(): {
    feedbackId: string;
    feedbackType: CreatorFeedbackType;
  } | null {
    const feedbackDetailHashPrefix = '#/feedback/';
    const hash = this.windowRef.nativeWindow.location.hash;
    if (!hash.startsWith(feedbackDetailHashPrefix)) {
      return null;
    }

    const feedbackDetailPath = hash.substring(feedbackDetailHashPrefix.length);
    const pathParts = feedbackDetailPath.split('/');
    if (
      pathParts.length === 2 &&
      (pathParts[0] === CreatorFeedbackType.REPORT ||
        pathParts[0] === CreatorFeedbackType.FEEDBACK)
    ) {
      return {
        feedbackId: decodeURIComponent(pathParts[1]),
        feedbackType: pathParts[0] as CreatorFeedbackType,
      };
    }

    return {
      feedbackId: decodeURIComponent(feedbackDetailPath),
      feedbackType: CreatorFeedbackType.REPORT,
    };
  }

  private syncCreatorFeedbackReportFromUrl(): void {
    const feedbackDetail = this.getCreatorFeedbackDetailFromUrl();
    if (feedbackDetail === null) {
      this.selectedCreatorFeedbackReportId = null;
      this.selectedCreatorFeedbackType = null;
      this.creatorFeedbackDetailResponse = null;
      this.creatorFeedbackScreenshotDataUrl = null;
      return;
    }

    this.currentCreatorFeedbackFilterState = {
      ...this.currentCreatorFeedbackFilterState,
      creatorFeedbackType: feedbackDetail.feedbackType,
    };
    this.selectedCreatorFeedbackReportId = feedbackDetail.feedbackId;
    this.selectedCreatorFeedbackType = feedbackDetail.feedbackType;
    if (feedbackDetail.feedbackType === CreatorFeedbackType.FEEDBACK) {
      this.loadCreatorLessonFeedbackDetails(feedbackDetail.feedbackId);
      return;
    }

    this.loadCreatorFeedbackDetails(feedbackDetail.feedbackId);
  }

  private onHashChange = (): void => {
    if (this.shouldShowNewCreatorFeedbackTab()) {
      this.syncCreatorFeedbackReportFromUrl();
    }
  };

  shouldShowNewCreatorFeedbackTab(): boolean {
    return this.newCreatorFeedbackTabIsEnabled && this.userCanEditExploration;
  }

  isCreatorReportFilterSelected(): boolean {
    return (
      this.currentCreatorFeedbackFilterState.creatorFeedbackType ===
      CreatorFeedbackType.REPORT
    );
  }

  getCreatorFeedbackDetailCardConfig(): FeedbackCardConfig {
    return this.selectedCreatorFeedbackType === CreatorFeedbackType.FEEDBACK
      ? this.creatorLessonFeedbackCardConfig
      : this.creatorFeedbackCardConfig;
  }

  onCreatorFeedbackFilterChange(filterState: FeedbackFilterState): void {
    if (filterState.creatorFeedbackType === CreatorFeedbackType.FEEDBACK) {
      this.navigateBackToCreatorFeedbackList();
      if (
        this.hasSameCreatorFeedbackServerFilters(filterState) &&
        (this.creatorLessonFeedbackSummaries.length > 0 ||
          this.creatorLessonFeedbackNextCursor !== null ||
          this.currentCreatorLessonFeedbackPage > 1)
      ) {
        this.currentCreatorFeedbackFilterState = filterState;
        this.applyCreatorLessonFeedbackSearch();
        return;
      }

      this.currentCreatorFeedbackFilterState = filterState;
      this.currentCreatorLessonFeedbackPage = 1;
      this.creatorLessonFeedbackCursorHistory = [null];
      this.creatorLessonFeedbackNextCursor = null;
      this.feedbackBackendApiService
        .fetchCreatorLessonFeedbackListAsync(
          this.pageContextService.getExplorationId(),
          filterState,
          this.creatorLessonFeedbackNextCursor
        )
        .then(response => {
          this.updateCreatorLessonFeedbackPage(response);
        });
      return;
    }

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
    this.windowRef.nativeWindow.location.hash =
      '/feedback/report/' + encodeURIComponent(feedbackId);
  }

  onCreatorLessonFeedbackRowClick(feedbackId: string): void {
    this.selectedCreatorFeedbackReportId = feedbackId;
    this.loadCreatorLessonFeedbackDetails(feedbackId);
    this.windowRef.nativeWindow.location.hash =
      '/feedback/' + encodeURIComponent(feedbackId);
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

  onCreatorLessonFeedbackNextPage(): void {
    if (
      !this.moreCreatorLessonFeedbackAvailable ||
      !this.creatorLessonFeedbackNextCursor
    ) {
      return;
    }

    const nextPageIndex = this.currentCreatorLessonFeedbackPage;
    if (this.creatorLessonFeedbackCursorHistory.length === nextPageIndex) {
      this.creatorLessonFeedbackCursorHistory.push(
        this.creatorLessonFeedbackNextCursor
      );
    }
    this.feedbackBackendApiService
      .fetchCreatorLessonFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        this.currentCreatorFeedbackFilterState,
        this.creatorLessonFeedbackNextCursor
      )
      .then(response => {
        this.updateCreatorLessonFeedbackPage(response);
        this.currentCreatorLessonFeedbackPage++;
      });
  }

  onCreatorLessonFeedbackPreviousPage(): void {
    if (this.currentCreatorLessonFeedbackPage <= 1) {
      return;
    }

    const previousPageCursor =
      this.creatorLessonFeedbackCursorHistory[
        this.currentCreatorLessonFeedbackPage - 2
      ];
    this.feedbackBackendApiService
      .fetchCreatorLessonFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        this.currentCreatorFeedbackFilterState,
        previousPageCursor
      )
      .then(response => {
        this.updateCreatorLessonFeedbackPage(response);
        this.currentCreatorLessonFeedbackPage--;
      });
  }

  navigateBackToCreatorFeedbackList(): void {
    this.selectedCreatorFeedbackReportId = null;
    this.selectedCreatorFeedbackType = null;
    this.creatorFeedbackDetailResponse = null;
    this.creatorFeedbackScreenshotDataUrl = null;
    if (this.windowRef.nativeWindow.location.hash !== '#/feedback') {
      this.windowRef.nativeWindow.location.hash = '/feedback';
    }
  }

  onCreatorFeedbackStatusChange(status: FeedbackStatus): void {
    if (this.selectedCreatorFeedbackReportId === null) {
      return;
    }

    const updateStatusPromise =
      this.selectedCreatorFeedbackType === CreatorFeedbackType.FEEDBACK
        ? this.feedbackBackendApiService.updateLessonFeedbackStatusAsync(
            this.pageContextService.getExplorationId(),
            this.selectedCreatorFeedbackReportId,
            status
          )
        : this.feedbackBackendApiService.updatePlatformFeedbackStatusAsync(
            'curriculum',
            this.pageContextService.getExplorationId(),
            this.selectedCreatorFeedbackReportId,
            status
          );

    updateStatusPromise.then(() => {
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
        this.windowRef.nativeWindow.addEventListener(
          'hashchange',
          this.onHashChange
        );
        this.syncCreatorFeedbackReportFromUrl();
        if (this.selectedCreatorFeedbackReportId === null) {
          this.onCreatorFeedbackFilterChange(
            this.currentCreatorFeedbackFilterState
          );
        }
      }
      this.loaderService.hideLoadingScreen();
    });
  }

  ngOnDestroy(): void {
    this.windowRef.nativeWindow.removeEventListener(
      'hashchange',
      this.onHashChange
    );
    this.directiveSubscriptions.unsubscribe();
  }
}
