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
 * @fileoverview Component for the training panel in the state editor.
 */
require(
  'components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.component.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');

angular.module('oppia').component('trainingPanel', {
  bindings: {
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
  template: require('./training-panel.component.html'),
  controller: [
    '$scope', 'ExplorationHtmlFormatterService', 'ExplorationStatesService',
    'GenerateContentIdService', 'OutcomeObjectFactory', 'ResponsesService',
    'StateCustomizationArgsService', 'StateEditorService',
    'StateInteractionIdService', 'TrainingDataService',
    'COMPONENT_NAME_FEEDBACK',
    function(
        $scope, ExplorationHtmlFormatterService, ExplorationStatesService,
        GenerateContentIdService, OutcomeObjectFactory, ResponsesService,
        StateCustomizationArgsService, StateEditorService,
        StateInteractionIdService, TrainingDataService,
        COMPONENT_NAME_FEEDBACK) {
      var ctrl = this;
      var _updateAnswerTemplate = function() {
        $scope.answerTemplate = (
          ExplorationHtmlFormatterService.getAnswerHtml(
            ctrl.answer, StateInteractionIdService.savedMemento,
            StateCustomizationArgsService.savedMemento));
      };

      $scope.getCurrentStateName = function() {
        return StateEditorService.getActiveStateName();
      };

      $scope.beginAddingNewResponse = function() {
        var contentId = GenerateContentIdService.getNextStateId(
          COMPONENT_NAME_FEEDBACK);
        ctrl.classification.newOutcome = OutcomeObjectFactory.createNew(
          StateEditorService.getActiveStateName(), contentId, '', []);
        ctrl.addingNewResponse = true;
      };

      $scope.cancelAddingNewResponse = function() {
        ctrl.addingNewResponse = false;
        ctrl.classification.newOutcome = null;
      };

      $scope.selectAnswerGroupIndex = function(index) {
        $scope.selectedAnswerGroupIndex = index;
        ctrl.classification.answerGroupIndex = index;
        if (index > ResponsesService.getAnswerGroupCount()) {
          ctrl.classification.newOutcome = $scope.allOutcomes[index];
        }
      };

      $scope.confirmNewFeedback = function() {
        if (ctrl.classification.newOutcome) {
          // Push the new outcome at the end of the existing outcomes.
          $scope.allOutcomes.push(ctrl.classification.newOutcome);
          $scope.selectAnswerGroupIndex($scope.allOutcomes.length - 1);
          ctrl.addingNewResponse = false;
        }
      };
      ctrl.$onInit = function() {
        ctrl.addingNewResponse = false;

        var _stateName = StateEditorService.getActiveStateName();
        var _state = ExplorationStatesService.getState(_stateName);
        $scope.allOutcomes = TrainingDataService.getAllPotentialOutcomes(
          _state);
        $scope.$watch('answer', _updateAnswerTemplate);
        _updateAnswerTemplate();
        $scope.selectedAnswerGroupIndex = (
          ctrl.classification.answerGroupIndex);
      };
    }
  ]
});
