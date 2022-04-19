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

import { CreateFeedbackThreadModalComponent } from 'pages/exploration-editor-page/feedback-tab/templates/create-feedback-thread-modal.component';
import { Subscription } from 'rxjs';

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-data-backend-api.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require(
  'pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
  'suggestion-modal-for-exploration-editor.service.ts');
require('services/alerts.service.ts');
require('services/date-time-format.service.ts');
require('services/editability.service.ts');
require('services/user.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').component('feedbackTab', {
  template: require('./feedback-tab.component.html'),
  controller: [
    '$q', '$rootScope', 'AlertsService', 'ChangeListService',
    'DateTimeFormatService', 'EditabilityService', 'ExplorationStatesService',
    'FocusManagerService', 'LoaderService', 'NgbModal',
    'SuggestionModalForExplorationEditorService',
    'ThreadDataBackendApiService', 'ThreadStatusDisplayService',
    'UserService',
    function(
        $q, $rootScope, AlertsService, ChangeListService,
        DateTimeFormatService, EditabilityService, ExplorationStatesService,
        FocusManagerService, LoaderService, NgbModal,
        SuggestionModalForExplorationEditorService,
        ThreadDataBackendApiService, ThreadStatusDisplayService,
        UserService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();

      var _resetTmpMessageFields = function() {
        ctrl.tmpMessage.status =
          ctrl.activeThread && ctrl.activeThread.status;
        ctrl.tmpMessage.text = '';
      };

      ctrl.clearActiveThread = function() {
        ctrl.activeThread = null;
        _resetTmpMessageFields();
      };

      // Fetches the threads again if any thread is updated.
      ctrl.fetchUpdatedThreads = function() {
        let activeThreadId =
          ctrl.activeThread && ctrl.activeThread.threadId;
        return ThreadDataBackendApiService.getFeedbackThreadsAsync().then(
          data => {
            ctrl.threadData = data;
            ctrl.threadIsStale = false;
            if (activeThreadId !== null) {
              // Fetching threads invalidates old thread domain objects, so we
              // need to update our reference to the active thread afterwards.
              ctrl.activeThread = ThreadDataBackendApiService.getThread(
                activeThreadId);
            }
            LoaderService.hideLoadingScreen();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });
      };

      ctrl.onBackButtonClicked = function() {
        ctrl.clearActiveThread();
        if (ctrl.threadIsStale) {
          ctrl.fetchUpdatedThreads();
        }
      };

      ctrl.showCreateThreadModal = function() {
        return NgbModal.open(CreateFeedbackThreadModalComponent, {
          backdrop: 'static'
        }).result.then(
          result => ThreadDataBackendApiService.createNewThreadAsync(
            result.newThreadSubject, result.newThreadText)
        ).then(() => {
          ctrl.clearActiveThread();
          AlertsService.addSuccessMessage('Feedback thread created.');
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      var _isSuggestionHandled = () => {
        return (
          ctrl.activeThread !== null &&
          ctrl.activeThread.isSuggestionHandled());
      };

      var _isSuggestionValid = () => {
        return (
          ctrl.activeThread !== null &&
          ExplorationStatesService.hasState(
            ctrl.activeThread.getSuggestionStateName()));
      };

      var _hasUnsavedChanges = () => {
        return ChangeListService.getChangeList().length > 0;
      };

      ctrl.getSuggestionButtonType = () => {
        return (
          !_isSuggestionHandled() && _isSuggestionValid() &&
          !_hasUnsavedChanges()) ? 'primary' : 'default';
      };

      // TODO(Allan): Implement ability to edit suggestions before applying.
      ctrl.showSuggestionModal = () => {
        if (ctrl.activeThread === null) {
          throw new Error(
            'Trying to show suggestion of a non-existent thread');
        }
        SuggestionModalForExplorationEditorService.showSuggestionModal(
          ctrl.activeThread.suggestion.suggestionType, {
            activeThread: ctrl.activeThread,
            setActiveThread: (
              threadId => ctrl.fetchUpdatedThreads()
                .then(() => ctrl.setActiveThread(threadId))),
            isSuggestionHandled: _isSuggestionHandled,
            hasUnsavedChanges: _hasUnsavedChanges,
            isSuggestionValid: _isSuggestionValid
          }
        );
      };

      ctrl.addNewMessage = function(threadId, tmpText, tmpStatus) {
        if (threadId === null) {
          AlertsService.addWarning(
            'Cannot add message to thread with ID: null.');
          return;
        }
        if (!tmpStatus) {
          AlertsService.addWarning('Invalid message status: ' + tmpStatus);
          return;
        }
        ctrl.threadIsStale = true;
        ctrl.messageSendingInProgress = true;
        let thread = ThreadDataBackendApiService.getThread(threadId);
        if (thread === null) {
          throw new Error(
            'Trying to add message to a non-existent thread.');
        }
        ThreadDataBackendApiService.addNewMessageAsync(
          thread, tmpText, tmpStatus).then((messages) => {
          _resetTmpMessageFields();
          ctrl.activeThread.messages = messages;
          ctrl.messageSendingInProgress = false;
          $rootScope.$apply();
        },
        () => {
          ctrl.messageSendingInProgress = false;
          $rootScope.$apply();
        });
      };

      ctrl.setActiveThread = function(threadId) {
        let thread = ThreadDataBackendApiService.getThread(threadId);
        if (thread === null) {
          throw new Error('Trying to display a non-existent thread');
        }
        ThreadDataBackendApiService.getMessagesAsync(thread).then(() => {
          ctrl.activeThread = thread;
          ThreadDataBackendApiService.markThreadAsSeenAsync(ctrl.activeThread);
          ctrl.tmpMessage.status = ctrl.activeThread.status;
          FocusManagerService.setFocus('tmpMessageText');
          $rootScope.$apply();
        });
      };

      ctrl.getLabelClass = function(status) {
        return ThreadStatusDisplayService.getLabelClass(status);
      };

      ctrl.getHumanReadableStatus = function(status) {
        return ThreadStatusDisplayService.getHumanReadableStatus(status);
      };

      ctrl.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
          millisSinceEpoch);
      };

      ctrl.isExplorationEditable = function() {
        return EditabilityService.isEditable();
      };

      ctrl.$onInit = function() {
        ctrl.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
        ctrl.activeThread = null;
        ctrl.userIsLoggedIn = null;
        ctrl.threadIsStale = false;
        LoaderService.showLoadingScreen('Loading');

        // Initial load of the thread list on page load.
        ctrl.tmpMessage = {
          status: null,
          text: ''
        };
        ctrl.clearActiveThread();
        ctrl.directiveSubscriptions.add(
          ThreadDataBackendApiService.onFeedbackThreadsInitialized.subscribe(
            () => {
              ctrl.fetchUpdatedThreads();
            }
          ));

        return $q.all([
          UserService.getUserInfoAsync().then(
            userInfo => ctrl.userIsLoggedIn = userInfo.isLoggedIn()),
        ]).then(
          () => {
            LoaderService.hideLoadingScreen();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
