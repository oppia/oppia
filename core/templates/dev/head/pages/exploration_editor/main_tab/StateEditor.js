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
  '$scope', '$rootScope', 'editorContextService', 'changeListService',
  'editabilityService', 'explorationStatesService', 'INTERACTION_SPECS',
  'explorationInitStateNameService', 'explorationAdvancedFeaturesService',
  'UrlInterpolationService', 'editorFirstTimeEventsService',
  function(
      $scope, $rootScope, editorContextService, changeListService,
      editabilityService, explorationStatesService, INTERACTION_SPECS,
      explorationInitStateNameService, explorationAdvancedFeaturesService,
      UrlInterpolationService, editorFirstTimeEventsService) {
    $scope.STATE_CONTENT_SCHEMA = {
      type: 'html'
    };

    $scope.areParametersEnabled = (
      explorationAdvancedFeaturesService.areParametersEnabled);
    $scope.areFallbacksEnabled = (
      explorationAdvancedFeaturesService.areFallbacksEnabled);

    $scope.isCurrentStateTerminal = false;
    $scope.isInteractionIdSet = false;
    $scope.isInteractionShown = false;

    $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_black_72px.png');

    $scope.isCurrentStateInitialState = function() {
      return (
        editorContextService.getActiveStateName() ===
        explorationInitStateNameService.savedMemento);
    };

    $scope.$on('refreshStateEditor', function() {
      $scope.initStateEditor();
    });

    $scope.$on('refreshStateContent', function() {
      $scope.content = explorationStatesService.getStateContentMemento(
        editorContextService.getActiveStateName());
    });

    $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
      $scope.isInteractionIdSet = Boolean(newInteractionId);
      $scope.isCurrentStateTerminal = (
        $scope.isInteractionIdSet && INTERACTION_SPECS[
          newInteractionId].is_terminal);
    });

    $scope.contentEditorIsOpen = false;

    $scope.initStateEditor = function() {
      var stateName = editorContextService.getActiveStateName();
      var stateData = explorationStatesService.getState(stateName);
      if (stateName && stateData) {
        $scope.content = explorationStatesService.getStateContentMemento(
          stateName);

        $rootScope.$broadcast('stateEditorInitialized', stateData);
        var interactionId = explorationStatesService.getInteractionIdMemento(
          stateName);
        $scope.isInteractionIdSet = Boolean(interactionId);
        $scope.isCurrentStateTerminal = (
          $scope.isInteractionIdSet &&
          INTERACTION_SPECS[interactionId].is_terminal);

        if ($scope.content[0].value || stateData.interaction.id) {
          $scope.isInteractionShown = true;
        }

        $scope.$on('externalSave', function() {
          if ($scope.contentEditorIsOpen) {
            $scope.saveTextContent();
          }
        });

        $rootScope.loadingMessage = '';
      }
    };

    $scope.openStateContentEditor = function() {
      if (editabilityService.isEditable()) {
        editorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
        $scope.contentEditorIsOpen = true;
      }
    };

    $scope.saveTextContent = function() {
      explorationStatesService.saveStateContent(
        editorContextService.getActiveStateName(), $scope.content);
      $scope.contentEditorIsOpen = false;
    };

    $scope.onSaveContentButtonClicked = function() {
      editorFirstTimeEventsService.registerFirstSaveContentEvent();
      $scope.saveTextContent();
      // Show the interaction when the text content is saved, even if no content
      // is entered.
      $scope.isInteractionShown = true;
    };

    $scope.cancelEdit = function() {
      $scope.content = explorationStatesService.getStateContentMemento(
        editorContextService.getActiveStateName());
      $scope.contentEditorIsOpen = false;
    };
  }
]);

// A service which handles opening and closing the training modal used for both
// unresolved answers and answers within the training data of a classifier.
oppia.factory('trainingModalService', ['$rootScope', '$modal', 'alertsService',
    function($rootScope, $modal, alertsService) {
  return {
    openTrainUnresolvedAnswerModal: function(unhandledAnswer, externalSave) {
      alertsService.clearWarnings();
      if (externalSave) {
        $rootScope.$broadcast('externalSave');
      }

      $modal.open({
        templateUrl: 'modals/trainUnresolvedAnswer',
        backdrop: true,
        controller: ['$scope', '$modalInstance', 'explorationStatesService',
          'editorContextService', 'AnswerClassificationService',
          'explorationContextService',
          function($scope, $modalInstance, explorationStatesService,
              editorContextService, AnswerClassificationService,
              explorationContextService) {
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
              var explorationId = explorationContextService.getExplorationId();
              var currentStateName = editorContextService.getActiveStateName();
              var state = explorationStatesService.getState(currentStateName);

              AnswerClassificationService.getMatchingClassificationResult(
                explorationId, state, unhandledAnswer, true).then(
                    function(classificationResult) {
                  var feedback = 'Nothing';
                  var dest = classificationResult.outcome.dest;
                  if (classificationResult.outcome.feedback.length > 0) {
                    feedback = classificationResult.outcome.feedback[0];
                  }
                  if (dest === currentStateName) {
                    dest = '<em>(try again)</em>';
                  }

                  // $scope.trainingDataAnswer, $scope.trainingDataFeedback
                  // $scope.trainingDataOutcomeDest are intended to be local to
                  // this modal and should not be used to populate any
                  // information in the active exploration (including the
                  // feedback). The feedback here refers to a representation of
                  // the outcome of an answer group, rather than the specific
                  // feedback of the outcome (for instance, it includes the
                  // destination state within the feedback).
                  $scope.trainingDataAnswer = unhandledAnswer;
                  $scope.trainingDataFeedback = feedback;
                  $scope.trainingDataOutcomeDest = dest;
                  $scope.classification.answerGroupIndex = (
                    classificationResult.answerGroupIndex);
                });
            };

            $scope.init();
          }]
      });
    }
  };
}]);

