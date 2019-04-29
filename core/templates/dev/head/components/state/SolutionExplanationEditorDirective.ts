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
 * @fileoverview Directive for the solution explanation editor.
 */

oppia.directive('solutionExplanationEditor', [
  'StateSolutionService', 'UrlInterpolationService',
  function(StateSolutionService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveSolution: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state/solution_explanation_editor_directive.html'),
      controller: [
        '$scope', 'EditabilityService', 'StateSolutionService',
        function($scope, EditabilityService, StateSolutionService) {
          $scope.isEditable = EditabilityService.isEditable();
          $scope.editSolutionForm = {};
          $scope.explanationEditorIsOpen = false;

          $scope.StateSolutionService = StateSolutionService;

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.openExplanationEditor = function() {
            if ($scope.isEditable) {
              $scope.explanationEditorIsOpen = true;
            }
          };

          $scope.saveThisExplanation = function() {
            var contentHasChanged = (
              StateSolutionService.displayed.explanation.getHtml() !==
              StateSolutionService.savedMemento.explanation.getHtml());
            if (contentHasChanged) {
              var solutionContentId = StateSolutionService.displayed.explanation
                .getContentId();
              $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired(
                solutionContentId);
            }
            StateSolutionService.saveDisplayedValue();
            $scope.onSaveSolution(StateSolutionService.displayed);
            $scope.explanationEditorIsOpen = false;
          };

          $scope.cancelThisExplanationEdit = function() {
            $scope.explanationEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.explanationEditorIsOpen &&
              $scope.editSolutionForm.$valid) {
              $scope.saveThisExplanation();
            }
          });
        }
      ]
    };
  }]);
