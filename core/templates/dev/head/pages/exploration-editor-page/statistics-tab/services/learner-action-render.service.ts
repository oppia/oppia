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

require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/statistics-tab/issues/' +
  'answer-submit-action.directive.ts');
require(
  'pages/exploration-editor-page/statistics-tab/issues/' +
  'multiple-incorrect-submissions-issue.directive.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').factory('LearnerActionRenderService', [
  'ExplorationStatesService', 'HtmlEscaperService',
  'ACTION_TYPE_ANSWER_SUBMIT', 'ACTION_TYPE_EXPLORATION_QUIT',
  'ACTION_TYPE_EXPLORATION_START',
  function(
      ExplorationStatesService, HtmlEscaperService,
      ACTION_TYPE_ANSWER_SUBMIT, ACTION_TYPE_EXPLORATION_QUIT,
      ACTION_TYPE_EXPLORATION_START) {
    var renderExplorationStartActionHTML = function(stateName, actionIndex) {
      var statement =
        actionIndex + '. Started exploration at card "' + stateName + '".';
      return ($('<span>').text(statement)).html();
    };

    var renderExplorationQuitActionHTML = function(
        stateName, timeSpentInStateSecs, actionIndex) {
      var statement =
        actionIndex + '. Left the exploration after spending a total of ' +
        timeSpentInStateSecs + ' seconds on card "' + stateName + '".';
      return ($('<span>').text(statement)).html();
    };

    var renderContinueButtonSubmitActionHTML = function(
        stateName, timeSpentInStateSecs, actionIndex) {
      var statement =
        actionIndex + '. Pressed "Continue" to move to card "' + stateName +
        '" after ' + timeSpentInStateSecs + ' seconds.';
      return ($('<span>').text(statement)).html();
    };

    /**
     * Renders the correct HTML for AnswerSubmit action after checking for a
     * change in state.
     * @param {string} answer.
     * @param {string} destStateName.
     * @param {int} timeSpentInStateSecs.
     * @param {string} currentStateName.
     * @param {int} actionIndex.
     * @param {Interaction} interaction.
     * @returns {string}
     */
    var renderAnswerSubmitActionHTML = function(
        answer, destStateName, timeSpentInStateSecs, currentStateName,
        actionIndex, interaction) {
      var el = $('<answer-submit-action>');
      el.attr('answer', HtmlEscaperService.objToEscapedJson(answer));
      el.attr('dest-state-name', destStateName);
      el.attr('time-spent-in-state-secs', timeSpentInStateSecs);
      el.attr('current-state-name', currentStateName);
      el.attr('action-index', actionIndex);
      el.attr('interaction-id', interaction.id);
      el.attr(
        'interaction-customization-args',
        HtmlEscaperService.objToEscapedJson(interaction.customizationArgs));
      return ($('<span>').append(el)).html();
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
      var interaction = ExplorationStatesService.getState(
        custArgs.state_name.value).interaction;
      if (actionType === ACTION_TYPE_EXPLORATION_START) {
        return renderExplorationStartActionHTML(
          custArgs.state_name.value, actionIndex);
      } else if (actionType === ACTION_TYPE_EXPLORATION_QUIT) {
        return renderExplorationQuitActionHTML(
          custArgs.state_name.value,
          custArgs.time_spent_in_state_in_msecs.value, actionIndex);
      } else if (actionType === ACTION_TYPE_ANSWER_SUBMIT) {
        var interactionId = custArgs.interaction_id.value;
        if (interactionId === 'Continue') {
          return renderContinueButtonSubmitActionHTML(
            custArgs.dest_state_name.value,
            custArgs.time_spent_state_in_msecs.value, actionIndex);
        } else {
          return renderAnswerSubmitActionHTML(
            custArgs.submitted_answer.value, custArgs.dest_state_name.value,
            custArgs.time_spent_state_in_msecs.value, custArgs.state_name.value,
            actionIndex, interaction);
        }
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
        var el = $('<multiple-incorrect-submissions-issue>');
        el.attr('final-block', HtmlEscaperService.objToEscapedJson(block));
        el.attr('action-start-index', actionStartIndex);
        return ($('<span>').append(el)).html();
      },
      renderLearnerAction: function(learnerAction, actionIndex) {
        return renderLearnerActionHTML(learnerAction, actionIndex);
      },
    };
  }]);
