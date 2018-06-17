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
 * @fileoverview Directive for the state graph visualization.
 */

oppia.directive('unresolvedAnswersOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'unresolved_answers_overview_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'EditorStateService',
        'ExplorationStatesService', 'StateRulesStatsService',
        'ExplorationRightsService', 'stateInteractionIdService',
        'INTERACTION_SPECS', 'EditabilityService',
        function(
            $scope, $rootScope, $uibModal, EditorStateService,
            ExplorationStatesService, StateRulesStatsService,
            ExplorationRightsService, stateInteractionIdService,
            INTERACTION_SPECS, EditabilityService) {
          var MAXIMUM_UNRESOLVED_ANSWERS = 5;
          var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          $scope.unresolvedAnswersData = null;
          $scope.latestRefreshDate = new Date();
          $scope.unresolvedAnswersOverviewIsShown = false;

          $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
            GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS);

          $scope.computeUnresolvedAnswers = function() {
            var state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName()
            );

            if (!StateRulesStatsService.stateSupportsIssuesOverview(state)) {
              $scope.unresolvedAnswersData = [];
            } else {
              StateRulesStatsService.computeStateRulesStats(
                state
              ).then(function(stats) {
                var calculatedUnresolvedAnswersData = [];

                for (var i = 0; i < stats.visualizations_info.length; ++i) {
                  var vizInfo = stats.visualizations_info[i];
                  if (!vizInfo.addressed_info_is_supported) {
                    continue;
                  }

                  // NOTE: vizInfo.data is already sorted in descending order by
                  // frequency.
                  for (var j = 0; j < vizInfo.data.length; ++j) {
                    var answer = vizInfo.data[j];
                    if (answer.is_addressed ||
                        answer.frequency <
                          MINIMUM_UNRESOLVED_ANSWER_FREQUENCY) {
                      continue;
                    }

                    calculatedUnresolvedAnswersData.push(answer);
                    if (calculatedUnresolvedAnswersData.length >=
                          MAXIMUM_UNRESOLVED_ANSWERS) {
                      break;
                    }
                  }

                  // Will only take the answers from first eligible
                  // visualization.
                  break;
                }

                $scope.unresolvedAnswersData = calculatedUnresolvedAnswersData;
                $scope.latestRefreshDate = new Date();
              });
            }
          };

          $scope.getCurrentInteractionId = function() {
            return stateInteractionIdService.savedMemento;
          };

          $scope.isCurrentInteractionLinear = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          $scope.isCurrentInteractionTrainable = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return (
              interactionId &&
              INTERACTION_SPECS[interactionId].is_trainable);
          };

          $scope.isEditableOutsideTutorialMode = function() {
            return EditabilityService.isEditableOutsideTutorialMode();
          };

          $scope.openTeachOppiaModal = function() {
            $rootScope.$broadcast('externalSave');

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'teach_oppia_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$injector', '$uibModalInstance', '$http',
                'ExplorationHtmlFormatterService', 'TrainingModalService',
                'stateInteractionIdService', 'stateCustomizationArgsService',
                'ExplorationContextService', 'EditorStateService',
                'ExplorationStatesService', 'TrainingDataService',
                'AnswerClassificationService', 'EXPLICIT_CLASSIFICATION',
                'UrlInterpolationService', 'TRAINING_DATA_CLASSIFICATION',
                'AngularNameService', 'DEFAULT_OUTCOME_CLASSIFICATION',
                function(
                    $scope, $injector, $uibModalInstance, $http,
                    ExplorationHtmlFormatterService, TrainingModalService,
                    stateInteractionIdService, stateCustomizationArgsService,
                    ExplorationContextService, EditorStateService,
                    ExplorationStatesService, TrainingDataService,
                    AnswerClassificationService, EXPLICIT_CLASSIFICATION,
                    UrlInterpolationService, TRAINING_DATA_CLASSIFICATION,
                    AngularNameService, DEFAULT_OUTCOME_CLASSIFICATION) {
                  var _explorationId = (
                    ExplorationContextService.getExplorationId());
                  var _stateName = EditorStateService.getActiveStateName();
                  var _state = ExplorationStatesService.getState(_stateName);
                  var interactionId = stateInteractionIdService.savedMemento;

                  var rulesServiceName = (
                    AngularNameService.getNameOfInteractionRulesService(
                      interactionId));

                  // Inject RulesService dynamically.
                  var rulesService = $injector.get(rulesServiceName);

                  var fetchAndShowUnresolvedAnswers = function(
                      expId, stateName) {
                    var unresolvedAnswersUrl = (
                      UrlInterpolationService.interpolateUrl(
                        '/createhandler/get_top_unresolved_answers/' +
                        '<exploration_id>', {
                          exploration_id: expId
                        }));
                    $http.get(unresolvedAnswersUrl, {
                      params: {
                        state_name: stateName
                      }
                    }).success(function(response) {
                      $scope.showUnresolvedAnswers(response.unresolved_answers);
                    }).error(function(response) {
                      $log.error(
                        'Error occurred while fetching unresolved answers ' +
                        'for exploration ' + _explorationId + 'state ' +
                        _stateName + ': ' + response);
                      $scope.showUnresolvedAnswers([]);
                    });
                  };

                  $scope.showUnresolvedAnswers = function(unresolvedAnswers) {
                    $scope.loadingDotsAreShown = false;
                    $scope.unresolvedAnswers = [];

                    unresolvedAnswers.forEach(function(item) {
                      var acs = AnswerClassificationService;
                      var answer = item.answer;
                      var classificationResult = (
                        acs.getMatchingClassificationResult(
                          _explorationId, _stateName, _state, answer,
                          rulesService));
                      var classificationType = (
                        classificationResult.classificationCategorization);
                      if (classificationType !== EXPLICIT_CLASSIFICATION &&
                        classificationType !== TRAINING_DATA_CLASSIFICATION &&
                        !TrainingDataService.isConfirmedUnclassifiedAnswer(
                          answer)) {
                        var answerTemplate = (
                          ExplorationHtmlFormatterService.getAnswerHtml(
                            answer, stateInteractionIdService.savedMemento,
                            stateCustomizationArgsService.savedMemento));
                        var feedbackHtml = (
                          classificationResult.outcome.feedback.getHtml());
                        $scope.unresolvedAnswers.push({
                          answer: answer,
                          answerTemplate: answerTemplate,
                          classificationResult: classificationResult,
                          feedbackHtml: feedbackHtml
                        });
                      }
                    });
                  };

                  $scope.confirmAnswerAssignment = function(answerIndex) {
                    answer = $scope.unresolvedAnswers[answerIndex];
                    $scope.unresolvedAnswers.splice(answerIndex, 1);
                    var classificationType = (
                      answer.classificationResult.classificationCategorization);
                    if (classificationType === DEFAULT_OUTCOME_CLASSIFICATION) {
                      TrainingDataService.associateWithDefaultResponse(
                        answer.answer);
                      return;
                    }

                    TrainingDataService.associateWithAnswerGroup(
                      answer.classificationResult.answerGroupIndex,
                      answer.answer);
                  };

                  $scope.openTrainUnresolvedAnswerModal = function(
                      answerIndex) {
                    var selectedAnswerIndex = answerIndex;
                    answer = $scope.unresolvedAnswers[answerIndex].answer;
                    return TrainingModalService.openTrainUnresolvedAnswerModal(
                      answer, function() {
                        $scope.unresolvedAnswers.splice(selectedAnswerIndex, 1);
                      });
                  };

                  $scope.finishTeaching = function(reopen) {
                    $uibModalInstance.dismiss();
                  };

                  $scope.loadingDotsAreShown = true;
                  fetchAndShowUnresolvedAnswers(_explorationId, _stateName);
                }]
            });
          };

          $scope.$on('refreshStateEditor', function() {
            $scope.unresolvedAnswersOverviewIsShown = (
              ExplorationRightsService.isPublic());
            if ($scope.unresolvedAnswersOverviewIsShown) {
              $scope.computeUnresolvedAnswers();
            }
          });
        }
      ]
    };
  }]);
