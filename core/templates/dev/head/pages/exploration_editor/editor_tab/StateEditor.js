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
  '$scope', '$rootScope', 'editorContextService', 'explorationStatesService',
  'INTERACTION_SPECS', 'ExplorationAdvancedFeaturesService',
  'UrlInterpolationService', 'stateContentService',
  function(
      $scope, $rootScope, editorContextService, explorationStatesService,
      INTERACTION_SPECS, ExplorationAdvancedFeaturesService,
      UrlInterpolationService, stateContentService) {
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
      var stateName = editorContextService.getActiveStateName();
      var stateData = explorationStatesService.getState(stateName);
      if (stateName && stateData) {
        stateContentService.init(
          editorContextService.getActiveStateName(), stateData.content);

        $rootScope.$broadcast('stateEditorInitialized', stateData);
        var interactionId = explorationStatesService.getInteractionIdMemento(
          stateName);
        $scope.interactionIdIsSet = Boolean(interactionId);
        $scope.currentInteractionCanHaveSolution = Boolean(
          $scope.interactionIdIsSet &&
          INTERACTION_SPECS[interactionId].can_have_solution);
        $scope.currentStateIsTerminal = Boolean(
          $scope.interactionIdIsSet &&
          INTERACTION_SPECS[interactionId].is_terminal);

        var content = explorationStatesService.getStateContentMemento(
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

<<<<<<< HEAD
// A service which handles opening and closing the training modal used for both
// unresolved answers and answers within the training data of a classifier.
oppia.factory('trainingModalService', [
  '$rootScope', '$modal', 'alertsService', 'UrlInterpolationService',
  function($rootScope, $modal, alertsService, UrlInterpolationService) {
    return {
      openTrainUnresolvedAnswerModal: function(unhandledAnswer, externalSave) {
        alertsService.clearWarnings();
        if (externalSave) {
          $rootScope.$broadcast('externalSave');
        }

        $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/editor_tab/' +
            'training_unresolved_answer_modal_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$injector', '$modalInstance',
            'explorationStatesService', 'editorContextService',
            'AnswerClassificationService', 'explorationContextService',
            'stateInteractionIdService', 'angularNameService',
            function($scope, $injector, $modalInstance,
                explorationStatesService, editorContextService,
                AnswerClassificationService, explorationContextService,
                stateInteractionIdService, angularNameService) {
              $scope.trainingDataAnswer = '';
              $scope.trainingDataFeedback = '';
              $scope.trainingDataOutcomeDest = '';

              // See the training panel directive in StateEditor for an
              // explanation on the structure of this object.
              $scope.classification = {
                answerGroupIndex: 0,
                newOutcome: null
              };

              $scope.finishTraining = function() {
                $modalInstance.close();
              };

              $scope.init = function() {
                var explorationId =
                  explorationContextService.getExplorationId();
                var currentStateName =
                  editorContextService.getActiveStateName();
                var state = explorationStatesService.getState(currentStateName);

                // Retrieve the interaction ID.
                var interactionId = stateInteractionIdService.savedMemento;

                var rulesServiceName =
                  angularNameService.getNameOfInteractionRulesService(
                    interactionId)

                // Inject RulesService dynamically.
                var rulesService = $injector.get(rulesServiceName);

                var classificationResult = (
                  AnswerClassificationService.getMatchingClassificationResult(
                    explorationId, currentStateName, state, unhandledAnswer,
                    true, rulesService));
                var feedback = 'Nothing';
                var dest = classificationResult.outcome.dest;
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback[0];
                }
                if (dest === currentStateName) {
                  dest = '<em>(try again)</em>';
                }

                // $scope.trainingDataAnswer, $scope.trainingDataFeedback
                // $scope.trainingDataOutcomeDest are intended to be local
                // to this modal and should not be used to populate any
                // information in the active exploration (including the
                // feedback). The feedback here refers to a representation
                // of the outcome of an answer group, rather than the
                // specific feedback of the outcome (for instance, it
                // includes the destination state within the feedback).
                $scope.trainingDataAnswer = unhandledAnswer;
                $scope.trainingDataFeedback = feedback;
                $scope.trainingDataOutcomeDest = dest;
                $scope.classification.answerGroupIndex = (
                  classificationResult.answerGroupIndex);
              };

              $scope.init();
            }]
        });
      }
    };
  }
]);

