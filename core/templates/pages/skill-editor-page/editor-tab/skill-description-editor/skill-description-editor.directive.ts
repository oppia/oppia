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

require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('skillDescriptionEditor', [
  'SkillEditorStateService', 'SkillObjectFactory', 'SkillUpdateService',
  'UrlInterpolationService', 'MAX_CHARS_IN_SKILL_DESCRIPTION',
  function(
      SkillEditorStateService, SkillObjectFactory, SkillUpdateService,
      UrlInterpolationService, MAX_CHARS_IN_SKILL_DESCRIPTION) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-description-editor/' +
        'skill-description-editor.directive.html'),
      controller: [
        '$scope',
        function($scope) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          $scope.MAX_CHARS_IN_SKILL_DESCRIPTION = (
            MAX_CHARS_IN_SKILL_DESCRIPTION);
          $scope.canEditSkillDescription = function() {
            return $scope.skillRights.canEditSkillDescription();
          };

          $scope.resetErrorMsg = function() {
            $scope.errorMsg = '';
          };

          $scope.saveSkillDescription = function(newSkillDescription) {
            if (newSkillDescription === $scope.skill.getDescription()) {
              return;
            }
            if (SkillObjectFactory.hasValidDescription(
              newSkillDescription)) {
              $scope.skillDescriptionEditorIsShown = false;
              SkillUpdateService.setSkillDescription(
                $scope.skill,
                newSkillDescription);
            } else {
              $scope.errorMsg = (
                'Please use a non-empty description consisting of ' +
                'alphanumeric characters, spaces and/or hyphens.');
            }
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.tmpSkillDescription = $scope.skill.getDescription();
            $scope.skillRights = SkillEditorStateService.getSkillRights();
            $scope.errorMsg = '';
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => $scope.tmpSkillDescription = $scope.skill.getDescription()
              )
            );
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }
      ]
    };
  }
]);
