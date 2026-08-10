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
import {WindowRef} from 'services/contextual/window-ref.service';
import {ThreadDataBackendApiService} from './services/thread-data-backend-api.service';
import {ThreadStatusDisplayService} from './services/thread-status-display.service';
import {FeedbackThread} from 'domain/feedback_thread/feedback-thread.model';
import {SuggestionThread} from 'domain/suggestion/suggestion-thread-object.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {
  CREATOR_DASHBOARD_FILTER_CONFIG,
  CreatorFeedbackType,
  FeedbackCardConfig,
  PlatformFeedbackSummary,
  LessonFeedbackSummary,
  FeedbackFilterState,
  LessonFeedbackDetailResponse,
  PlatformFeedbackDetailResponse,
  FeedbackStatus,
  TechnicalTeamType,
  LessonFeedbackBackendResponse,
  PlatformFeedbackBackendResponse,
  FeedbackModalType,
} from 'domain/feedback/feedback.model';

interface CreatorFeedbackListState<TSummary> {
  summaries: TSummary[];
  displayedSummaries: TSummary[];
  currentPage: number;
  nextCursor: string | null;
  cursorHistory: (string | null)[];
  moreAvailable: boolean;
}
import './feedback-tab.component.css';

@Component({
  selector: 'oppia-feedback-tab',
  templateUrl: './feedback-tab.component.html',
  styleUrls: ['./feedback-tab.component.css'],
})
export class FeedbackTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  STATUS_CHOICES = this.threadStatusDisplayService.STATUS_CHOICES;

  readonly creatorReportFeedbackCardConfig: FeedbackCardConfig = {
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
  readonly creatorFeedbackFilterConfig = CREATOR_DASHBOARD_FILTER_CONFIG;

  activeThread: SuggestionThread | null = null;
  userIsLoggedIn = false;
  threadIsStale = false;
  threadData: FeedbackThread[] = [];
  messageSendingInProgress = false;

  userCanEditExploration = false;
  newCreatorFeedbackTabIsEnabled = false;
  currentCreatorFeedbackFilterState: FeedbackFilterState = {
    searchText: '',
    status: FeedbackStatus.OPEN,
    technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
    creatorFeedbackType: CreatorFeedbackType.FEEDBACK,
    dateRange: {
      start: null,
      end: null,
    },
  };
  selectedCreatorFeedbackId: string | null = null;
  creatorFeedbackScreenshotDataUrl: string | null = null;
  creatorFeedbackDetailResponse:
    | PlatformFeedbackDetailResponse
    | LessonFeedbackDetailResponse
    | null = null;
  creatorReportFeedbackListState: CreatorFeedbackListState<PlatformFeedbackSummary> =
    {
      summaries: [],
      displayedSummaries: [],
      currentPage: 1,
      nextCursor: null,
      cursorHistory: [null],
      moreAvailable: false,
    };
  creatorLessonFeedbackListState: CreatorFeedbackListState<LessonFeedbackSummary> =
    {
      summaries: [],
      displayedSummaries: [],
      currentPage: 1,
      nextCursor: null,
      cursorHistory: [null],
      moreAvailable: false,
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
    private focusManagerService: FocusManagerService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService,
    private pageContextService: PageContextService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService,
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

  shouldShowNewCreatorFeedbackTab(): boolean {
    return this.newCreatorFeedbackTabIsEnabled && this.userCanEditExploration;
  }

  isCreatorLessonFeedbackFilterSelected(): boolean {
    return (
      this.currentCreatorFeedbackFilterState.creatorFeedbackType ===
      CreatorFeedbackType.FEEDBACK
    );
  }

  get statusOptions(): FeedbackStatus[] {
    return this.creatorFeedbackFilterConfig.statusOptions;
  }

  getCreatorFeedbackDetailCardConfig(): FeedbackCardConfig {
    return this.currentCreatorFeedbackFilterState.creatorFeedbackType ===
      CreatorFeedbackType.FEEDBACK
      ? this.creatorLessonFeedbackCardConfig
      : this.creatorReportFeedbackCardConfig;
  }

  private getCurrentCreatorFeedbackListState():
    | CreatorFeedbackListState<PlatformFeedbackSummary>
    | CreatorFeedbackListState<LessonFeedbackSummary> {
    return this.isCreatorLessonFeedbackFilterSelected()
      ? this.creatorLessonFeedbackListState
      : this.creatorReportFeedbackListState;
  }

  private loadCreatorLessonFeedbackDetail(feedbackId: string): void {
    this.loaderService.showLoadingScreen('Loading');
    this.feedbackBackendApiService
      .fetchLessonFeedbackDetailAsync(
        this.pageContextService.getExplorationId(),
        feedbackId
      )
      .then(response => {
        this.selectedCreatorFeedbackId = feedbackId;
        this.creatorFeedbackDetailResponse = response;
        this.loadCreatorFeedbackScreenshot();
        this.loaderService.hideLoadingScreen();
      });
  }

  private loadCreatorReportFeedbackDetail(feedbackId: string): void {
    this.loaderService.showLoadingScreen('Loading');
    this.feedbackBackendApiService
      .fetchPlatformFeedbackDetailAsync(
        'curriculum',
        this.pageContextService.getExplorationId(),
        feedbackId
      )
      .then(response => {
        this.selectedCreatorFeedbackId = feedbackId;
        this.creatorFeedbackDetailResponse = response;
        this.loadCreatorFeedbackScreenshot();
        this.loaderService.hideLoadingScreen();
      });
  }

  private loadCreatorFeedbackScreenshot(): void {
    const response = this.creatorFeedbackDetailResponse;
    this.creatorFeedbackScreenshotDataUrl = null;

    if (
      response === null ||
      !('screenshot_entity_id' in response) ||
      !response.screenshot_entity_id ||
      !response.screenshot_filename
    ) {
      return;
    }

    this.creatorFeedbackScreenshotDataUrl =
      this.assetsBackendApiService.getImageUrlForPreview(
        AppConstants.ENTITY_TYPE.FEEDBACK,
        response.screenshot_entity_id,
        response.screenshot_filename
      );
  }

  private getSummaryPreview(
    summary: PlatformFeedbackSummary | LessonFeedbackSummary
  ): string {
    return 'report_message_preview' in summary
      ? summary.report_message_preview
      : summary.feedback_text_preview;
  }

  private applyCreatorFeedbackSearch<
    Tsummary extends PlatformFeedbackSummary | LessonFeedbackSummary,
  >(state: CreatorFeedbackListState<Tsummary>): void {
    const searchText = this.currentCreatorFeedbackFilterState.searchText
      ?.toLocaleLowerCase()
      .trim();

    if (!searchText) {
      state.displayedSummaries = [...state.summaries];
      return;
    }

    state.displayedSummaries = state.summaries.filter(summary =>
      this.getSummaryPreview(summary).toLocaleLowerCase().includes(searchText)
    );
  }

  private updateCreatorLessonFeedbackPage(
    response: LessonFeedbackBackendResponse
  ): void {
    this.creatorLessonFeedbackListState.summaries = response.summaries;
    this.creatorLessonFeedbackListState.nextCursor = response.next_cursor;
    this.creatorLessonFeedbackListState.moreAvailable = response.more;
    this.applyCreatorFeedbackSearch(this.creatorLessonFeedbackListState);
  }

  private updateCreatorReportFeedbackPage(
    response: PlatformFeedbackBackendResponse
  ): void {
    this.creatorReportFeedbackListState.summaries = response.summaries;
    this.creatorReportFeedbackListState.nextCursor = response.next_cursor;
    this.creatorReportFeedbackListState.moreAvailable = response.more;
    this.applyCreatorFeedbackSearch(this.creatorReportFeedbackListState);
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

  private fetchCreatorFeedbackPage(
    cursor: string | null = null
  ): Promise<void> {
    if (this.isCreatorLessonFeedbackFilterSelected()) {
      return this.feedbackBackendApiService
        .fetchCreatorLessonFeedbackListAsync(
          this.pageContextService.getExplorationId(),
          this.currentCreatorFeedbackFilterState,
          cursor
        )
        .then(response => {
          this.updateCreatorLessonFeedbackPage(response);
        });
    }
    return this.feedbackBackendApiService
      .fetchCreatorDashboardFeedbackListAsync(
        this.pageContextService.getExplorationId(),
        this.currentCreatorFeedbackFilterState,
        cursor
      )
      .then(response => {
        this.updateCreatorReportFeedbackPage(response);
      });
  }

  private setCreatorFeedbackDetailHash(
    feedbackType: FeedbackModalType,
    feedbackId: string
  ): void {
    this.windowRef.nativeWindow.location.hash = `/feedback/${feedbackType}/${encodeURIComponent(feedbackId)}`;
  }

  getCreatorFeedbackDetailFromUrl(): {
    feedbackType: FeedbackModalType;
    feedbackId: string;
  } | null {
    const feedbackDetailHashPrefix = '#/feedback/';
    const hash = this.windowRef.nativeWindow.location.hash;

    if (!hash.startsWith(feedbackDetailHashPrefix)) {
      return null;
    }
    const feedbackDetailPath = hash.substring(feedbackDetailHashPrefix.length);
    const [urlFeedbackType, urlFeedbackId] = feedbackDetailPath.split('/');
    return {
      feedbackType: urlFeedbackType as FeedbackModalType,
      feedbackId: decodeURIComponent(urlFeedbackId),
    };
  }

  syncCreatorFeedbackFromUrl(): void {
    const detail = this.getCreatorFeedbackDetailFromUrl();
    if (!detail) {
      this.selectedCreatorFeedbackId = null;
      this.creatorFeedbackDetailResponse = null;
      this.creatorFeedbackScreenshotDataUrl = null;
      return;
    }
    this.loadCreatorFeedbackDetail(detail.feedbackType, detail.feedbackId);
  }

  private readonly onHashChange = (): void => {
    this.syncCreatorFeedbackFromUrl();
  };

  private loadCreatorFeedbackDetail(
    feedbackType: FeedbackModalType,
    feedbackId: string
  ): void {
    switch (feedbackType) {
      case FeedbackModalType.LESSON_FEEDBACK:
        this.loadCreatorLessonFeedbackDetail(feedbackId);
        break;

      case FeedbackModalType.LESSON_ISSUE:
        this.loadCreatorReportFeedbackDetail(feedbackId);
        break;
    }
  }

  private updateLessonFeedbackStatus(status: FeedbackStatus): void {
    if (
      this.selectedCreatorFeedbackId === null ||
      this.creatorFeedbackDetailResponse === null
    ) {
      return;
    }

    const feedbackId = this.selectedCreatorFeedbackId;

    this.feedbackBackendApiService
      .updateLessonFeedbackAsync(
        this.pageContextService.getExplorationId(),
        feedbackId,
        status,
        null
      )
      .then(() => {
        this.fetchCreatorFeedbackPage();
        this.loadCreatorLessonFeedbackDetail(feedbackId);

        this.alertsService.addSuccessMessage(
          `Feedback status updated to ${status}.`,
          7000,
          true
        );
      });
  }

  private updateReportFeedbackStatus(status: FeedbackStatus): void {
    if (
      this.selectedCreatorFeedbackId === null ||
      this.creatorFeedbackDetailResponse === null
    ) {
      return;
    }

    const feedbackId = this.selectedCreatorFeedbackId;

    this.feedbackBackendApiService
      .updatePlatformFeedbackStatusAsync(
        'curriculum',
        this.pageContextService.getExplorationId(),
        feedbackId,
        status
      )
      .then(() => {
        this.fetchCreatorFeedbackPage();
        this.loadCreatorReportFeedbackDetail(feedbackId);

        this.alertsService.addSuccessMessage(
          `Feedback status updated to ${status}.`,
          7000,
          true
        );
      });
  }

  private updateLessonFeedbackReply(replyText: string): void {
    if (
      this.selectedCreatorFeedbackId === null ||
      this.creatorFeedbackDetailResponse === null
    ) {
      return;
    }

    const feedbackId = this.selectedCreatorFeedbackId;
    const status = this.creatorFeedbackDetailResponse.status;
    this.feedbackBackendApiService
      .updateLessonFeedbackAsync(
        this.pageContextService.getExplorationId(),
        feedbackId,
        status,
        replyText
      )
      .then(() => {
        this.fetchCreatorFeedbackPage();
        this.loadCreatorLessonFeedbackDetail(feedbackId);

        this.alertsService.addSuccessMessage(
          'Reply sent successfully.',
          7000,
          true
        );
      });
  }

  onCreatorFeedbackStatusChange(status: FeedbackStatus): void {
    if (this.isCreatorLessonFeedbackFilterSelected()) {
      this.updateLessonFeedbackStatus(status);
    } else {
      this.updateReportFeedbackStatus(status);
    }
  }

  onCreatorFeedbackMessageSend(replyText: string): void {
    this.updateLessonFeedbackReply(replyText);
  }

  getDisplayedCreatorFeedbackSummaries():
    | PlatformFeedbackSummary[]
    | LessonFeedbackSummary[] {
    return this.getCurrentCreatorFeedbackListState().displayedSummaries;
  }

  getCreatorFeedbackListCurrentPage(): number {
    return this.getCurrentCreatorFeedbackListState().currentPage;
  }

  getCreatorFeedbackListMoreAvailable(): boolean {
    return this.getCurrentCreatorFeedbackListState().moreAvailable;
  }

  onCreatorFeedbackRowClick(feedbackId: string): void {
    this.selectedCreatorFeedbackId = feedbackId;
    const type = this.isCreatorLessonFeedbackFilterSelected()
      ? FeedbackModalType.LESSON_FEEDBACK
      : FeedbackModalType.LESSON_ISSUE;

    this.setCreatorFeedbackDetailHash(type, feedbackId);
  }

  onCreatorFeedbackNextPage(): void {
    const state = this.getCurrentCreatorFeedbackListState();
    if (!state.moreAvailable || !state.nextCursor) {
      return;
    }
    const nextPage = state.currentPage;
    if (state.cursorHistory.length === nextPage) {
      state.cursorHistory.push(state.nextCursor);
    }

    this.fetchCreatorFeedbackPage(state.nextCursor).then(() => {
      state.currentPage++;
    });
  }

  onCreatorFeedbackPreviousPage(): void {
    const state = this.getCurrentCreatorFeedbackListState();
    if (state.currentPage <= 1) {
      return;
    }

    const previousCursor = state.cursorHistory[state.currentPage - 2];
    this.fetchCreatorFeedbackPage(previousCursor).then(() => {
      state.currentPage--;
    });
  }

  onCreatorFeedbackFilterChange(filterState: FeedbackFilterState): void {
    const hasSameServerFilters =
      this.hasSameCreatorFeedbackServerFilters(filterState);

    this.currentCreatorFeedbackFilterState = filterState;

    const state = this.getCurrentCreatorFeedbackListState();

    if (
      hasSameServerFilters &&
      (state.summaries.length > 0 ||
        state.nextCursor !== null ||
        state.currentPage > 1)
    ) {
      if (this.isCreatorLessonFeedbackFilterSelected()) {
        this.applyCreatorFeedbackSearch(this.creatorLessonFeedbackListState);
      } else {
        this.applyCreatorFeedbackSearch(this.creatorReportFeedbackListState);
      }
      return;
    }

    state.currentPage = 1;
    state.nextCursor = null;
    state.cursorHistory = [null];

    this.fetchCreatorFeedbackPage();
  }

  navigateBackToCreatorFeedbackList(): void {
    this.windowRef.nativeWindow.location.hash = '/feedback';
  }

  ngOnInit(): void {
    this.activeThread = null;
    this.userIsLoggedIn = false;
    this.threadIsStale = false;
    this.userCanEditExploration = false;
    this.newCreatorFeedbackTabIsEnabled =
      this.platformFeatureService.status.ExplorationEditorNewCreatorFeedbackTab.isEnabled;
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
        this.syncCreatorFeedbackFromUrl();
        if (this.selectedCreatorFeedbackId === null) {
          this.fetchCreatorFeedbackPage();
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
