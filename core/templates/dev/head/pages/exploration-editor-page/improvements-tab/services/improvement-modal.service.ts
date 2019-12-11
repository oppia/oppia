// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for creating modals associated to the improvements tab.
 */

require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'learner-answer-details-data.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require(
  'pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
  'suggestion-modal-for-exploration-editor.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').factory('ImprovementModalService', [
  '$uibModal', 'AlertsService', 'ChangeListService', 'DateTimeFormatService',
  'EditabilityService', 'ExplorationHtmlFormatterService',
  'ExplorationStatesService', 'LearnerAnswerDetailsDataService',
  'SuggestionModalForExplorationEditorService', 'ThreadDataService',
  'ThreadStatusDisplayService', 'UrlInterpolationService',
  'UserExplorationPermissionsService', 'UserService',
  function(
      $uibModal, AlertsService, ChangeListService, DateTimeFormatService,
      EditabilityService, ExplorationHtmlFormatterService,
      ExplorationStatesService, LearnerAnswerDetailsDataService,
      SuggestionModalForExplorationEditorService, ThreadDataService,
      ThreadStatusDisplayService, UrlInterpolationService,
      UserExplorationPermissionsService, UserService) {
    return {
      openPlaythroughModal: function(playthrough, index) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/statistics-tab/templates/' +
            'playthrough-modal.template.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance', 'AlertsService',
            'LearnerActionRenderService',
            'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
            'MAX_UNRELATED_ACTIONS_PER_BLOCK',
            function(
                $scope, $uibModalInstance, AlertsService,
                LearnerActionRenderService,
                ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS,
                MAX_UNRELATED_ACTIONS_PER_BLOCK) {
              $scope.playthroughIndex = index;

              // This is the index of the latest learner action that was
              // displayed. When this index reaches 0, we've displayed all the
              // learner actions.
              let currActionIndex = playthrough.actions.length - 1;
              // We keep track of the indices where we expanded till at each
              // level so that we would be able to display the final block as
              // a table in Multiple Incorrect Submissions issue.
              let indicesToExpand = [];
              let actionsToDisplay = [];

              /**
               * Identifies whether all learner actions have been displayed and
               * no further expansion is possible.
               * @returns {boolean}
               */
              $scope.canExpandActions = function() {
                return currActionIndex !== 0;
              };

              /**
               * Iterates through the learner actions and expands the set of
               * actions to be displayed. If all learner actions have been
               * handled, no more expansion is possible.
               */
              let expandActions = function() {
                let i;
                for (i = currActionIndex; i >= 0; i--) {
                  let action = playthrough.actions[i];
                  let currentStateName =
                      action.actionCustomizationArgs.state_name.value;
                  let latestStateName = actionsToDisplay.length === 0 ? (
                      action.actionCustomizationArgs.state_name.value) : (
                      actionsToDisplay[
                        actionsToDisplay.length -
                          1].actionCustomizationArgs.state_name.value);

                  if (currentStateName !== latestStateName) {
                    // When the latest state name and the state name of the
                    // current learner action differ, they are part of
                    // different contexts. So, we identify whether the size
                    // of the block has crossed the threshold number of actions
                    // per block. If it has, we don't add more learner actions
                    // to the block.
                    if (currActionIndex - i >= (
                      MAX_UNRELATED_ACTIONS_PER_BLOCK)) {
                      currActionIndex = i + 1;
                      break;
                    }
                    actionsToDisplay.push(action);
                  } else {
                    // When the latest state name and the state name of the
                    // current learner action are the same, they remain in the
                    // same context. So, we keep them in the same block to
                    // display them together.
                    actionsToDisplay.push(action);
                  }
                }
                // This is the case when all learner actions have been iterated
                // over, and no more expansion is possible.
                if (i === -1) {
                  currActionIndex = 0;
                }
                indicesToExpand.push(i + 1);
              };

              expandActions();

              // Index to know where to start highlighting actions.
              let indexOfFirstBlockDisplayed = currActionIndex;

              $scope.isIssueMIS = false;
              if (playthrough.issueType === (
                ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS)) {
                $scope.isIssueMIS = true;
              }

              /**
               * Renders a table for MultipleIncorrectSubmissions issue for a
               * more friendly UI.
               */
              $scope.renderIssueTable = function() {
                var lars = LearnerActionRenderService;
                var tableHtml =
                  lars.renderFinalDisplayBlockForMISIssueHTML(
                    playthrough.actions.slice(indicesToExpand[0]),
                    indicesToExpand[0] + 1);
                return tableHtml;
              };

              /**
               * Returns the list of learner actions to currently be
               * displayed in the playthrough modal.
               * @returns {LearnerAction[]}
               */
              $scope.getActionsToRender = function() {
                if ($scope.isIssueMIS) {
                  // This corresponds to the case where we display the table
                  // for the issue.
                  if (indicesToExpand.length === 1) {
                    return [];
                  }
                  return actionsToDisplay.slice().reverse().slice(
                    currActionIndex, indicesToExpand[0]);
                }
                return actionsToDisplay.slice().reverse();
              };

              /**
               * Returns the index of the learner action.
               * @param {LearnerAction} learnerAction.
               * @returns {int}
               */
              $scope.getLearnerActionIndex = function(learnerAction) {
                return playthrough.actions.indexOf(learnerAction) + 1;
              };

              /**
               * Computes whether the learner action needs to be highlighted.
               * @param {LearnerAction} learnerAction.
               * @returns {boolean}
               */
              $scope.isActionHighlighted = function(action) {
                return $scope.getLearnerActionIndex(action) > (
                  indexOfFirstBlockDisplayed);
              };

              /**
               * Renders the HTML of the learner action.
               * @param {LearnerAction} learnerAction.
               * @param {int} actionIndex - The index of the learner action.
               * @returns {string}
               */
              $scope.renderLearnerAction = function(
                  learnerAction, actionIndex) {
                return LearnerActionRenderService.renderLearnerAction(
                  learnerAction, actionIndex);
              };


              /**
               * Expands the displayed learner actions by the next start
               * index. If there is only one index, the arrow div is not shown
               * at all. If the current stop index is the second last one, the
               * arrow div is hidden after the final stop is reached.
               */
              $scope.expandActionsToRender = function() {
                expandActions();
              };

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        });
      },
      openLearnerAnswerDetails: function(learnerAnswerDetails) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'answer-details-modal.template.html'),
          resolve: {
            isEditable: function() {
              return UserExplorationPermissionsService.getPermissionsAsync()
                .then(permissions => permissions.can_edit);
            },
          },
          controller: [
            '$scope', '$uibModalInstance', 'isEditable',
            function($scope, $uibModalInstance, isEditable) {
              $scope.isEditable = isEditable;
              $scope.selectedLearnerAnswerInfo = [];
              $scope.learnerAnswerDetails = learnerAnswerDetails;
              $scope.currentLearnerAnswerInfo = null;
              $scope.viewAnswerDetails = false;
              $scope.changeView = function(learnerAnswerInfo) {
                $scope.currentLearnerAnswerInfo = learnerAnswerInfo;
                $scope.viewAnswerDetails = !($scope.viewAnswerDetails);
              };
              $scope.getLocaleAbbreviatedDatetimeString = (
                DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
              $scope.getLearnerAnswerInfos = function() {
                return $scope.learnerAnswerDetails.learnerAnswerInfoData;
              };
              $scope.getAnswerDetails = function(learnerAnswerInfo) {
                return learnerAnswerInfo.getAnswerDetails();
              };
              $scope.selectLearnerAnswerInfo = function(learnerAnswerInfo) {
                var index = $scope.selectedLearnerAnswerInfo.indexOf(
                  learnerAnswerInfo);
                if (index === -1) {
                  $scope.selectedLearnerAnswerInfo.push(learnerAnswerInfo);
                } else {
                  $scope.selectedLearnerAnswerInfo.splice(index, 1);
                }
              };
              $scope.deleteSelectedLearnerAnswerInfo = function() {
                for (
                  var i = 0; i < $scope.selectedLearnerAnswerInfo.length; i++) {
                  var index = (
                    $scope.learnerAnswerDetails.learnerAnswerInfoData.indexOf(
                      $scope.selectedLearnerAnswerInfo[i]));
                  $scope.learnerAnswerDetails.learnerAnswerInfoData.splice(
                    index, 1);
                  LearnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
                    $scope.learnerAnswerDetails.expId,
                    $scope.learnerAnswerDetails.stateName,
                    $scope.selectedLearnerAnswerInfo[i].getId());
                }
                $scope.selectedLearnerAnswerInfo = [];
                $scope.currentLearnerAnswerInfo = null;
                if ($scope.getLearnerAnswerInfos().length === 0) {
                  $scope.close();
                }
              };
              $scope.getLearnerAnswerHtml = function(learnerAnswerInfo) {
                return ExplorationHtmlFormatterService.getShortAnswerHtml(
                  learnerAnswerInfo.getAnswer(),
                  $scope.learnerAnswerDetails.interactionId,
                  $scope.learnerAnswerDetails.customizationArgs);
              };
              $scope.close = function() {
                $uibModalInstance.close();
              };
            }
          ]
        });
      },
      openFeedbackThread: function(thread) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'feedback-thread-modal.template.html'),
          resolve: {
            isUserLoggedIn: function() {
              return UserService.getUserInfoAsync().then(function(userInfo) {
                return userInfo.isLoggedIn();
              });
            },
          },
          controller: [
            '$scope', '$uibModalInstance', 'isUserLoggedIn',
            function($scope, $uibModalInstance, isUserLoggedIn) {
              $scope.activeThread = thread;
              $scope.isUserLoggedIn = isUserLoggedIn;
              $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
              $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
              $scope.getHumanReadableStatus = (
                ThreadStatusDisplayService.getHumanReadableStatus);
              $scope.getLocaleAbbreviatedDatetimeString = (
                DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
              $scope.EditabilityService = EditabilityService;

              // Initial load of the thread list on page load.
              $scope.tmpMessage = {
                status: $scope.activeThread.status,
                text: '',
              };

              $scope.getTitle = function() {
                return $scope.activeThread.subject;
              };

              // TODO(Allan): Implement ability to edit suggestions before
              // applying.
              $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
                if (threadId === null) {
                  AlertsService.addWarning(
                    'Cannot add message to thread with ID: null.');
                  return;
                }
                if (!tmpStatus) {
                  AlertsService.addWarning(
                    'Invalid message status: ' + tmpStatus);
                  return;
                }
                $scope.messageSendingInProgress = true;
                ThreadDataService.addNewMessage(
                  threadId, tmpText, tmpStatus, function() {
                    $scope.tmpMessage.status = $scope.activeThread.status;
                    $scope.messageSendingInProgress = false;
                  }, function() {
                    $scope.messageSendingInProgress = false;
                  }).then($uibModalInstance.close);
              };
              $scope.close = function() {
                $uibModalInstance.close();
              };
            },
          ],
          backdrop: 'static',
          size: 'lg',
        });
      },

      openSuggestionThread: function(thread) {
        var openSuggestionReviewer = this.openSuggestionReviewer;
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'suggestion-thread-modal.template.html'),
          resolve: {
            isUserLoggedIn: function() {
              return UserService.getUserInfoAsync().then(function(userInfo) {
                return userInfo.isLoggedIn();
              });
            },
          },
          controller: [
            '$scope', '$uibModalInstance', 'isUserLoggedIn',
            function($scope, $uibModalInstance, isUserLoggedIn) {
              $scope.activeThread = thread;
              $scope.isUserLoggedIn = isUserLoggedIn;
              $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
              $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
              $scope.getHumanReadableStatus = (
                ThreadStatusDisplayService.getHumanReadableStatus);
              $scope.getLocaleAbbreviatedDatetimeString = (
                DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
              $scope.EditabilityService = EditabilityService;
              $scope.openSuggestionReviewer = openSuggestionReviewer;

              // Initial load of the thread list on page load.
              $scope.tmpMessage = {
                status: $scope.activeThread.status,
                text: '',
              };

              $scope.getTitle = function() {
                return (
                  'Suggestion for the card "' +
                  $scope.activeThread.suggestion.stateName + '"');
              };

              // TODO(Allan): Implement ability to edit suggestions before
              // applying.
              $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
                if (threadId === null) {
                  AlertsService.addWarning(
                    'Cannot add message to thread with ID: null.');
                  return;
                }
                if (!tmpStatus) {
                  AlertsService.addWarning(
                    'Invalid message status: ' + tmpStatus);
                  return;
                }
                $scope.messageSendingInProgress = true;
                ThreadDataService.addNewMessage(
                  threadId, tmpText, tmpStatus, function() {
                    $scope.tmpMessage.status = $scope.activeThread.status;
                    $scope.messageSendingInProgress = false;
                  }, function() {
                    $scope.messageSendingInProgress = false;
                  }).then($uibModalInstance.close);
              };
              $scope.close = function() {
                $uibModalInstance.close();
              };
            },
          ],
          backdrop: 'static',
          size: 'lg',
        });
      },

      openSuggestionReviewer: function(suggestionThread) {
        return SuggestionModalForExplorationEditorService.showSuggestionModal(
          suggestionThread.suggestion.suggestionType, {
            activeThread: suggestionThread,
            hasUnsavedChanges: function() {
              return ChangeListService.getChangeList().length > 0;
            },
            isSuggestionHandled: function() {
              return suggestionThread.isSuggestionHandled();
            },
            isSuggestionValid: function() {
              return ExplorationStatesService.hasState(
                suggestionThread.getSuggestionStateName());
            },
          }
        );
      },
      /**
       * @returns {Promise} - State is resolved when the confirmation button is
       *    pressed, or rejected when the cancel button is pressed.
       */
      openConfirmationModal: function(message, buttonText, buttonClass) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/common-layout-directives/common-elements/' +
            'confirmation-modal.template.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.confirmationMessage = message;
              $scope.confirmationButtonText = buttonText;
              $scope.confirmationButtonClass = buttonClass;
              $scope.action = $uibModalInstance.close;
              $scope.cancel = $uibModalInstance.dismiss;
            }
          ]
        });
      },
    };
  },
]);
