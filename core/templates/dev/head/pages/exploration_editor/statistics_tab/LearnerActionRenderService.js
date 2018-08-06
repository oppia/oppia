// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for rendering learner action HTML strings.
 *
 * The service should be used in the following way:
 *
 * 1. All learner actions for the playthrough should be passed as an arg to the
 *  function that splits them up into Display blocks. Display blocks are the
 *  blocks in which learner actions will be displayed in their modal.
 * 2. Now, to render one Display block's HTML equivalent, we would pass it to
 *  the renderDisplayBlockHTML() function. This function converts each learner
 *  action in the block to its corresponding HTML string and joins all such
 * learner actions and then returns a giant HTML string.
 */

oppia.factory('LearnerActionRenderService', [
  '$sce', 'ACTION_TYPE_ANSWER_SUBMIT', 'ACTION_TYPE_EXPLORATION_START',
  'ACTION_TYPE_EXPLORATION_QUIT', 'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  function(
      $sce, ACTION_TYPE_ANSWER_SUBMIT, ACTION_TYPE_EXPLORATION_START,
      ACTION_TYPE_EXPLORATION_QUIT, ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
    var renderExplorationStartActionHTML = function(stateName, actionIndex) {
      var htmlString =
        '<span class="oppia-issues-learner-action">' + actionIndex +
        '. Started exploration at card "' + stateName + '".</span>';
      return htmlString;
    };

    var renderExplorationQuitActionHTML = function(
        stateName, timeSpentInStateSecs, actionIndex) {
      var htmlString =
        '<span class="oppia-issues-learner-action">' + actionIndex +
        '. Left the exploration after spending a ' + 'total of ' +
        timeSpentInStateSecs + ' seconds on card "' + stateName + '".</span>';
      return htmlString;
    };

    var renderContinueButtonSubmitActionHTML = function(
        stateName, timeSpentInStateSecs, actionIndex) {
      var htmlString =
        '<span class="oppia-issues-learner-action">' + actionIndex +
        '. Pressed "Continue" to move to card "' + stateName + '" after ' +
        timeSpentInStateSecs + ' seconds.</span>';
      return htmlString;
    };

    /**
     * Renders the correct HTML for AnswerSubmit action after checking for a
     * change in state.
     * @param {string} answer.
     * @param {string} destStateName.
     * @param {int} timeSpentInStateSecs.
     * @param {string} currentStateName.
     * @param {int} actionIndex.
     * @returns {string}
     */
    var renderAnswerSubmitActionHTML = function(
        answer, destStateName, timeSpentInStateSecs, currentStateName,
        actionIndex) {
      var htmlString;
      if (currentStateName === destStateName) {
        htmlString =
          '<span class="oppia-issues-learner-action">' + actionIndex +
          '. Submitted answer "' + answer + '" in card "' + currentStateName +
          '".</span>';
      } else {
        htmlString =
          '<span class="oppia-issues-learner-action">' + actionIndex +
          '. Submitted answer "' + answer + '" and moved to card "' +
          destStateName + '" after spending ' + timeSpentInStateSecs +
          ' seconds on card "' + currentStateName + '".</span>';
      }
      return htmlString;
    };

    /**
     * Renders the correct HTML for the table display for MultipleIncorrect
     * issue.
     * @param {LearnerAction[]} finalBlock.
     * @returns {string}
     */
    var renderLearnerActionsTableForMultipleIncorrectIssue = function(
        finalBlock) {
      var index = finalBlock.length - 1;
      var stateName =
        finalBlock[index].actionCustomizationArgs.state_name.value;

      var tableHTML =
        '<table class="oppia-issues-learner-action-table"><tr><th>Answer</th>' +
        '<th>Feedback</th></tr>';
      for (var i = 0; i < index; i++) {
        if (finalBlock[i].actionType !== ACTION_TYPE_ANSWER_SUBMIT) {
          continue;
        }
        var answer =
          finalBlock[i].actionCustomizationArgs.submitted_answer.value;
        var feedback =
          finalBlock[i].actionCustomizationArgs.feedback.value._html;
        feedback = feedback.replace('{{answer}}', answer);
        tableHTML +=
          '<tr><td>' + answer + '</td><td>' + feedback + '</td></tr>';
      }
      tableHTML += '</table>';
      return tableHTML;
    };

    /**
     * Renders the correct HTML for the learner action.
     * @param {LearnerAction} learnerAction.
     * @param {int} actionIndex.
     * @returns {string}
     */
    var renderLearnerActionHTML = function(learnerAction, actionIndex) {
      var actionType = learnerAction.actionType;
      var custArgs = learnerAction.actionCustomizationArgs;
      if (actionType === ACTION_TYPE_EXPLORATION_START) {
        return renderExplorationStartActionHTML(
          custArgs.state_name.value, actionIndex);
      } else if (actionType === ACTION_TYPE_EXPLORATION_QUIT) {
        return renderExplorationQuitActionHTML(
          custArgs.state_name.value, custArgs.time_spent_state_in_msecs.value,
          actionIndex);
      } else if (actionType === ACTION_TYPE_ANSWER_SUBMIT) {
        interactionId = custArgs.interaction_id.value;
        if (interactionId === 'Continue') {
          return renderContinueButtonSubmitActionHTML(
            custArgs.dest_state_name.value,
            custArgs.time_spent_state_in_msecs.value, actionIndex);
        } else {
          return renderAnswerSubmitActionHTML(
            custArgs.submitted_answer.value, custArgs.dest_state_name.value,
            custArgs.time_spent_state_in_msecs.value, custArgs.state_name.value,
            actionIndex);
        }
      }
    };

    /**
     * Checks whether the block length is less than an explicit maximum value.
     * The block is limitied to a maximum number of learner actions so that the
     * display modal is cleaner. When this bound is exceeded, actions are added
     * to the next block which can be accessed by an 'extend' button.
     */
    var withinBlockUpperBound = function(blockLength) {
      return blockLength < 4;
    };

    /**
     * Helper object to maintain the status of different display blocks while
     * splitting up learner actions. This object will be updated as learner
     * actions are inserted.
     */
    var groupedDisplayBlocks = {
      displayBlocks: null,
      localBlock: null,
      latestStateName: null,
      /**
       * Inserts new learner action into existing block or creates a new block
       * correctly, following a change in state.
       */
      handleChangeInState: function(action) {
        this.latestStateName = action.actionCustomizationArgs.state_name.value;
        if (withinBlockUpperBound(this.localBlock.length)) {
          // Add action to block.
          this.localBlock.unshift(action);
          return;
        }
        // Push current block to list of blocks and action into new block.
        this.displayBlocks.push(this.localBlock);
        this.localBlock = [action];
      },
      handleSameState: function(action) {
        this.localBlock.unshift(action);
      }
    };

    return {
      /**
       * Returns the HTML for the final display block in a MultipleIncorrect
       * issue. This accounts for the table to be displayed.
       * @param {LearnerAction[]} block.
       * @param {int} actionStartIndex.
       * @returns {string}
       */
      renderFinalDisplayBlockForMISIssueHTML: function(
          block, actionStartIndex) {
        var index = block.length - 1;
        var stateName = block[index].actionCustomizationArgs.state_name.value;
        var htmlString = '';
        for (
          var i = 0; block[i].actionType !== ACTION_TYPE_ANSWER_SUBMIT; i++) {
          htmlString += renderLearnerActionHTML(block[i], actionStartIndex + i);
        }
        htmlString +=
          '<span class="oppia-issues-learner-action">' +
          (actionStartIndex + i).toString() +
          '. Submitted the following answers in card "' + stateName +
          '"</span>';
        htmlString += renderLearnerActionsTableForMultipleIncorrectIssue(block);
        htmlString += renderLearnerActionHTML(
          block[index], actionStartIndex + i + 1);
        return $sce.trustAsHtml(htmlString);
      },
      renderDisplayBlockHTML: function(block, actionStartIndex) {
        var htmlString = '';
        for (var i = 0; i < block.length; i++) {
          htmlString += renderLearnerActionHTML(block[i], actionStartIndex + i);
        }
        return $sce.trustAsHtml(htmlString);
      },
      /**
       * Splits up the entire set of learner actions into correct display blocks
       * to be displayed in sequence in the playthroughs modal.
       * @param {LearnerActions[]} learnerActions.
       * @returns {LearnerActions[][]}
       */
      getDisplayBlocks: function(learnerActions) {
        var lastIndex = learnerActions.length - 1;
        groupedDisplayBlocks.displayBlocks = [];
        groupedDisplayBlocks.localBlock = [learnerActions[lastIndex]];
        groupedDisplayBlocks.latestStateName =
          learnerActions[lastIndex].actionCustomizationArgs.state_name.value;
        for (var i = lastIndex - 1; i >= 0; i--) {
          var action = learnerActions[i];
          var currentStateName =
            action.actionCustomizationArgs.state_name.value;
          if (currentStateName !== groupedDisplayBlocks.latestStateName) {
            groupedDisplayBlocks.handleChangeInState(action);
          } else {
            groupedDisplayBlocks.handleSameState(action);
          }
        }
        // If there is a local block with actions at the end, push it.
        if (groupedDisplayBlocks.localBlock) {
          groupedDisplayBlocks.displayBlocks.push(
            groupedDisplayBlocks.localBlock);
        }
        return groupedDisplayBlocks.displayBlocks;
      }
    };
  }]);
