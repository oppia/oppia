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
 * @fileoverview Directive for the solution editor.
 */

oppia.directive('solutionEditor', [
  '$uibModal', 'UrlInterpolationService', 'stateSolutionService',
  'EditorStateService', 'ExplorationStatesService',
  'ExplorationWarningsService', 'AlertsService',
  'SolutionObjectFactory', 'SolutionVerificationService',
  'ContextService', 'ExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateCustomizationArgsService',
  'INFO_MESSAGE_SOLUTION_IS_INVALID',
  function($uibModal, UrlInterpolationService, stateSolutionService,
      EditorStateService, ExplorationStatesService,
      ExplorationWarningsService, AlertsService,
      SolutionObjectFactory, SolutionVerificationService,
      ContextService, ExplorationHtmlFormatterService,
      stateInteractionIdService, stateCustomizationArgsService,
      INFO_MESSAGE_SOLUTION_IS_INVALID) {
    return {
      restrict: 'E',
      scope: {
        getInteractionId: '&interactionId',
        correctAnswerEditorHtml: '=',
        onOpenSolutionEditor: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/solution_editor_directive.html'),
      controller: [
        '$scope', 'stateSolutionService',
        function($scope, stateSolutionService) {
          $scope.stateSolutionService = stateSolutionService;

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.getAnswerHtml = function() {
            return ExplorationHtmlFormatterService.getAnswerHtml(
              stateSolutionService.savedMemento.correctAnswer,
              stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento);
          };
        }
      ]
    };
  }
]);
