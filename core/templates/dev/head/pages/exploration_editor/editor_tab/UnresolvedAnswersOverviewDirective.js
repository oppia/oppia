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

// TODO(brianrodri): Add all other interaction IDs to this list, then remove
// the list altogether.
oppia.constant('SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS', ['TextInput']);

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
        'StateTopAnswersStatsService',
        'SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS',
        function(
            $scope, $rootScope, $uibModal, EditorStateService,
            ExplorationStatesService, StateRulesStatsService,
            ExplorationRightsService, stateInteractionIdService,
            INTERACTION_SPECS, EditabilityService,
            StateTopAnswersStatsService,
            SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS) {
          var MAXIMUM_UNRESOLVED_ANSWERS = 5;
          var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          $scope.unresolvedAnswersData = null;
          $scope.latestRefreshDate = new Date();
          $scope.unresolvedAnswersOverviewIsShown = false;

          $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
            GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS);

          /**
           * @returns {boolean} - answers from this state can be rendered with
           * HTML.
           */
          var isStateInteractionIdHtmlRenderable = function() {
            var state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName());
            return (!!state &&
              SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS.indexOf(
                state.interaction.id) !== -1);
          };

          $scope.isUnresolvedAnswersOverviewShown = function() {
            return (
              StateTopAnswersStatsService.hasStateStats(
                EditorStateService.getActiveStateName()) &&
              isStateInteractionIdHtmlRenderable());
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
                '$scope', '$injector', '$uibModalInstance', '$http', '$filter',
                'ExplorationHtmlFormatterService', 'TrainingModalService',
                'stateInteractionIdService', 'stateCustomizationArgsService',
                'ExplorationContextService', 'EditorStateService',
                'ExplorationStatesService', 'TrainingDataService',
                'AnswerClassificationService', 'EXPLICIT_CLASSIFICATION',
                'UrlInterpolationService', 'TRAINING_DATA_CLASSIFICATION',
                'AngularNameService', 'DEFAULT_OUTCOME_CLASSIFICATION',
                'AlertsService',
                function(
                    $scope, $injector, $uibModalInstance, $http, $filter,
                    ExplorationHtmlFormatterService, TrainingModalService,
                    stateInteractionIdService, stateCustomizationArgsService,
                    ExplorationContextService, EditorStateService,
                    ExplorationStatesService, TrainingDataService,
                    AnswerClassificationService, EXPLICIT_CLASSIFICATION,
                    UrlInterpolationService, TRAINING_DATA_CLASSIFICATION,
                    AngularNameService, DEFAULT_OUTCOME_CLASSIFICATION,
                    AlertsService) {
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

                  // Timeout for the toast that is shown when a response has
                  // been confirmed or fixed.
                  var TOAST_TIMEOUT = 2000;

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
                    var truncatedAnswer = $filter(
                      'truncateInputBasedOnInteractionAnswerType')(
                      answer.answer, interactionId, 12);
                    var successToast = (
                      'The answer ' + truncatedAnswer +
                      ' has been successfully trained.');

                    if (classificationType === DEFAULT_OUTCOME_CLASSIFICATION) {
                      TrainingDataService.associateWithDefaultResponse(
                        answer.answer);
                      AlertsService.addSuccessMessage(
                        successToast, TOAST_TIMEOUT);
                      return;
                    }

                    TrainingDataService.associateWithAnswerGroup(
                      answer.classificationResult.answerGroupIndex,
                      answer.answer);
                    AlertsService.addSuccessMessage(
                      successToast, TOAST_TIMEOUT);
                  };

                  $scope.openTrainUnresolvedAnswerModal = function(
                      answerIndex) {
                    var selectedAnswerIndex = answerIndex;
                    var unresolvedAnswer = (
                      $scope.unresolvedAnswers[answerIndex]);
                    var answer = unresolvedAnswer.answer;
                    var answerGroupIndex = (
                      unresolvedAnswer.classificationResult.answerGroupIndex);
                    return TrainingModalService.openTrainUnresolvedAnswerModal(
                      answer, function() {
                        $scope.unresolvedAnswers.splice(selectedAnswerIndex, 1);
                        var truncatedAnswer = $filter(
                          'truncateInputBasedOnInteractionAnswerType')(
                          answer, interactionId, 12);
                        var successToast = (
                          'The response for ' + truncatedAnswer +
                          ' has been fixed.');
                        AlertsService.addSuccessMessage(
                          successToast, TOAST_TIMEOUT);
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

          $scope.getUnresolvedStateStats = function() {
            return StateTopAnswersStatsService.getUnresolvedStateStats(
              EditorStateService.getActiveStateName());
          };
        }
      ]
    };
  }]);