// A service that, given an exploration ID and state name, determines all of the
// answers which do not have certain classification and are not currently used
// as part of any classifier training models.
oppia.factory('trainingDataService', [
  '$rootScope', '$http', 'responsesService', 'CLASSIFIER_RULESPEC_STR',
  'DEFAULT_CLASSIFIER_RULE_SPEC',
  function(
      $rootScope, $http, responsesService, CLASSIFIER_RULESPEC_STR,
      DEFAULT_CLASSIFIER_RULE_SPEC) {
    var _trainingDataAnswers = [];
    var _trainingDataCounts = [];

    var _getIndexOfTrainingData = function(answer, trainingData) {
      var index = -1;
      for (var i = 0; i < trainingData.length; i++) {
        if (angular.equals(trainingData[i], answer)) {
          index = i;
          break;
        }
      }
      return index;
    };

    // Attempts to remove a given answer from a list of trained answers. This
    // function returns the index of the answer that was removed if it was
    // successfully removed from the training data, or -1 otherwise.
    var _removeAnswerFromTrainingData = function(answer, trainingData) {
      var index = _getIndexOfTrainingData(answer, trainingData);
      if (index !== -1) {
        trainingData.splice(index, 1);
      }
      return index;
    };

    // This removes any occurrences of the answer from any training data inputs
    // or the confirmed unclassified answer list. It also removes the answer
    // from the training data being presented to the user so that it does not
    // show up again.
    var _removeAnswer = function(answer) {
      var answerGroups = responsesService.getAnswerGroups();
      var confirmedUnclassifiedAnswers = (
        responsesService.getConfirmedUnclassifiedAnswers());
      var updatedAnswerGroups = false;
      var updatedConfirmedUnclassifiedAnswers = false;

      // Remove the answer from all answer groups.
      for (var i = 0; i < answerGroups.length; i++) {
        var answerGroup = answerGroups[i];
        var ruleSpecs = answerGroup.rule_specs;
        var trainingData = null;
        var classifierIndex = -1;
        for (var j = 0; j < ruleSpecs.length; j++) {
          var ruleSpec = ruleSpecs[j];
          if (ruleSpec.rule_type === CLASSIFIER_RULESPEC_STR) {
            trainingData = ruleSpec.inputs.training_data;
            classifierIndex = j;
            break;
          }
        }
        if (trainingData &&
            _removeAnswerFromTrainingData(answer, trainingData) !== -1) {
          if (trainingData.length === 0 && ruleSpecs.length > 1) {
            // If the last of the training data for a classifier has been
            // removed and the classifier is not the only rule in the group,
            // remove the rule since it is no longer doing anything.
            ruleSpecs.splice(classifierIndex, 1);
          }
          updatedAnswerGroups = true;
        }
      }

      // Remove the answer from the confirmed unclassified answers.
      updatedConfirmedUnclassifiedAnswers = (_removeAnswerFromTrainingData(
        answer, confirmedUnclassifiedAnswers) !== -1);

      if (updatedAnswerGroups) {
        responsesService.save(
          answerGroups, responsesService.getDefaultOutcome());
      }

      if (updatedConfirmedUnclassifiedAnswers) {
        responsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
      }

      var index = _removeAnswerFromTrainingData(answer, _trainingDataAnswers);
      if (index !== -1) {
        _trainingDataCounts.splice(index, 1);
        $rootScope.$broadcast('updatedTrainingData');
      }
    };

    return {
      initializeTrainingData: function(explorationId, stateName) {
        var trainingDataUrl = '/createhandler/training_data/' + explorationId +
          '/' + encodeURIComponent(stateName);
        $http.get(trainingDataUrl).then(function(response) {
          var unhandledAnswers = response.data.unhandled_answers;
          _trainingDataAnswers = [];
          _trainingDataCounts = [];
          for (var i = 0; i < unhandledAnswers.length; i++) {
            var unhandledAnswer = unhandledAnswers[i];
            _trainingDataAnswers.push(unhandledAnswer.value);
            _trainingDataCounts.push(unhandledAnswer.count);
          }
          $rootScope.$broadcast('updatedTrainingData');
        });
      },

      getTrainingDataAnswers: function() {
        return _trainingDataAnswers;
      },

      getTrainingDataCounts: function() {
        return _trainingDataCounts;
      },

      getAllPotentialOutcomes: function(state) {
        var potentialOutcomes = [];
        var interaction = state.interaction;

        for (var i = 0; i < interaction.answer_groups.length; i++) {
          potentialOutcomes.push(interaction.answer_groups[i].outcome);
        }

        if (interaction.default_outcome) {
          var outcome = interaction.default_outcome;
          potentialOutcomes.push(interaction.default_outcome);
        }

        return potentialOutcomes;
      },

      trainAnswerGroup: function(answerGroupIndex, answer) {
        _removeAnswer(answer);

        var answerGroup = responsesService.getAnswerGroup(answerGroupIndex);
        var rules = answerGroup.rule_specs;

        // Ensure the answer group has a classifier rule.
        var classifierRule = null;
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i];
          if (rule.rule_type === CLASSIFIER_RULESPEC_STR) {
            classifierRule = rule;
            break;
          }
        }
        if (!classifierRule) {
          // Create new classifier rule for classification. All classifiers
          // should match this schema.
          classifierRule = angular.copy(DEFAULT_CLASSIFIER_RULE_SPEC);
          rules.push(classifierRule);
        }

        // Train the rule to include this answer, but only if it's not already
        // in the training data.
        if (_getIndexOfTrainingData(
            answer, classifierRule.inputs.training_data) === -1) {
          classifierRule.inputs.training_data.push(answer);
        }

        responsesService.updateAnswerGroup(answerGroupIndex, {
          rules: rules
        });
      },

      trainDefaultResponse: function(answer) {
        _removeAnswer(answer);

        var confirmedUnclassifiedAnswers = (
          responsesService.getConfirmedUnclassifiedAnswers());

        if (_getIndexOfTrainingData(
              answer, confirmedUnclassifiedAnswers) === -1) {
          confirmedUnclassifiedAnswers.push(answer);
        }

        responsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
      }
    };
  }
]);

