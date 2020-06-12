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
 * @fileoverview Directive for the skill rubric editor.
 */

require('domain/skill/RubricObjectFactory.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('skillRubricsEditor', [
  'SkillEditorStateService', 'SkillUpdateService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-rubrics-editor/' +
        'skill-rubrics-editor.directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'RubricObjectFactory',
        function(
            $scope, $filter, $uibModal, $rootScope,
            RubricObjectFactory) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          $scope.onSaveRubric = function(difficulty, explanations) {
            SkillUpdateService.updateRubricForDifficulty(
              $scope.skill, difficulty, explanations);
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.getSkillChangedSubject().subscribe(
                () => $scope.rubrics = $scope.skill.getRubrics())
            );
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }]
    };
  }
]);
