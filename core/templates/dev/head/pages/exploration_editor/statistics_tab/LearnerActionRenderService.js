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
 */

oppia.factory('LearnerActionRenderService', [
  'ACTION_TYPE_ANSWER_SUBMIT', 'ACTION_TYPE_EXPLORATION_START',
  'ACTION_TYPE_EXPLORATION_QUIT', 'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  function(
      ACTION_TYPE_ANSWER_SUBMIT, ACTION_TYPE_EXPLORATION_START,
      ACTION_TYPE_EXPLORATION_QUIT, ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
    var renderExplorationStartActionHTML = function(stateName) {
      var htmlString =
        '<span class="learner-action">Started exploration at card "' +
        stateName + '".</span>';
      return htmlString;
    };

    var renderExplorationQuitActionHTML = function(
        stateName, timeSpentInStateSecs) {
      var htmlString =
        '<span class="learner-action">Left the exploration after spending a ' +
        'total of ' + timeSpentInStateSecs + ' seconds on card "' + stateName +
        '".</span>';
      return htmlString;
    };

    var renderContinueButtonSubmitActionHTML = function(
        stateName, timeSpentInStateSecs) {
      var htmlString =
        '<span class="learner-action">Pressed "Continue" to move to card "' +
        stateName + '" after ' + timeSpentInStateSecs + ' seconds.</span>';
      return htmlString;
    };

    var renderAnswerSubmitActionHTML = function(
        answer, destStateName, timeSpentInStateSecs, currentStateName) {
      var htmlString;
      if (currentStateName === destStateName) {
        htmlString =
          '<span class="learner-action">Submitted answer "' + answer +
          '" in card "' + currentStateName + '".</span>';
      } else {
        htmlString =
          '<span class="learner-action">Submitted answer "' + answer +
          '" and moved to card "' + destStateName + '" after spending ' +
          timeSpentInStateSecs + ' seconds on card "' + currentStateName +
          '".</span>';
      }
      return htmlString;
    };

    var renderLearnerActionsTableForMultipleIncorrectIssue = function(
        finalBlock) {
      var index = finalBlock.length - 1;
      var stateName =
        finalBlock[index].actionCustomizationArgs.state_name.value;

      var tableHTML =
        '<table class="learner-actions-table"><tr><th>Answer</th>' +
        '<th>Feedback</th></tr>';
      for (var i = 0; i < index; i++) {
        if (finalBlock[i].actionType !== ACTION_TYPE_ANSWER_SUBMIT) {
          continue;
        }
        var answer = finalBlock[i].actionCustomizationArgs.answer.value;
        var feedback = finalBlock[i].actionCustomizationArgs.feedback.value;
        tableHTML +=
          '<tr><td>' + answer + '</td><td>' + feedback + '</td></tr>';
      }
      tableHTML += '</table>';
      return tableHTML;
    };

    var renderLearnerActionHTML = function(learnerAction) {
      var actionType = learnerAction.actionType;
      var custArgs = learnerAction.actionCustomizationArgs;
      if (actionType == ACTION_TYPE_EXPLORATION_START) {
        return renderExplorationStartActionHTML(custArgs.state_name.value);
      } else if (actionType == ACTION_TYPE_EXPLORATION_QUIT) {
        return renderExplorationQuitActionHTML(
          custArgs.state_name.value, custArgs.time_spent_in_state_secs.value);
      } else if (actionType == ACTION_TYPE_ANSWER_SUBMIT) {
        interactionId =
          custArgs.interaction_id.value;
        if (interactionId === 'Continue') {
          return renderContinueButtonSubmitActionHTML(
            custArgs.dest_state_name.value,
            custArgs.time_spent_in_state_secs.value);
        }
        if (custArgs.answer.value) {
          return renderAnswerSubmitActionHTML(
            custArgs.answer.value, custArgs.dest_state_name.value,
            custArgs.time_spent_in_state_secs.value, custArgs.state_name.value
          );
        }
      }
    };

    return {
      renderFinalDisplayBlockForMISIssueHTML: function(block) {
        var index = block.length - 1;
        var stateName = block[index].actionCustomizationArgs.state_name.value;
        var htmlString = '';
        for (
          var i = 0; block[i].actionType !== ACTION_TYPE_ANSWER_SUBMIT; i++) {
          htmlString += renderLearnerActionHTML(block[i]);
        }
        htmlString +=
          '<span class="learner-action">Submitted the following answers in ' +
          'card "' + stateName + '"</span>';
        htmlString += renderLearnerActionsTableForMultipleIncorrectIssue(block);
        htmlString += renderLearnerActionHTML(block[index]);
        return htmlString;
      },
      renderDisplayBlockHTML: function(block) {
        var htmlString = '';
        for (var i = 0; i < block.length; i++) {
          htmlString += renderLearnerActionHTML(block[i]);
        }
        return htmlString;
      },
      getDisplayBlocks: function(learnerActions) {
        var displayBlocks = [];
        var lastIndex = learnerActions.length - 1;
        var localBlock = [learnerActions[lastIndex]];
        var stateName =
          learnerActions[lastIndex].actionCustomizationArgs.state_name.value;
        for (var i = lastIndex - 1; i >= 0; i--) {
          var action = learnerActions[i];
          if (action.actionCustomizationArgs.state_name.value !== stateName) {
            stateName = action.actionCustomizationArgs.state_name.value;
            if (localBlock.length < 4) {
              localBlock.unshift(action);
              continue;
            }
            displayBlocks.push(localBlock);
            localBlock = [action];
          } else {
            localBlock.unshift(action);
          }
        }
        if (localBlock) {
          displayBlocks.push(localBlock);
        }
        return displayBlocks;
      }
    };
  }]);
