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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { CreateFeedbackThreadModalComponent } from 'pages/exploration-editor-page/feedback-tab/templates/create-feedback-thread-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { EditabilityService } from 'services/editability.service';
import { LoaderService } from 'services/loader.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ThreadDataBackendApiService } from './services/thread-data-backend-api.service';
import { ThreadStatusDisplayService } from './services/thread-status-display.service';
import { SuggestionModalForExplorationEditorService } from '../suggestion-modal-for-editor-view/suggestion-modal-for-exploration-editor.service';
import { FeedbackThread } from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionThread } from 'domain/suggestion/suggestion-thread-object.model';

@Component({
  selector: 'oppia-feedback-tab',
  templateUrl: './feedback-tab.component.html'
})
export class FeedbackTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  STATUS_CHOICES = this.threadStatusDisplayService.STATUS_CHOICES;
  activeThread: SuggestionThread;
  userIsLoggedIn: boolean;
  threadIsStale: boolean;
  threadData: FeedbackThread[];
  messageSendingInProgress: boolean;
  tmpMessage: {
    status: string;
    text: string;
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
    private suggestionModalForExplorationEditorService:
      SuggestionModalForExplorationEditorService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private userService: UserService,
  ) { }

  _resetTmpMessageFields(): void {
    this.tmpMessage.status =
      this.activeThread && this.activeThread.status;
    this.tmpMessage.text = '';
  }

  clearActiveThread(): void {
    this.activeThread = null;
    this._resetTmpMessageFields();
  }

  // Fetches the threads again if any thread is updated.
  fetchUpdatedThreads(): Promise<void> {
    let activeThreadId =
      this.activeThread && this.activeThread.threadId;
    return this.threadDataBackendApiService.getFeedbackThreadsAsync().then(
      data => {
        this.threadData = data;
        this.threadIsStale = false;
        if (activeThreadId !== null) {
          // Fetching threads invalidates old thread domain objects, so we
          // need to update our reference to the active thread afterwards.
          this.activeThread = this.threadDataBackendApiService.getThread(
            activeThreadId) as SuggestionThread;
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
    return (
      this.activeThread !== null &&
      this.activeThread.isSuggestionHandled());
  }

  _isSuggestionValid(): boolean {
    return (
      this.activeThread !== null &&
      this.explorationStatesService.hasState(
        this.activeThread.getSuggestionStateName()));
  }

  _hasUnsavedChanges(): boolean {
    return this.changeListService.getChangeList().length > 0;
  }

  showCreateThreadModal(): void {
    this.ngbModal.open(CreateFeedbackThreadModalComponent, {
      backdrop: 'static'
    }).result.then(
      result => this.threadDataBackendApiService.createNewThreadAsync(
        result.newThreadSubject, result.newThreadText)
    ).then(() => {
      this.clearActiveThread();
      this.alertsService.addSuccessMessage('Feedback thread created.');
    },
    () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  getSuggestionButtonType(): string {
    return (
      !this._isSuggestionHandled() && this._isSuggestionValid() &&
      !this._hasUnsavedChanges()) ? 'primary' : 'default';
  }

  // TODO(Allan): Implement ability to edit suggestions before applying.
  showSuggestionModal(): void {
    if (this.activeThread === null) {
      throw new Error(
        'Trying to show suggestion of a non-existent thread');
    }
    this.suggestionModalForExplorationEditorService.showSuggestionModal(
      this.activeThread.suggestion.suggestionType,
      {
        activeThread: this.activeThread,
        setActiveThread: (
          threadId => this.fetchUpdatedThreads()
            .then(() => this.setActiveThread(threadId))),
        isSuggestionHandled: this._isSuggestionHandled(),
        hasUnsavedChanges: this._hasUnsavedChanges(),
        isSuggestionValid: this._isSuggestionValid()
      }
    );
  }

  addNewMessage(threadId: string, tmpText: string, tmpStatus: string): void {
    if (threadId === null) {
      this.alertsService.addWarning(
        'Cannot add message to thread with ID: null.');
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
      throw new Error(
        'Trying to add message to a non-existent thread.');
    }

    this.threadDataBackendApiService.addNewMessageAsync(
      thread, tmpText, tmpStatus).then((messages) => {
      this._resetTmpMessageFields();
      this.activeThread.messages = messages;
      this.messageSendingInProgress = false;
    },
    () => {
      this.messageSendingInProgress = false;
    });
  }

  setActiveThread(threadId: string): void {
    let thread = this.threadDataBackendApiService.getThread(threadId);
    if (thread === null) {
      throw new Error('Trying to display a non-existent thread');
    }

    this.threadDataBackendApiService.getMessagesAsync(thread).then(() => {
      this.activeThread = thread as SuggestionThread;
      this.threadDataBackendApiService.markThreadAsSeenAsync(this.activeThread);
      this.tmpMessage.status = this.activeThread.status;
      this.focusManagerService.setFocus('tmpMessageText');
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
      millisSinceEpoch);
  }

  isExplorationEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  ngOnInit(): void {
    this.activeThread = null;
    this.userIsLoggedIn = null;
    this.threadIsStale = false;
    this.loaderService.showLoadingScreen('Loading');

    // Initial load of the thread list on page load.
    this.tmpMessage = {
      status: null,
      text: ''
    };

    this.clearActiveThread();
    this.directiveSubscriptions.add(
      this.threadDataBackendApiService.onFeedbackThreadsInitialized.subscribe(
        () => {
          this.fetchUpdatedThreads();
        }
      ));

    Promise.all([
      this.userService.getUserInfoAsync().then(
        userInfo => this.userIsLoggedIn = userInfo.isLoggedIn()),
    ]).then(
      () => {
        this.loaderService.hideLoadingScreen();
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaFeedbackTab',
  downgradeComponent({
    component: FeedbackTabComponent
  }) as angular.IDirectiveFactory);