oppia.directive('trainingPanel', [function() {
  return {
    restrict: 'E',
    scope: {
      answer: '=',
      answerFeedback: '=',
      answerOutcomeDest: '=',
      // The classification input is an object with two keys:
      //   -answerGroupIndex: This refers to which answer group the answer being
      //      trained has been classified to (for displaying feedback to the
      //      creator). If answerGroupIndex is equal to the number of answer
      //      groups, then it represents the default outcome feedback. This
      //      index is changed by the panel when the creator specifies which
      //      feedback should be associated with the answer.
      //   -newOutcome: This refers to an outcome structure (containing a list
      //      of feedback and a destination state name) which is non-null if,
      //      and only if, the creator has specified that a new response should
      //      be created for the trained answer.
      classification: '=',
      onFinishTraining: '&'
    },
    templateUrl: 'teaching/trainingPanel',
    controller: [
      '$scope', 'oppiaExplorationHtmlFormatterService', 'editorContextService',
      'explorationStatesService', 'trainingDataService', 'responsesService',
      'stateInteractionIdService', 'stateCustomizationArgsService',
      function($scope, oppiaExplorationHtmlFormatterService,
          editorContextService, explorationStatesService, trainingDataService,
          responsesService, stateInteractionIdService,
          stateCustomizationArgsService) {
        $scope.changingAnswerGroupIndex = false;
        $scope.addingNewResponse = false;

        var _stateName = editorContextService.getActiveStateName();
        var _state = explorationStatesService.getState(_stateName);
        $scope.allOutcomes = trainingDataService.getAllPotentialOutcomes(
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
          $scope.classification.newOutcome = {
            dest: editorContextService.getActiveStateName(),
            feedback: [''],
            param_changes: []
          };
          $scope.addingNewResponse = true;
        };

        $scope.confirmAnswerGroupIndex = function(index) {
          $scope.classification.answerGroupIndex = index;

          if (index === responsesService.getAnswerGroupCount()) {
            trainingDataService.trainDefaultResponse($scope.answer);
          } else {
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };
        $scope.confirmNewFeedback = function() {
          if ($scope.classification.newOutcome) {
            // Create a new answer group with the given feedback.
            var answerGroups = responsesService.getAnswerGroups();
            answerGroups.push({
              rule_specs: [],
              outcome: angular.copy($scope.classification.newOutcome)
            });
            responsesService.save(
              answerGroups, responsesService.getDefaultOutcome());

            // Train the group with the answer.
            var index = responsesService.getAnswerGroupCount() - 1;
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };
      }
    ]
  };
}]);
