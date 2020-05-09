// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for ImprovementPlaythroughModal.
 */

angular.module('oppia').controller('ImprovementPlaythoughModalController', [
  '$scope', '$uibModalInstance', 'AlertsService', 'LearnerActionRenderService',
  'playthrough', 'playthroughIndex',
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  'MAX_UNRELATED_ACTIONS_PER_BLOCK',
  function(
      $scope, $uibModalInstance, AlertsService, LearnerActionRenderService,
      playthrough, playthroughIndex,
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
      if (playthrough.issueType ===
          ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
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
      if (indexOfFirstDisplayedAction < playthrough.actions.length - 1) {
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
          if (indexOfFirstDisplayedAction - i >=
              MAX_UNRELATED_ACTIONS_PER_BLOCK) {
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
      var tableHtml =
        LearnerActionRenderService.renderFinalDisplayBlockForMISIssueHTML(
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
]);
