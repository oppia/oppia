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
      /**
       * Opens the modal for displaying playthrough actions.
       * @param {Playthrough} playthrough.
       * @param {int} playthroughIndex.
       */
      openPlaythroughModal: function(playthrough, playthroughIndex) {
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
              let indexOfFirstDisplayedAction = null;
              let actionIndexAtStartOfFinalBlock = null;

              let init = function() {
                $scope.playthroughIndex = playthroughIndex;

                // This is the index of the first action in the range of actions
                // displayed. Initially, only one action is displayed. When this
                // index reaches 0, we've displayed all the learner actions.
                indexOfFirstDisplayedAction = playthrough.actions.length - 1;

                $scope.expandActionsToRender();

                // Index to know where to start highlighting actions. This is
                // set to the index of the first learner action in the final
                // display block, and is never updated after that.
                actionIndexAtStartOfFinalBlock = indexOfFirstDisplayedAction;

                $scope.issueIsMultipleIncorrectSubmissions = false;
                if (playthrough.issueType === (
                  ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS)) {
                  $scope.issueIsMultipleIncorrectSubmissions = true;
                }
              };

              /**
               * Identifies whether all learner actions have been displayed and
               * no further expansion is possible.
               * @returns {boolean}
               */
              $scope.canExpandActions = function() {
                return indexOfFirstDisplayedAction !== 0;
              };

              /**
               * Iterates through the learner actions and expands the set of
               * actions to be displayed. If all learner actions have been
               * handled, no more expansion is possible.
               */
              $scope.expandActionsToRender = function() {
                let i;
                let previousStateName = null;
                if (indexOfFirstDisplayedAction <
                    playthrough.actions.length - 1) {
                  let action = playthrough.actions[
                    indexOfFirstDisplayedAction];
                  previousStateName =
                      action.actionCustomizationArgs.state_name.value;
                }
                for (i = indexOfFirstDisplayedAction - 1; i >= 0; i--) {
                  let action = playthrough.actions[i];
                  let currentStateName =
                      action.actionCustomizationArgs.state_name.value;

                  if (currentStateName !== previousStateName) {
                    // When the latest state name and the state name of the
                    // current learner action differ, they are part of
                    // different contexts. So, we identify whether the size
                    // of the block has crossed the threshold number of actions
                    // per block. If it has, we don't add more learner actions
                    // to the block.
                    if (indexOfFirstDisplayedAction - i >= (
                      MAX_UNRELATED_ACTIONS_PER_BLOCK)) {
                      indexOfFirstDisplayedAction = i + 1;
                      break;
                    }
                  }
                  previousStateName = currentStateName;
                }
                // This is the case when all learner actions have been iterated
                // over, and no more expansion is possible. This updation needs
                // to happen because the indexOfFirstDisplayedAction would not
                // be updated when the final display block has less than the
                // threshold number of learner actions.
                if (i === -1) {
                  indexOfFirstDisplayedAction = 0;
                }
              };

              /**
               * Renders a table for MultipleIncorrectSubmissions issue for a
               * more friendly UI.
               */
              $scope.renderIssueTable = function() {
                var lars = LearnerActionRenderService;
                var tableHtml =
                  lars.renderFinalDisplayBlockForMISIssueHTML(
                    playthrough.actions.slice(
                      actionIndexAtStartOfFinalBlock),
                    actionIndexAtStartOfFinalBlock + 1);
                return tableHtml;
              };

              /**
               * Returns the list of learner actions to currently be displayed
               * in the playthrough modal. If the issue is a Multiple Incorrect
               * Submissions one, we return the list of learner actions,
               * excluding only the final display block (since we are rendering
               * a table for the multiple incorrect submissions instead).
               * @returns {LearnerAction[]}
               */
              $scope.getActionsToRender = function() {
                if ($scope.issueIsMultipleIncorrectSubmissions) {
                  return playthrough.actions.slice(
                    indexOfFirstDisplayedAction,
                    actionIndexAtStartOfFinalBlock);
                }
                return playthrough.actions.slice(indexOfFirstDisplayedAction);
              };

              /**
               * Returns the index of the learner action.
               * @param {int} displayedActionIndex.
               * @returns {int}
               */
              $scope.getLearnerActionIndex = function(displayedActionIndex) {
                return indexOfFirstDisplayedAction + displayedActionIndex + 1;
              };

              /**
               * Computes whether the learner action needs to be highlighted.
               * @param {int} actionIndex.
               * @returns {boolean}
               */
              $scope.isActionHighlighted = function(actionIndex) {
                return $scope.getLearnerActionIndex(actionIndex) > (
                  actionIndexAtStartOfFinalBlock);
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

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };

              init();
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
        var openSuggestionReviewModal = this.openSuggestionReviewModal;
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

              $scope.onClickReviewSuggestion = function() {
                openSuggestionReviewModal(
                  $scope.activeThread, $uibModalInstance);
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

      openSuggestionReviewModal: function(
          suggestionThread, threadUibModalInstance) {
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
          },
          threadUibModalInstance
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
