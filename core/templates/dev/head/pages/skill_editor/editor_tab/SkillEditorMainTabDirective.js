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
 * @fileoverview Controller for the main tab of the skill editor.
 */

oppia.directive('skillEditorMainTab', [
  'UrlInterpolationService', 'SkillEditorStateService',
  function(UrlInterpolationService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_editor_main_tab_directive.html'),
      controller: [
        '$scope', 'SkillEditorStateService',
        function($scope, SkillEditorStateService) {
          $scope.hasLoadedSkill = SkillEditorStateService.hasLoadedSkill;
        }
      ]
    };
  }
]);
