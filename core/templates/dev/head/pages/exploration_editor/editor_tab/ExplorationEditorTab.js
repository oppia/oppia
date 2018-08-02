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
 * @fileoverview Controller for the Editor tab in the exploration editor page.
 */

oppia.controller('ExplorationEditorTab', [
  '$scope', '$rootScope', 'EditorStateService', 'ExplorationStatesService',
  'ExplorationAdvancedFeaturesService', 'UrlInterpolationService',
  'ExplorationInitStateNameService', 'GraphDataService', 'RouterService',
  'ExplorationCorrectnessFeedbackService', 'AlertsService',
  'ContextService', 'ExplorationWarningsService',
  function(
      $scope, $rootScope, EditorStateService, ExplorationStatesService,
      ExplorationAdvancedFeaturesService, UrlInterpolationService,
      ExplorationInitStateNameService, GraphDataService, RouterService,
      ExplorationCorrectnessFeedbackService, AlertsService,
      ContextService, ExplorationWarningsService) {
    $scope.areParametersEnabled = (
      ExplorationAdvancedFeaturesService.areParametersEnabled);

    $scope.interactionIsShown = false;

    $scope.$on('refreshStateEditor', function() {
      $scope.initStateEditor();
    });

    $scope.$watch(ExplorationStatesService.getStates, function() {
      if (ExplorationStatesService.getStates()) {
        EditorStateService.setStateNames(
          ExplorationStatesService.getStateNames());
      }
    }, true);

    $scope.getStateContentPlaceholder = function() {
      if (
        EditorStateService.getActiveStateName() ===
        ExplorationInitStateNameService.savedMemento) {
        return (
          'This is the first card of your exploration. Use this space to ' +
          'introduce your topic and engage the learner, then ask them a ' +
          'question.');
      } else {
        return (
          'You can speak to the learner here, then ask them a question.');
      }
    };

    $scope.addState = function(newStateName) {
      ExplorationStatesService.addState(newStateName, null);
    };

    $scope.refreshWarnings = function() {
      ExplorationWarningsService.updateWarnings();
    };

    $scope.initStateEditor = function() {
      $scope.stateName = EditorStateService.getActiveStateName();
      EditorStateService.setStateNames(
        ExplorationStatesService.getStateNames());
      EditorStateService.setCorrectnessFeedbackEnabled(
        ExplorationCorrectnessFeedbackService.isEnabled());
      EditorStateService.setInQuestionMode(false);
      var stateData = ExplorationStatesService.getState($scope.stateName);
      if ($scope.stateName && stateData) {
        $rootScope.$broadcast('stateEditorInitialized', stateData);

        var content = ExplorationStatesService.getStateContentMemento(
          $scope.stateName);
        if (content.getHtml() || stateData.interaction.id) {
          $scope.interactionIsShown = true;
        }

        $rootScope.loadingMessage = '';
      }
    };

    $scope.recomputeGraph = function() {
      GraphDataService.recompute();
    };

    $scope.saveStateContent = function(displayedValue) {
      ExplorationStatesService.saveStateContent(
        $scope.stateName, angular.copy(displayedValue));
      // Show the interaction when the text content is saved, even if no
      // content is entered.
      $scope.interactionIsShown = true;
    };

    $scope.saveInteractionId = function(displayedValue) {
      ExplorationStatesService.saveInteractionId(
        $scope.stateName, angular.copy(displayedValue));
      EditorStateService.setInteractionId(angular.copy(displayedValue));
    };

    $scope.saveInteractionAnswerGroups = function(newAnswerGroups) {
      ExplorationStatesService.saveInteractionAnswerGroups(
        $scope.stateName, angular.copy(newAnswerGroups));

      EditorStateService.setInteractionAnswerGroups(
        angular.copy(newAnswerGroups));
      $scope.recomputeGraph();
    };

    $scope.saveInteractionDefaultOutcome = function(newOutcome) {
      ExplorationStatesService.saveInteractionDefaultOutcome(
        $scope.stateName, angular.copy(newOutcome));

      EditorStateService.setInteractionDefaultOutcome(
        angular.copy(newOutcome));
      $scope.recomputeGraph();
    };

    $scope.saveInteractionCustomizationArgs = function(displayedValue) {
      ExplorationStatesService.saveInteractionCustomizationArgs(
        $scope.stateName, angular.copy(displayedValue));

      EditorStateService.setInteractionCustomizationArgs(
        angular.copy(displayedValue));
    };

    $scope.saveSolution = function(displayedValue) {
      ExplorationStatesService.saveSolution(
        $scope.stateName, angular.copy(displayedValue));

      EditorStateService.setInteractionSolution(
        angular.copy(displayedValue));
    };

    $scope.saveHints = function(displayedValue) {
      ExplorationStatesService.saveHints(
        $scope.stateName, angular.copy(displayedValue));

      EditorStateService.setInteractionHints(
        angular.copy(displayedValue));
    };

    $scope.saveContentIdsToAudioTranslations = function(displayedValue) {
      ExplorationStatesService.saveContentIdsToAudioTranslations(
        $scope.stateName, angular.copy(displayedValue));
    };

    $scope.navigateToState = function(stateName) {
      RouterService.navigateToMainTab(stateName);
    };
  }
]);

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
        'EditorStateService', 'ExplorationStatesService',
        'TrainingDataService', 'ResponsesService', 'StateInteractionIdService',
        'StateCustomizationArgsService', 'AnswerGroupObjectFactory',
        'OutcomeObjectFactory', 'GenerateContentIdService',
        'COMPONENT_NAME_FEEDBACK',
        'StateContentIdsToAudioTranslationsService',
        function(
            $scope, ExplorationHtmlFormatterService,
            EditorStateService, ExplorationStatesService,
            TrainingDataService, ResponsesService, StateInteractionIdService,
            StateCustomizationArgsService, AnswerGroupObjectFactory,
            OutcomeObjectFactory, GenerateContentIdService,
            COMPONENT_NAME_FEEDBACK,
            StateContentIdsToAudioTranslationsService) {
          $scope.addingNewResponse = false;

          var _stateName = EditorStateService.getActiveStateName();
          var _state = ExplorationStatesService.getState(_stateName);
          $scope.allOutcomes = TrainingDataService.getAllPotentialOutcomes(
            _state);

          var _updateAnswerTemplate = function() {
            $scope.answerTemplate = (
              ExplorationHtmlFormatterService.getAnswerHtml(
                $scope.answer, StateInteractionIdService.savedMemento,
                StateCustomizationArgsService.savedMemento));
          };

          $scope.$watch('answer', _updateAnswerTemplate);
          _updateAnswerTemplate();
          $scope.selectedAnswerGroupIndex = (
            $scope.classification.answerGroupIndex);

          $scope.getCurrentStateName = function() {
            return EditorStateService.getActiveStateName();
          };

          $scope.beginAddingNewResponse = function() {
            var contentId = GenerateContentIdService.getNextId(
              COMPONENT_NAME_FEEDBACK);
            $scope.classification.newOutcome = OutcomeObjectFactory.createNew(
              EditorStateService.getActiveStateName(), contentId, '', []);
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
