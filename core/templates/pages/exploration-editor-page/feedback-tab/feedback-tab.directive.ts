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
 * @fileoverview Directive for the exploration editor feedback tab.
 */

require('pages/exploration-editor-page/feedback-tab/templates/' +
  'create-feedback-thread-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
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

angular.module('oppia').directive('feedbackTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/feedback-tab/' +
        'feedback-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$q', '$uibModal', 'AlertsService', 'ChangeListService',
        'DateTimeFormatService', 'EditabilityService', 'LoaderService',
        'ExplorationStatesService',
        'SuggestionModalForExplorationEditorService', 'ThreadDataService',
        'ThreadStatusDisplayService', 'UrlInterpolationService', 'UserService',
        function(
            $q, $uibModal, AlertsService, ChangeListService,
            DateTimeFormatService, EditabilityService, LoaderService,
            ExplorationStatesService,
            SuggestionModalForExplorationEditorService, ThreadDataService,
            ThreadStatusDisplayService, UrlInterpolationService, UserService) {
          var ctrl = this;

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
            return ThreadDataService.getThreadsAsync().then(data => {
              ctrl.threadData = data;
              ctrl.threadIsStale = false;
              if (activeThreadId !== null) {
                // Fetching threads invalidates old thread domain objects, so we
                // need to update our reference to the active thread afterwards.
                ctrl.activeThread = ThreadDataService.getThread(activeThreadId);
              }
            });
          };

          ctrl.onBackButtonClicked = function() {
            ctrl.clearActiveThread();
            if (ctrl.threadIsStale) {
              ctrl.fetchUpdatedThreads();
            }
          };

          ctrl.showCreateThreadModal = function() {
            return $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/feedback-tab/templates/' +
                'create-feedback-thread-modal.template.html'),
              backdrop: true,
              controller: 'CreateFeedbackThreadModalController'
            }).result.then(result => ThreadDataService.createNewThreadAsync(
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
            let thread = ThreadDataService.getThread(threadId);
            if (thread === null) {
              throw new Error(
                'Trying to add message to a non-existent thread.');
            }
            ThreadDataService.addNewMessageAsync(thread, tmpText, tmpStatus)
              .then(() => {
                _resetTmpMessageFields();
                ctrl.messageSendingInProgress = false;
              },
              () => {
                ctrl.messageSendingInProgress = false;
              });
          };

          ctrl.setActiveThread = function(threadId) {
            let thread = ThreadDataService.getThread(threadId);
            if (thread === null) {
              throw new Error('Trying to display a non-existent thread');
            }
            ThreadDataService.getMessagesAsync(thread).then(() => {
              ctrl.activeThread = thread;
              ThreadDataService.markThreadAsSeenAsync(ctrl.activeThread);
              ctrl.tmpMessage.status = ctrl.activeThread.status;
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

            return $q.all([
              UserService.getUserInfoAsync().then(
                userInfo => ctrl.userIsLoggedIn = userInfo.isLoggedIn()),
              ctrl.fetchUpdatedThreads()
            ]).then(() => LoaderService.hideLoadingScreen());
          };
        }
      ]
    };
  }]);
