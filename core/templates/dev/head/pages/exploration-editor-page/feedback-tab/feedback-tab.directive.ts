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

require('domain/utilities/UrlInterpolationService.ts');
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
require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');
require('services/EditabilityService.ts');
require('services/UserService.ts');

require('pages/exploration-editor-page/exploration-editor-page.constants.ts');

angular.module('oppia').directive('feedbackTab', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/feedback-tab/' +
        'feedback-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$q', '$rootScope', '$uibModal', 'AlertsService', 'ChangeListService',
        'DateTimeFormatService', 'EditabilityService',
        'ExplorationStatesService',
        'SuggestionModalForExplorationEditorService',
        'ThreadDataService', 'ThreadStatusDisplayService',
        'UrlInterpolationService', 'UserService',
        function(
            $q, $rootScope, $uibModal, AlertsService, ChangeListService,
            DateTimeFormatService, EditabilityService,
            ExplorationStatesService,
            SuggestionModalForExplorationEditorService,
            ThreadDataService, ThreadStatusDisplayService,
            UrlInterpolationService, UserService) {
          var ctrl = this;
          ctrl.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
          ctrl.threadData = ThreadDataService.data;
          ctrl.getLabelClass = ThreadStatusDisplayService.getLabelClass;
          ctrl.getHumanReadableStatus = (
            ThreadStatusDisplayService.getHumanReadableStatus);
          ctrl.getLocaleAbbreviatedDatetimeString = (
            DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

          ctrl.activeThread = null;
          ctrl.userIsLoggedIn = null;
          ctrl.threadIsUpdated = false;
          ctrl.isExplorationEditable = EditabilityService.isEditable;
          $rootScope.loadingMessage = 'Loading';
          var userInfoPromise = UserService.getUserInfoAsync();
          userInfoPromise.then(function(userInfo) {
            ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          });

          // Initial load of the thread list on page load.
          ctrl.tmpMessage = {
            status: null,
            text: ''
          };
          var _resetTmpMessageFields = function() {
            ctrl.tmpMessage.status = ctrl.activeThread ?
              ctrl.activeThread.status : null;
            ctrl.tmpMessage.text = '';
          };
          ctrl.clearActiveThread = function() {
            ctrl.activeThread = null;
            _resetTmpMessageFields();
          };
          ctrl.clearActiveThread();
          ThreadDataService.fetchFeedbackStats();
          var threadPromise = ThreadDataService.fetchThreads();
          $q.all([userInfoPromise, threadPromise]).then(function() {
            $rootScope.loadingMessage = '';
          });
          // Fetches the threads again if any thread is updated.
          ctrl.fetchUpdatedThreads = function() {
            ThreadDataService.fetchThreads();
            ctrl.threadData = ThreadDataService.data;
            ctrl.threadIsUpdated = false;
          };
          ctrl.onBackButtonClicked = function() {
            ctrl.clearActiveThread();
            if (ctrl.threadIsUpdated) {
              ctrl.fetchUpdatedThreads();
            }
          };

          ctrl.showCreateThreadModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/feedback-tab/templates/' +
                'create-feedback-thread-modal.template.html'),
              backdrop: true,
              resolve: {},
              controller: ['$scope', '$uibModalInstance', function(
                  $scope, $uibModalInstance) {
                $scope.newThreadSubject = '';
                $scope.newThreadText = '';

                $scope.create = function(newThreadSubject, newThreadText) {
                  if (!newThreadSubject) {
                    AlertsService.addWarning(
                      'Please specify a thread subject.');
                    return;
                  }
                  if (!newThreadText) {
                    AlertsService.addWarning('Please specify a message.');
                    return;
                  }

                  $uibModalInstance.close({
                    newThreadSubject: newThreadSubject,
                    newThreadText: newThreadText
                  });
                };

                $scope.cancel = function() {
                  $uibModalInstance.dismiss('cancel');
                };
              }]
            }).result.then(function(result) {
              ThreadDataService.createNewThread(
                result.newThreadSubject, result.newThreadText, function() {
                  ctrl.clearActiveThread();
                  AlertsService.addSuccessMessage('Feedback thread created.');
                });
            });
          };

          var _isSuggestionHandled = function() {
            return ctrl.activeThread.isSuggestionHandled();
          };

          var _isSuggestionValid = function() {
            return ExplorationStatesService.hasState(
              ctrl.activeThread.getSuggestionStateName());
          };

          var _hasUnsavedChanges = function() {
            return (ChangeListService.getChangeList().length > 0);
          };

          ctrl.getSuggestionButtonType = function() {
            return (!_isSuggestionHandled() && _isSuggestionValid() &&
                    !_hasUnsavedChanges() ? 'primary' : 'default');
          };

          // TODO(Allan): Implement ability to edit suggestions before applying.
          ctrl.showSuggestionModal = function() {
            SuggestionModalForExplorationEditorService.showSuggestionModal(
              ctrl.activeThread.suggestion.suggestionType,
              {
                activeThread: ctrl.activeThread,
                setActiveThread: ctrl.setActiveThread,
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
            ctrl.threadIsUpdated = true;
            ctrl.messageSendingInProgress = true;
            ThreadDataService.addNewMessage(
              threadId, tmpText, tmpStatus, function() {
                _resetTmpMessageFields();
                ctrl.messageSendingInProgress = false;
              }, function() {
                ctrl.messageSendingInProgress = false;
              });
          };

          ctrl.setActiveThread = function(threadId) {
            ThreadDataService.fetchMessages(threadId);
            ThreadDataService.markThreadAsSeen(threadId);
            var allThreads = [].concat(
              ctrl.threadData.feedbackThreads,
              ctrl.threadData.suggestionThreads);
            for (var i = 0; i < allThreads.length; i++) {
              if (allThreads[i].threadId === threadId) {
                ctrl.activeThread = allThreads[i];
                break;
              }
            }
            ctrl.tmpMessage.status = ctrl.activeThread.status;
          };
        }
      ]};
  }]);
