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
 * @fileoverview Directive for the training panel in the state editor.
 */

oppia.directive('trainingPanel', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        answer: '=',
        // The classification input is an object with two keys:
        //   -answerGroupIndex: This refers to which answer group the answer
        //      being trained has been classified to (for displaying feedback
        //      to the creator). If answerGroupIndex is equal to the number of
        //      answer groups, then it represents the default outcome feedback.
        //      This index is changed by the panel when the creator specifies
        //      which feedback should be associated with the answer.
        //   -newOutcome: This refers to an outcome structure (containing a
        //      list of feedback and a destination state name) which is
        //      non-null if, and only if, the creator has specified that a new
        //      response should be created for the trained answer.
        classification: '=',
        onFinishTraining: '&',
        addingNewResponse: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'training_answer_modal_directive.html'),
      controller: [
        '$scope', 'ExplorationHtmlFormatterService',
        'StateEditorService', 'ExplorationStatesService',
        'TrainingDataService', 'ResponsesService', 'StateInteractionIdService',
        'StateCustomizationArgsService', 'AnswerGroupObjectFactory',
        'OutcomeObjectFactory', 'GenerateContentIdService',
        'COMPONENT_NAME_FEEDBACK',
        function(
            $scope, ExplorationHtmlFormatterService,
            StateEditorService, ExplorationStatesService,
            TrainingDataService, ResponsesService, StateInteractionIdService,
            StateCustomizationArgsService, AnswerGroupObjectFactory,
            OutcomeObjectFactory, GenerateContentIdService,
            COMPONENT_NAME_FEEDBACK) {
          $scope.addingNewResponse = false;

          var _stateName = StateEditorService.getActiveStateName();
          var _state = ExplorationStatesService.getState(_stateName);
          $scope.allOutcomes = TrainingDataService.getAllPotentialOutcomes(
            _state);

          var _updateAnswerTemplate = function() {
            $scope.answerTemplate = (
              ExplorationHtmlFormatterService.getAnswerHtml(
                $scope.answer, StateInteractionIdService.savedMemento,
                StateCustomizationArgsService.savedMemento));
          };

          var _getExistingOutcomeContentIds = function() {
            var existingContentIds = [];
            $scope.allOutcomes.forEach(function(outcome) {
              var contentId = outcome.feedback.getContentId();
              existingContentIds.push(contentId);
            });
            return existingContentIds;
          };

          $scope.$watch('answer', _updateAnswerTemplate);
          _updateAnswerTemplate();
          $scope.selectedAnswerGroupIndex = (
            $scope.classification.answerGroupIndex);

          $scope.getCurrentStateName = function() {
            return StateEditorService.getActiveStateName();
          };

          $scope.beginAddingNewResponse = function() {
            var contentId = GenerateContentIdService.getNextId(
              _getExistingOutcomeContentIds(), COMPONENT_NAME_FEEDBACK);
            $scope.classification.newOutcome = OutcomeObjectFactory.createNew(
              StateEditorService.getActiveStateName(), contentId, '', []);
            $scope.addingNewResponse = true;
          };

          $scope.cancelAddingNewResponse = function() {
            $scope.addingNewResponse = false;
            $scope.classification.newOutcome = null;
          };

          $scope.selectAnswerGroupIndex = function(index) {
            $scope.selectedAnswerGroupIndex = index;
            $scope.classification.answerGroupIndex = index;
            if (index > ResponsesService.getAnswerGroupCount()) {
              $scope.classification.newOutcome = $scope.allOutcomes[index];
            }
          };

          $scope.confirmNewFeedback = function() {
            if ($scope.classification.newOutcome) {
              // Push the new outcome at the end of the existing outcomes.
              $scope.allOutcomes.push($scope.classification.newOutcome);
              $scope.selectAnswerGroupIndex($scope.allOutcomes.length - 1);
              $scope.addingNewResponse = false;
            }
          };
        }
      ]
    };
  }]
);
