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
 * @fileoverview Controllers for the graphical state editor.
 */

oppia.controller('StateEditor', [
  '$scope', '$rootScope', 'EditorStateService', 'ExplorationStatesService',
  'INTERACTION_SPECS', 'ExplorationAdvancedFeaturesService',
  'UrlInterpolationService', 'stateContentService',
  'stateContentIdsToAudioTranslationsService',
  function(
      $scope, $rootScope, EditorStateService, ExplorationStatesService,
      INTERACTION_SPECS, ExplorationAdvancedFeaturesService,
      UrlInterpolationService, stateContentService,
      stateContentIdsToAudioTranslationsService) {
    $scope.areParametersEnabled = (
      ExplorationAdvancedFeaturesService.areParametersEnabled);

    $scope.currentStateIsTerminal = false;
    $scope.interactionIdIsSet = false;
    $scope.interactionIsShown = false;

    $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_100px.svg');

    $scope.$on('refreshStateEditor', function() {
      $scope.initStateEditor();
    });

    $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
      $scope.interactionIdIsSet = Boolean(newInteractionId);
      $scope.currentInteractionCanHaveSolution = Boolean(
        $scope.interactionIdIsSet &&
        INTERACTION_SPECS[newInteractionId].can_have_solution);
      $scope.currentStateIsTerminal = Boolean(
        $scope.interactionIdIsSet && INTERACTION_SPECS[
          newInteractionId].is_terminal);
    });

    $scope.initStateEditor = function() {
      var stateName = EditorStateService.getActiveStateName();
      var stateData = ExplorationStatesService.getState(stateName);
      if (stateName && stateData) {
        stateContentService.init(
          EditorStateService.getActiveStateName(), stateData.content);
        stateContentIdsToAudioTranslationsService.init(
          EditorStateService.getActiveStateName(),
          stateData.contentIdsToAudioTranslations);

        $rootScope.$broadcast('stateEditorInitialized', stateData);
        var interactionId = ExplorationStatesService.getInteractionIdMemento(
          stateName);
        $scope.interactionIdIsSet = Boolean(interactionId);
        $scope.currentInteractionCanHaveSolution = Boolean(
          $scope.interactionIdIsSet &&
          INTERACTION_SPECS[interactionId].can_have_solution);
        $scope.currentStateIsTerminal = Boolean(
          $scope.interactionIdIsSet &&
          INTERACTION_SPECS[interactionId].is_terminal);

        var content = ExplorationStatesService.getStateContentMemento(
          stateName);
        if (content.getHtml() || stateData.interaction.id) {
          $scope.interactionIsShown = true;
        }

        $rootScope.loadingMessage = '';
      }
    };

    $scope.showInteraction = function() {
      // Show the interaction when the text content is saved, even if no
      // content is entered.
      $scope.interactionIsShown = true;
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
        onFinishTraining: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'training_answer_modal_directive.html'),
      controller: [
        '$scope', 'ExplorationHtmlFormatterService',
        'EditorStateService', 'ExplorationStatesService',
        'TrainingDataService', 'ResponsesService', 'stateInteractionIdService',
        'stateCustomizationArgsService', 'AnswerGroupObjectFactory',
        'OutcomeObjectFactory', 'GenerateContentIdService',
        'COMPONENT_NAME_FEEDBACK', 'stateContentIdsToAudioTranslationsService',
        function(
            $scope, ExplorationHtmlFormatterService,
            EditorStateService, ExplorationStatesService,
            TrainingDataService, ResponsesService, stateInteractionIdService,
            stateCustomizationArgsService, AnswerGroupObjectFactory,
            OutcomeObjectFactory, GenerateContentIdService,
            COMPONENT_NAME_FEEDBACK,
            stateContentIdsToAudioTranslationsService) {
          $scope.addingNewResponse = false;

          var _stateName = EditorStateService.getActiveStateName();
          var _state = ExplorationStatesService.getState(_stateName);
          $scope.allOutcomes = TrainingDataService.getAllPotentialOutcomes(
            _state);

          var _updateAnswerTemplate = function() {
            $scope.answerTemplate = (
              ExplorationHtmlFormatterService.getAnswerHtml(
                $scope.answer, stateInteractionIdService.savedMemento,
                stateCustomizationArgsService.savedMemento));
          };

          $scope.$watch('answer', _updateAnswerTemplate);
          _updateAnswerTemplate();
          $scope.selectedAnswerGroupIndex = -1;

          var _saveNewAnswerGroup = function(newAnswerGroup) {
            var answerGroups = ResponsesService.getAnswerGroups();
            answerGroups.push(newAnswerGroup);
            ResponsesService.save(
              answerGroups, ResponsesService.getDefaultOutcome());
            stateContentIdsToAudioTranslationsService.displayed.addContentId(
              newAnswerGroup.outcome.feedback.getContentId());
            stateContentIdsToAudioTranslationsService.saveDisplayedValue();
          };

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
          };

          $scope.onConfirm = function() {
            var index = $scope.selectedAnswerGroupIndex;
            $scope.classification.answerGroupIndex = index;

            if (index > ResponsesService.getAnswerGroupCount()) {
              var newOutcome = $scope.allOutcomes[index];
              var newAnswerGroup = AnswerGroupObjectFactory.createNew(
                [], angular.copy(newOutcome), [$scope.answer], null);
              _saveNewAnswerGroup(newAnswerGroup);
            } else if (index === ResponsesService.getAnswerGroupCount()) {
              TrainingDataService.associateWithDefaultResponse($scope.answer);
            } else {
              TrainingDataService.associateWithAnswerGroup(
                index, $scope.answer);
            }
            $scope.onFinishTraining();
          };

          $scope.confirmNewFeedback = function() {
            if ($scope.classification.newOutcome) {
              // Push the new outcome at the end of the all outcomes.
              $scope.allOutcomes.push($scope.classification.newOutcome);
              $scope.selectedAnswerGroupIndex = $scope.allOutcomes.length - 1;
              $scope.addingNewResponse = false;
            }
          };
        }
      ]
    };
  }]
);
