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
 * @fileoverview Directive for the Multiple Incorrect Submission Issue.
 */

require('services/exploration-html-formatter.service.ts');
require('services/html-escaper.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');

angular.module('oppia').directive('multipleIncorrectSubmissionsIssue', [
  'ExplorationHtmlFormatterService', 'ExplorationStatesService',
  'HtmlEscaperService', 'LearnerActionRenderService', 'UrlInterpolationService',
  'ACTION_TYPE_ANSWER_SUBMIT',
  function(
      ExplorationHtmlFormatterService, ExplorationStatesService,
      HtmlEscaperService, LearnerActionRenderService, UrlInterpolationService,
      ACTION_TYPE_ANSWER_SUBMIT) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/statistics-tab/issues/' +
        'multiple-incorrect-submissions-issue.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.finalBlock = HtmlEscaperService.escapedJsonToObj(
          $attrs.finalBlock);
        ctrl.index = this.finalBlock.length - 1;
        ctrl.actionStartIndex = parseInt($attrs.actionStartIndex);
        ctrl.stateName =
          this.finalBlock[this.index].actionCustomizationArgs.state_name.value;

        var _nonSubmitActions = [];
        for (
          var i = 0;
          this.finalBlock[i].actionType !== ACTION_TYPE_ANSWER_SUBMIT; i++) {
          _nonSubmitActions.push(this.finalBlock[i]);
        }
        ctrl.nonSubmitActions = _nonSubmitActions;
        ctrl.tableIndex = this.actionStartIndex + i;

        ctrl.getShortAnswerHtml = function(action) {
          var _answer = action.actionCustomizationArgs.submitted_answer.value;
          var interaction = ExplorationStatesService.getState(
            this.stateName).interaction;
          return ExplorationHtmlFormatterService.getShortAnswerHtml(
            _answer, interaction.id, interaction.customizationArgs);
        };

        ctrl.getFeedback = function(action) {
          var _feedback = action.actionCustomizationArgs.feedback.value._html;
          _feedback = _feedback.replace(
            '{{answer}}', this.getShortAnswerHtml(action));
          return _feedback;
        };

        ctrl.isActionSubmit = function(action) {
          return action.actionType === ACTION_TYPE_ANSWER_SUBMIT;
        };

        /**
         * Returns the index of the learner action.
         * @param {int} learnerActionIndex.
         * @returns {int}
         */
        ctrl.getLearnerActionIndex = function(learnerActionIndex) {
          return (
            this.actionStartIndex + learnerActionIndex + 1);
        };

        /**
         * Renders the HTML of the learner action.
         * @param {LearnerAction} learnerAction.
         * @param {int} actionIndex - The index of the learner action.
         * @returns {string}
         */
        ctrl.renderLearnerAction = function(
            learnerAction, actionIndex) {
          return LearnerActionRenderService.renderLearnerAction(
            learnerAction, actionIndex);
        };
      }]
    };
  }
]);
