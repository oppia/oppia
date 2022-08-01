// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for teach oppia modal.
 */

import { Subscription } from 'rxjs';
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-modal.service.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').controller('TeachOppiaModalController', [
  '$controller', '$filter', '$http', '$injector', '$log',
  '$scope', '$uibModalInstance', 'AlertsService',
  'AngularNameService', 'AnswerClassificationService',
  'ContextService', 'ExplorationHtmlFormatterService',
  'ExplorationStatesService', 'StateCustomizationArgsService',
  'StateEditorService', 'StateInteractionIdService',
  'TrainingDataService', 'TrainingModalService',
  'UrlInterpolationService', 'DEFAULT_OUTCOME_CLASSIFICATION',
  'EXPLICIT_CLASSIFICATION', 'TRAINING_DATA_CLASSIFICATION',
  function(
      $controller, $filter, $http, $injector, $log,
      $scope, $uibModalInstance, AlertsService,
      AngularNameService, AnswerClassificationService,
      ContextService, ExplorationHtmlFormatterService,
      ExplorationStatesService, StateCustomizationArgsService,
      StateEditorService, StateInteractionIdService,
      TrainingDataService, TrainingModalService,
      UrlInterpolationService, DEFAULT_OUTCOME_CLASSIFICATION,
      EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    var ctrl = this;
    ctrl.directiveSubscriptions = new Subscription();
    var _explorationId = (
      ContextService.getExplorationId());
    var _stateName = StateEditorService.getActiveStateName();
    var _state = ExplorationStatesService.getState(_stateName);
    var interactionId = StateInteractionIdService.savedMemento;

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
      }).then(function(response) {
        $scope.showUnresolvedAnswers(response.data.unresolved_answers);
      }, function(response) {
        $log.error(
          'Error occurred while fetching unresolved answers ' +
          'for exploration ' + _explorationId + ' state ' +
          _stateName + ': ' + response.data);
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
            _stateName, _state.interaction, answer, rulesService));
        var classificationType = (
          classificationResult.classificationCategorization);
        if (classificationType !== EXPLICIT_CLASSIFICATION &&
          classificationType !== TRAINING_DATA_CLASSIFICATION &&
          !TrainingDataService.isConfirmedUnclassifiedAnswer(
            answer)) {
          var answerTemplate = (
            ExplorationHtmlFormatterService.getAnswerHtml(
              answer, StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento));
          var feedbackHtml = (
            classificationResult.outcome.feedback.html);
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
      var unresolvedAnswer = $scope.unresolvedAnswers[answerIndex];
      $scope.unresolvedAnswers.splice(answerIndex, 1);

      var classificationType = (
        unresolvedAnswer.classificationResult.classificationCategorization);
      var truncatedAnswer = $filter(
        'truncateInputBasedOnInteractionAnswerType')(
        unresolvedAnswer.answer, interactionId, 12);
      var successToast = (
        'The answer ' + truncatedAnswer +
        ' has been successfully trained.');

      if (classificationType === DEFAULT_OUTCOME_CLASSIFICATION) {
        TrainingDataService.associateWithDefaultResponse(
          unresolvedAnswer.answer);
        AlertsService.addSuccessMessage(
          successToast, TOAST_TIMEOUT);
        return;
      }

      TrainingDataService.associateWithAnswerGroup(
        unresolvedAnswer.classificationResult.answerGroupIndex,
        unresolvedAnswer.answer);
      AlertsService.addSuccessMessage(
        successToast, TOAST_TIMEOUT);
    };

    $scope.openTrainUnresolvedAnswerModal = function(
        answerIndex) {
      var unresolvedAnswer = (
        $scope.unresolvedAnswers[answerIndex]);
      var answer = unresolvedAnswer.answer;
      return TrainingModalService.openTrainUnresolvedAnswerModal(
        answer, null, answerIndex);
    };

    $scope.loadingDotsAreShown = true;
    fetchAndShowUnresolvedAnswers(_explorationId, _stateName);

    ctrl.$onInit = function() {
      ctrl.directiveSubscriptions.add(
        TrainingModalService.onFinishTrainingCallback.subscribe(
          (finishTrainingResult) => {
            $scope.unresolvedAnswers.splice(
              finishTrainingResult.answerIndex, 1);
            var truncatedAnswer = $filter(
              'truncateInputBasedOnInteractionAnswerType')(
              finishTrainingResult.answer, interactionId, 12);
            var successToast = (
              'The response for ' + truncatedAnswer +
              ' has been fixed.');
            AlertsService.addSuccessMessage(
              successToast, TOAST_TIMEOUT);
          }));
    };

    ctrl.$onDestroy = function() {
      ctrl.directiveSubscriptions.unsubscribe();
    };
  }
]);