oppia.directive('trainingPanel', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        answer: '=',
        answerFeedback: '=',
        answerOutcomeDest: '=',
        // The classification input is an object with two keys:
        //   -answerGroupIndex: This refers to which answer group the answer
        //      being trained has been classified to (for displaying feedback
        //      to the creator). If answerGroupIndex is equal to the number of
        //      of answer groups, then it represents the default outcome
        //      feedback. This index is changed by the panel when the creator
        //      specifies which feedback should be associated with the answer.
        //   -newOutcome: This refers to an outcome structure (containing a list
        //      of feedback and a destination state name) which is non-null if,
        //      and only if, the creator has specified that a new response
        //      should be created for the trained answer.
        classification: '=',
        onFinishTraining: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'training_answer_modal_directive.html'),
      controller: [
        '$scope', 'oppiaExplorationHtmlFormatterService',
        'editorContextService', 'explorationStatesService',
        'TrainingDataService', 'responsesService', 'stateInteractionIdService',
        'stateCustomizationArgsService', 'AnswerGroupObjectFactory',
        'OutcomeObjectFactory',
        function($scope, oppiaExplorationHtmlFormatterService,
            editorContextService, explorationStatesService,
            TrainingDataService, responsesService, stateInteractionIdService,
            stateCustomizationArgsService, AnswerGroupObjectFactory,
            OutcomeObjectFactory) {
          $scope.changingAnswerGroupIndex = false;
          $scope.addingNewResponse = false;

          var _stateName = editorContextService.getActiveStateName();
          var _state = explorationStatesService.getState(_stateName);
          $scope.allOutcomes = TrainingDataService.getAllPotentialOutcomes(
            _state);

          var _updateAnswerTemplate = function() {
            $scope.answerTemplate = (
              oppiaExplorationHtmlFormatterService.getAnswerHtml(
                $scope.answer, stateInteractionIdService.savedMemento,
                stateCustomizationArgsService.savedMemento));
          };

          $scope.$watch('answer', _updateAnswerTemplate);
          _updateAnswerTemplate();

          $scope.getCurrentStateName = function() {
            return editorContextService.getActiveStateName();
          };

          $scope.beginChangingAnswerGroupIndex = function() {
            $scope.changingAnswerGroupIndex = true;
          };

          $scope.beginAddingNewResponse = function() {
            $scope.classification.newOutcome = OutcomeObjectFactory.createNew(
              editorContextService.getActiveStateName(), [''], []);
            $scope.addingNewResponse = true;
          };

          $scope.confirmAnswerGroupIndex = function(index) {
            $scope.classification.answerGroupIndex = index;

            if (index === responsesService.getAnswerGroupCount()) {
              TrainingDataService.trainDefaultResponse($scope.answer);
            } else {
              TrainingDataService.trainAnswerGroup(index, $scope.answer);
            }

            $scope.onFinishTraining();
          };
          $scope.confirmNewFeedback = function() {
            if ($scope.classification.newOutcome) {
              // Create a new answer group with the given feedback.
              var answerGroups = responsesService.getAnswerGroups();
              answerGroups.push(AnswerGroupObjectFactory.createNew(
                [], angular.copy($scope.classification.newOutcome), false));
              responsesService.save(
                answerGroups, responsesService.getDefaultOutcome());

              // Train the group with the answer.
              var index = responsesService.getAnswerGroupCount() - 1;
              TainingDataService.trainAnswerGroup(index, $scope.answer);
            }

            $scope.onFinishTraining();
          };
        }
      ]
    };
  }
]);
