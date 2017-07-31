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
  'UrlInterpolationService', 'stateSolutionService',
  function(UrlInterpolationService, stateSolutionService) {
    return {
      restrict: 'E',
      scope: {
        // Some correct answer templates are created manually based on the
        // ObjectType while others are directly passed in
        // correctAnswerEditorHtml. If a correct answer template is manually
        // constructed the correctAnswerEditorHtml will be null.
        getObjectType: '&objectType',
        correctAnswerEditorHtml: '=',
        getOnSaveFn: '&onSave'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/solution_editor_directive.html'),
      controller: [
        '$scope', 'editabilityService', 'stateSolutionService',
        function($scope, editabilityService, stateSolutionService) {
          $scope.isEditable = editabilityService.isEditable();

          $scope.editSolutionForm = {};
          $scope.stateSolutionService = stateSolutionService;
          $scope.solutionEditorIsOpen = false;
          $scope.solutionCorrectAnswerEditorHtml = '';

          $scope.init = function() {
            if (!$scope.correctAnswerEditorHtml) {
              $scope.correctAnswerEditorHtml = (
                stateSolutionService.displayed.getObjectEditorHtml(
                  $scope.getObjectType()));
            }
          };

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.openSolutionEditor = function() {
            if ($scope.isEditable) {
              $scope.solutionEditorIsOpen = true;
            }
          };

          $scope.submitAnswer = function(answer) {
            // This function sets correctAnswer. correctAnswerEditorHtml calls
            // this function when an answer is input.
            stateSolutionService.displayed.setCorrectAnswer(answer);
          };

          $scope.saveThisSolution = function() {
            $scope.solutionEditorIsOpen = false;
            $scope.getOnSaveFn()();
          };

          $scope.cancelThisSolutionEdit = function() {
            $scope.solutionEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.solutionEditorIsOpen &&
              $scope.editSolutionForm.$valid) {
              $scope.saveThisSolution();
            }
          });

          $scope.init();
        }
      ]
    };
  }]);
