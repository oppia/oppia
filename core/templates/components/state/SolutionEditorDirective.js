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
  '$uibModal', 'AlertsService', 'ContextService',
  'ExplorationHtmlFormatterService', 'SolutionObjectFactory',
  'SolutionVerificationService', 'StateCustomizationArgsService',
  'StateEditorService', 'StateInteractionIdService',
  'StateSolutionService', 'UrlInterpolationService',
  function($uibModal, AlertsService, ContextService,
      ExplorationHtmlFormatterService, SolutionObjectFactory,
      SolutionVerificationService, StateCustomizationArgsService,
      StateEditorService, StateInteractionIdService,
      StateSolutionService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getInteractionId: '&interactionId',
        onSaveSolution: '=',
        correctAnswerEditorHtml: '=',
        onOpenSolutionEditor: '&',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state/solution_editor_directive.html'),
      controller: [
        '$scope', 'StateSolutionService',
        function($scope, StateSolutionService) {
          $scope.StateSolutionService = StateSolutionService;

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.getAnswerHtml = function() {
            return ExplorationHtmlFormatterService.getAnswerHtml(
              StateSolutionService.savedMemento.correctAnswer,
              StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento);
          };
        }
      ]
    };
  }
]);
