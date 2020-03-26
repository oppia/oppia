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
        isEditable: '&isEditable',
        getOnSaveFn: '&onSave',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
        'worked-example-editor.directive.html'),
      controller: [
        '$scope', 'SkillUpdateService', 'SkillEditorStateService',
        function($scope, SkillUpdateService, SkillEditorStateService) {
          var ctrl = this;
          $scope.openEditor = function() {
            if ($scope.isEditable()) {
              $scope.workedExampleMemento =
                angular.copy($scope.container.workedExampleHtml);
              $scope.editorIsOpen = true;
            }
          };

          $scope.saveWorkedExample = function() {
            $scope.editorIsOpen = false;
            var contentHasChanged = (
              $scope.workedExampleMemento !==
              $scope.container.workedExampleHtml);
            $scope.workedExampleMemento = null;

            if (contentHasChanged) {
              SkillUpdateService.updateWorkedExample(
                SkillEditorStateService.getSkill(),
                $scope.getIndex(),
                $scope.container.workedExampleHtml);
              $scope.getOnSaveFn()();
            }
          };

          $scope.cancelEdit = function() {
            $scope.container.workedExampleHtml = angular.copy(
              $scope.workedExampleMemento);
            $scope.workedExampleMemento = null;
            $scope.editorIsOpen = false;
          };

          ctrl.$onInit = function() {
            $scope.editorIsOpen = false;
            $scope.container = {
              workedExampleHtml: $scope.workedExample.getHtml()
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
