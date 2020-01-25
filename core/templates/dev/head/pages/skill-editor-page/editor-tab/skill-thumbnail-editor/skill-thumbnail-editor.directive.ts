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

require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillThumbnailEditor', [
  'SkillEditorStateService', 'SkillUpdateService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-thumbnail-editor/' +
        'skill-thumbnail-editor.directive.html'),
      controller: [
        '$scope', 'EVENT_SKILL_REINITIALIZED',
        function($scope, EVENT_SKILL_REINITIALIZED) {
          var ctrl = this;

          $scope.updateThumbnailFilename = function(newThumbnailFilename) {
            if (newThumbnailFilename === $scope.skill.getThumbnailFilename()) {
              return;
            }
            SkillUpdateService.setThumbnailFilename(
              $scope.skill, newThumbnailFilename);
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.editableThumbnailFilename = (
              $scope.skill.getThumbnailFilename());
            $scope.$on(EVENT_SKILL_REINITIALIZED, function() {
              $scope.editableThumbnailFilename = (
                $scope.skill.getThumbnailFilename());
            });
          };
        }
      ]
    };
  }
]);
