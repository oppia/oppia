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
 * @fileoverview Directive for the skill description editor.
 */

oppia.directive('skillDescriptionEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function(
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_description_editor_directive.html'),
      controller: [
        '$scope',
        function($scope) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.skillDescriptionEditorIsShown = false;

          $scope.openSkillDescriptionEditor = function() {
            $scope.skillDescriptionEditorIsShown = true;
            $scope.tmpSkillDescription = $scope.skill.getDescription();
          };

          $scope.saveSkillDescription = function(newSkillDescription) {
            $scope.skillDescriptionEditorIsShown = false;
            SkillUpdateService.setSkillDescription(
              $scope.skill,
              newSkillDescription);
          };
        }
      ]
    };
  }
]);
