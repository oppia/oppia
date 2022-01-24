// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for add or update solution modal.
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
  'state-interaction-id.service.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service.ts');
require('services/context.service.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').controller('AddOrUpdateSolutionModalController', [
  '$controller', '$rootScope', '$scope', '$uibModalInstance', 'ContextService',
  'CurrentInteractionService', 'ExplorationHtmlFormatterService',
  'SolutionObjectFactory', 'StateCustomizationArgsService',
  'StateInteractionIdService', 'StateSolutionService',
  'COMPONENT_NAME_SOLUTION', 'INTERACTION_SPECS',
  function(
      $controller, $rootScope, $scope, $uibModalInstance, ContextService,
      CurrentInteractionService, ExplorationHtmlFormatterService,
      SolutionObjectFactory, StateCustomizationArgsService,
      StateInteractionIdService, StateSolutionService,
      COMPONENT_NAME_SOLUTION, INTERACTION_SPECS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    var ctrl = this;
    $scope.directiveSubscriptions = new Subscription();
    $scope.StateSolutionService = StateSolutionService;
    $scope.savedMemento = () => {
      return StateSolutionService.savedMemento?.correctAnswer;
    };
    $scope.correctAnswerEditorHtml = (
      ExplorationHtmlFormatterService.getInteractionHtml(
        StateInteractionIdService.savedMemento,
        StateCustomizationArgsService.savedMemento,
        false,
        $scope.SOLUTION_EDITOR_FOCUS_LABEL,
        $scope.savedMemento() ? 'savedMemento()' : null));
    $scope.EXPLANATION_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          ContextService.getEntityType() === 'question')
      }
    };

    $scope.answerIsValid = false;

    var EMPTY_SOLUTION_DATA = {
      answerIsExclusive: false,
      correctAnswer: null,
      explanationHtml: '',
      explanationContentId: COMPONENT_NAME_SOLUTION
    };

    $scope.data = StateSolutionService.savedMemento ? {
      answerIsExclusive: (
        StateSolutionService.savedMemento.answerIsExclusive),
      correctAnswer: null,
      explanationHtml: (
        StateSolutionService.savedMemento.explanation.html),
      explanationContentId: (
        StateSolutionService.savedMemento.explanation
          .contentId)
    } : angular.copy(EMPTY_SOLUTION_DATA);

    $scope.onSubmitFromSubmitButton = function() {
      CurrentInteractionService.submitAnswer();
    };

    $scope.isSubmitButtonDisabled = (
      CurrentInteractionService.isSubmitButtonDisabled);

    CurrentInteractionService.setOnSubmitFn(function(answer) {
      $scope.data.correctAnswer = answer;
    });

    $scope.shouldAdditionalSubmitButtonBeShown = function() {
      var interactionSpecs = INTERACTION_SPECS[
        StateInteractionIdService.savedMemento];
      return interactionSpecs.show_generic_submit_button;
    };

    $scope.isSolutionExplanationLengthExceeded = function(solExplanation) {
      // TODO(#13764): Edit this check after appropriate limits are found.
      return (solExplanation.length > 100000);
    };

    $scope.saveSolution = function() {
      if (typeof $scope.data.answerIsExclusive === 'boolean' &&
          $scope.data.correctAnswer !== null &&
          $scope.data.explanation !== '') {
        $uibModalInstance.close({
          solution: SolutionObjectFactory.createNew(
            $scope.data.answerIsExclusive,
            $scope.data.correctAnswer,
            $scope.data.explanationHtml,
            $scope.data.explanationContentId)
        });
      } else {
        throw new Error('Cannot save invalid solution');
      }
    };

    ctrl.$onInit = function() {
      $scope.directiveSubscriptions.add(
        // TODO(#11996): Remove when migrating to Angular2+.
        CurrentInteractionService.onAnswerChanged$.subscribe(() => {
          $rootScope.$applyAsync();
        })
      );
    };

    $scope.$on('$destroy', function() {
      $scope.directiveSubscriptions.unsubscribe();
    });
  }
]);
