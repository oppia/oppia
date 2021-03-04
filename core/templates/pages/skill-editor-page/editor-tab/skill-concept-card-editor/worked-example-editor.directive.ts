// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the worked example editor.
 */

require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

angular.module('oppia').directive('workedExampleEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        workedExample: '=',
        getIndex: '&index',
        isEditable: '&isEditable'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
        'worked-example-editor.directive.html'),
      controller: [
        '$scope', 'SkillEditorStateService', 'SkillUpdateService',
        function($scope, SkillEditorStateService, SkillUpdateService) {
          var ctrl = this;

          $scope.openQuestionEditor = function() {
            if ($scope.isEditable()) {
              $scope.workedExampleQuestionMemento =
                angular.copy($scope.container.workedExampleQuestionHtml);
              $scope.questionEditorIsOpen = true;
            }
          };

          $scope.openExplanationEditor = function() {
            if ($scope.isEditable()) {
              $scope.workedExampleExplanationMemento =
                angular.copy($scope.container.workedExampleExplanationHtml);
              $scope.explanationEditorIsOpen = true;
            }
          };

          $scope.saveWorkedExample = function(inQuestionEditor) {
            if (inQuestionEditor) {
              $scope.questionEditorIsOpen = false;
            } else {
              $scope.explanationEditorIsOpen = false;
            }
            var contentHasChanged = ((
              $scope.workedExampleQuestionMemento !==
              $scope.container.workedExampleQuestionHtml) || (
              $scope.workedExampleExplanationMemento !==
                $scope.container.workedExampleExplanationHtml)
            );
            $scope.workedExampleQuestionMemento = null;
            $scope.workedExampleExplanationMemento = null;

            if (contentHasChanged) {
              SkillUpdateService.updateWorkedExample(
                SkillEditorStateService.getSkill(),
                $scope.getIndex(),
                $scope.container.workedExampleQuestionHtml,
                $scope.container.workedExampleExplanationHtml);
            }
          };

          $scope.cancelEditQuestion = function() {
            $scope.container.workedExampleQuestionHtml = angular.copy(
              $scope.workedExampleQuestionMemento);
            $scope.workedExampleQuestionMemento = null;
            $scope.questionEditorIsOpen = false;
          };

          $scope.cancelEditExplanation = function() {
            $scope.container.workedExampleExplanationHtml = angular.copy(
              $scope.workedExampleExplanationMemento);
            $scope.workedExampleExplanationMemento = null;
            $scope.explanationEditorIsOpen = false;
          };

          ctrl.$onInit = function() {
            $scope.questionEditorIsOpen = false;
            $scope.explanationEditorIsOpen = false;
            $scope.container = {
              workedExampleQuestionHtml:
                $scope.workedExample.getQuestion().html,
              workedExampleExplanationHtml:
                $scope.workedExample.getExplanation().html
            };

            $scope.WORKED_EXAMPLE_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };
          };
        }]
    };
  }
]);
