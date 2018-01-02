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
  'UrlInterpolationService', 'stateSolutionService',
  function(UrlInterpolationService, stateSolutionService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/solution_explanation_editor_directive.html'),
      controller: [
        '$scope', 'editabilityService', 'stateSolutionService',
        'COMPONENT_NAME_SOLUTION',
        function($scope, editabilityService, stateSolutionService,
            COMPONENT_NAME_SOLUTION) {
          $scope.isEditable = editabilityService.isEditable();

          $scope.editSolutionForm = {};
          $scope.explanationEditorIsOpen = false;

          $scope.stateSolutionService = stateSolutionService;
          $scope.COMPONENT_NAME_SOLUTION = COMPONENT_NAME_SOLUTION;

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
            stateSolutionService.saveDisplayedValue();
            $scope.explanationEditorIsOpen = false;
          };

          $scope.cancelThisExplanationEdit = function() {
            $scope.explanationEditorIsOpen = false;
          };

          $scope.onAudioTranslationsStartEditAction = function() {
            // Close the content editor and save all existing changes to the
            // HTML.
            if ($scope.explanationEditorIsOpen) {
              $scope.saveThisExplanation();
            }
          };

          $scope.onAudioTranslationsEdited = function() {
            stateSolutionService.saveDisplayedValue();
          };

          $scope.$on('externalSave', function() {
            if ($scope.explanationEditorIsOpen &&
              $scope.editSolutionForm.$valid) {
              $scope.saveThisSolution();
            }
          });
        }
      ]
    };
  }]);
